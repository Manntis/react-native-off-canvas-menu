import React, { Component } from "react";
import {
  Dimensions,
  Image,
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  BackAndroid
} from "react-native";

import { Text } from "native-base";

//## TODO: Sad to include app modules here, but don't want to refactor the off-canvas menu for my needs at this moment
import { BackgroundImage } from "../../src/components";

// validate props
type Props = {
  active: boolean,
  onMenuItemPress: (index: number) => {},
  //## TODO: consider a simple default version that toggle's the menu visibility internally
  //## TODO: while leaving the hook for advanced toggle behaviors (or emit a toggle event)
  toggleMenu: () => {},
  menuItems: [],
  backgroundColor: string,
  menuTextStyles: {},
  handleBackPress: boolean,
  //-- following props affect visualization of the menu revealing
  animationDuration: number,
  //## TODO: consider having which side be configurable
  leftOffsetInPixels: number,
  perspective: number,
  rotationInDegrees: number,
  scaleInDecimalPercent: number,
  renderItem: { title: string, route: string, icon: React$Element }
};

class OffCanvas3D extends Component<Props> {
  activityLeftPos = new Animated.Value(0);
  scaleSize = new Animated.Value(1.0);
  rotate = new Animated.Value(0);
  animatedStagArr = [];

  constructor(props) {
    super(props);

    this._hardwareBackHandler = this._hardwareBackHandler.bind(this);

    const stagArrNew = [];
    for (let i = 0; i < this.props.menuItems.length; i++) stagArrNew.push(i);

    const animatedStagArrNew = [];
    stagArrNew.forEach(value => {
      animatedStagArrNew[value] = new Animated.Value(0);
    });

    this.state = {
      animationDuration: this.props.animationDuration,
      stagArr: stagArrNew,
      menuItems: this.props.menuItems
    };

    //-- put animated values locally instead of in state, in state forces too many re renders when animating can be done natively
    this.activityLeftPos = new Animated.Value(0);
    this.scaleSize = new Animated.Value(1.0);
    this.rotate = new Animated.Value(0);
    this.animatedStagArr = animatedStagArrNew;
  }

  componentDidMount() {}

  // any update to component will fire the animation
  componentDidUpdate() {
    this._animateStuffs();
    //## TODO: rebuild stagArr as needed and synchronize with animatedStagArr like done in constructor

    // //## TODO: BackAndroid deprecated BackHandler instead
    // if(this.props.handleBackPress && this.props.active) {
    //   BackAndroid.addEventListener('hardwareBackPress', this._hardwareBackHandler)
    // }

    // if(this.props.handleBackPress && !this.props.active) {
    //   BackAndroid.removeEventListener('hardwareBackPress', this._hardwareBackHandler)
    // }
  }

  // press on any menu item, render the respective scene
  _handleItemPress(index) {
    //-- call back with the index of the menu item that was selected for external handling
    this.props.onMenuItemPress(index);
  }

  _hardwareBackHandler() {
    this.props.toggleMenu();
    return true;
  }

  // control swipe left or right reveal for menu
  _gestureControl(evt) {
    const { locationX, pageX } = evt.nativeEvent;

    if (!this.props.active) {
      if (locationX < 40 && pageX > 100) {
        this.props.toggleMenu();
      }
    } else if (pageX) {
      this.props.toggleMenu();
    }
  }

  // animate stuffs with hard coded values for fine tuning
  _animateStuffs() {
    //## TODO: clean up this to and from logic pieces into cleaner divisions
    //## TODO: most of these timings, could be set custom but they're largely related
    //## TODO: and could define themselves relative to an overall setting
    //## TODO: also the speed at which the menu items come or go matters on how many
    //## TODO: there are (stagger adds up yo) and rendering size (too wide = probs too)
    const activityLeftPos = this.props.active
      ? this.props.leftOffsetInPixels
      : 0;
    const animScreenMoveDelay = this.props.active ? 0 : 100;
    const animStaggerGap = this.props.active ? 25 : 0;
    const scaleSize = this.props.active ? this.props.scaleInDecimalPercent : 1;
    const rotate = this.props.active ? 1 : 0;
    const menuTranslateX = this.props.active
      ? this.props.leftOffsetInPixels
      : -1 * this.props.leftOffsetInPixels;

    //## TODO: adjust os top nav color based on bg or explicitly adjust from props
    //## TODO: (e.g.) white text over black or vice versa
    Animated.parallel([
      Animated.timing(this.activityLeftPos, {
        delay: animScreenMoveDelay,
        toValue: activityLeftPos,
        duration: this.animationDuration
      }),
      Animated.timing(this.scaleSize, {
        delay: animScreenMoveDelay,
        toValue: scaleSize,
        duration: this.animationDuration
      }),
      Animated.timing(this.rotate, {
        delay: animScreenMoveDelay,
        toValue: rotate,
        duration: this.animationDuration
      }),
      //## TODO: make all these timings optional
      Animated.stagger(
        animStaggerGap,
        this.state.stagArr.map(item => {
          //-- delay the fly in time as a more pleasing animation with screen moving as well
          if (this.props.active) {
            return Animated.timing(this.animatedStagArr[item], {
              toValue: menuTranslateX,
              duration: this.animationDuration,
              delay: 50
            });
          }
          //-- the returning animation needs to happen fast and before the screen comes sliding back into place
          return Animated.timing(this.animatedStagArr[item], {
            toValue: menuTranslateX,
            duration: this.animationDuration,
            delay: 0
          });
        })
      )
    ]).start();
  }

  render() {
    let rotateAsStr;
    if (this.props.rotationInDegrees) {
      rotateAsStr = `${this.props.rotationInDegrees}deg`;
    } else {
      rotateAsStr = "0deg";
    }

    const interpolatedRotateVal = this.rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", rotateAsStr]
    });
    const staggeredAnimatedMenus = this.state.stagArr.map(index => {
      const currItem = this.state.menuItems[index];
      let toRender;
      if (currItem.separator) {
        toRender = (
          <Animated.View
            key={`${index}_SeparatorKey`}
            style={{
              borderBottomColor: "#E0E0E0",
              borderBottomWidth: StyleSheet.hairlineWidth,
              left: -1 * this.props.leftOffsetInPixels,
              //## TODO: maybe make a padding or define a menu width for this value (each menu item is its own currently)
              marginLeft: 20,
              marginRight: 20,
              width: this.props.separatorWidth,
              transform: [{ translateX: this.animatedStagArr[index] }]
            }}
          />
        );
      } else {
        toRender = (
          <Animated.View
            key={`${currItem.title}_Key`}
            style={{
              left: -1 * this.props.leftOffsetInPixels,
              transform: [{ translateX: this.animatedStagArr[index] }]
            }}
          >
            {
              //## TODO: clean up this bind without causing infinite recursive rendering :/ or always re rendering arrow functions
            }
            <TouchableWithoutFeedback
              key={index}
              onPress={this._handleItemPress.bind(this, index)}
            >
              {this.props.renderItem(currItem)}
            </TouchableWithoutFeedback>
          </Animated.View>
        );
      }
      return toRender;
    });

    return (
      <View
        style={[
          {
            flex: 1
          },
          this.props.offCanvasContainerStyle
        ]}
      >
        {/* //## TODO: really need to make this off-canvas module work friendlier with any GUI customizations instead of this tight integration */}
        <BackgroundImage type="color" />
        <View style={{ flex: 1 }}>
          {
            // This scroll view is the animated menu list
          }
          {
            //## TODO: get abackground image to work here
            // <Image
            //   source={this.props.backgroundImage}
            //   style={{
            //     ...StyleSheet.absoluteFillObject,
            //     resizeMode: 'cover',
            //   }}
            // >
            //   <ScrollView
            //     showsVerticalScrollIndicator={false}
            //     style={{
            //       ...StyleSheet.absoluteFillObject,
            //     }}
            //   >
            //     <Animated.View style={styles.menuItemsContainer}>
            //       {staggeredAnimatedMenus}
            //     </Animated.View>
            //   </ScrollView>
            // </Image>
          }
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{
              ...StyleSheet.absoluteFillObject
            }}
          >
            <Animated.View style={styles.menuItemsContainer}>
              {staggeredAnimatedMenus}
            </Animated.View>
          </ScrollView>

          {
            // This animated container holds the children and is rotated away
            //## TODO: these responders interfere with the scroll views in the children collection (scrollable lists don't work)...
            //## TODO: lockout clicking on the children controls while menu is exposed (or make that close the menu)
            //## TODO: allow drag to close the menu
            // <Animated.View
            // onStartShouldSetResponder={() => true}
            // onResponderTerminationRequest={() => true}
            // onResponderRelease={evt => this._gestureControl(evt)}
          }
          <Animated.View
            style={[
              styles.activityContainer,
              {
                flex: 1,
                backgroundColor: this.props.backgroundColor,
                transform: [
                  { perspective: this.props.perspective },
                  { translateX: this.activityLeftPos },
                  { scale: this.scaleSize },
                  { rotateY: interpolatedRotateVal }
                ]
              }
            ]}
          >
            {this.props.children}
          </Animated.View>
        </View>
      </View>
    );
  }
}

// set default props
OffCanvas3D.defaultProps = {
  backgroundColor: "#222222",
  menuTextStyles: { color: "white" },
  handleBackPress: true,
  animationDuration: 400,
  perspective: 200,
  scaleInDecimalPercent: 0.9,
  rotationInDegrees: -20,
  leftOffsetInPixels: 100,
  separatorWidth: 200
};

export default OffCanvas3D;

// structure stylesheet
const styles = StyleSheet.create({
  offCanvasContainer: {},
  menuItemsContainer: {
    paddingTop: 30
  },
  menuItemContainer: {
    paddingLeft: 20,
    flexDirection: "row",
    alignItems: "center"
  },
  menuItem: {
    fontWeight: "bold",
    paddingLeft: 12,
    paddingTop: 15,
    paddingBottom: 15
  },
  activityContainer: {}
});
