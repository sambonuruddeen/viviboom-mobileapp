import { Component, memo, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Ellipse, G, GProps, Path, Polygon, Polyline, Rect } from 'react-native-svg';

import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';

import MyImage from './MyImage';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;

const badgeImageParams = { width: 256, suffix: 'png' };

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const RandomizerSvg = memo(({ isRandomizing }: { isRandomizing: boolean }) => {
  const button = useRef(new Animated.Value(0)).current;
  const buttonRef = useRef<Component<GProps>>();

  const buttonAnimation = useCallback(
    (toValue: number) => {
      Animated.timing(button, {
        toValue,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        if (toValue !== 0) buttonAnimation(0);
      });
    },
    [button],
  );

  useEffect(() => {
    button.addListener((v) => {
      const yPosition = 367 + v.value * 64;
      buttonRef.current?.setNativeProps({ transform: [{ translateX: 246.800018 }, { translateY: yPosition }] });
    });
  }, [button]);

  useEffect(() => {
    if (isRandomizing) buttonAnimation(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRandomizing]);

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <Svg id="slot-machine" viewBox="0 0 496 496">
        <Rect
          id="slot-machine-rect1"
          width="496"
          height="200"
          rx="0"
          ry="0"
          transform="matrix(1 0 0 1 0 288)"
          fill="rgb(0,154,175)"
          stroke="none"
          strokeWidth="1"
        />
        <G id="slot-machine-g1">
          <Polyline id="slot-machine-polyline1" points="0,288 496,288 496,488" fill="rgb(0,104,132)" stroke="none" strokeWidth="1" />
          <Path
            id="slot-machine-Path1"
            d="M416,123.200000C416,168.800000,357.600000,208,312.800000,208L183.200000,208C138.400000,208,80,168.800000,80,123.200000L80,87.200000C80,41.600000,138.400000,8,183.200000,8L312,8C357.600000,8,416,41.600000,416,87.200000L416,123.200000Z"
            fill="rgb(0,104,132)"
            stroke="none"
            strokeWidth="1"
          />
        </G>
        <Path
          id="slot-machine-Path2"
          d="M496,296.800000C496,309.600000,484.800000,320,472,320L24,320C11.200000,320,0,309.600000,0,296.800000L0,86.400000C0,73.600000,11.200000,64,24,64L472,64C484.800000,64,496,73.600000,496,86.400000L496,296.800000Z"
          fill="rgb(7,190,214)"
          stroke="none"
          strokeWidth="1"
        />
        <Path
          id="slot-machine-Path3"
          d="M0,86.400000C0,73.600000,11.200000,64,24,64L472,64C484.800000,64,496,73.600000,496,86.400000L496,296.800000C496,309.600000,484.800000,320,472,320"
          fill="rgb(0,154,175)"
          stroke="none"
          strokeWidth="1"
        />
        <Path
          id="slot-machine-Path4"
          d="M456,260.800000C456,269.600000,452,272,444,272L52,272C44,272,40,268.800000,40,260.800000L40,123.200000C40,115.200000,44,104,52,104L444,104C452.800000,104,456,114.400000,456,123.200000L456,260.800000Z"
          fill="#fff"
          stroke="none"
          strokeWidth="1"
        />
        <G id="slot-machine-g3">
          <Ellipse
            id="slot-machine-ellipse1"
            rx="8.800000"
            ry="37.600000"
            transform="matrix(-0.43280000000000 -0.90150000000000 0.90150000000000 -0.43280000000000 145.52014170000001 32.88532490000003)"
            fill="rgb(0,154,175)"
            stroke="none"
            strokeWidth="1"
          />
        </G>
        <Rect
          id="slot-machine-rect2"
          width="32"
          height="64"
          rx="0"
          ry="0"
          transform="matrix(1 0 0 1 232 424)"
          fill="rgb(76,82,84)"
          stroke="none"
          strokeWidth="1"
        />
        <Polyline id="slot-machine-polyline2" points="232,424 264,424 264,480" fill="rgb(32,45,42)" stroke="none" strokeWidth="1" />
        <G id="slot-machine-animation" transform="translate(246.800018,367)" ref={buttonRef}>
          <G id="slot-machine-g4" transform="translate(-246.800018,-384.800003)">
            <Circle
              id="slot-machine-circle1"
              r="64.800000"
              transform="matrix(1 0 0 1 246.79999847500000 384.79999999999995)"
              fill="rgb(234,31,10)"
              stroke="none"
              strokeWidth="1"
            />
            <Ellipse
              id="slot-machine-ellipse2"
              rx="11.200000"
              ry="23.200000"
              transform="matrix(-0.70730000000000 -0.70690000000000 0.70690000000000 -0.70730000000000 216.95222547499998 348.13390800000025)"
              fill="rgb(239,104,63)"
              stroke="none"
              strokeWidth="1"
            />
            <Path
              id="slot-machine-Path17"
              d="M293.600000,300.800000C319.200000,326.400000,319.200000,367.200000,293.600000,392C268,417.600000,227.200000,417.600000,202.400000,392"
              transform="matrix(1 0 0 1 -1.20000152500000 38.39999999999998)"
              fill="rgb(170,32,17)"
              stroke="none"
              strokeWidth="1"
            />
          </G>
        </G>
        <G id="slot-machine-g5">
          <Circle
            id="slot-machine-circle2"
            r="12.800000"
            transform="matrix(1 0 0 1 50.40000000000000 362.39999999999998)"
            fill="rgb(0,104,132)"
            stroke="none"
            strokeWidth="1"
          />
          <Circle
            id="slot-machine-circle3"
            r="12.800000"
            transform="matrix(1 0 0 1 50.40000000000000 407.19999999999999)"
            fill="rgb(0,104,132)"
            stroke="none"
            strokeWidth="1"
          />
          <Circle
            id="slot-machine-circle4"
            r="12.800000"
            transform="matrix(1 0 0 1 50.40000000000000 452)"
            fill="rgb(0,104,132)"
            stroke="none"
            strokeWidth="1"
          />
        </G>
        <G id="slot-machine-g6">
          <Circle
            id="slot-machine-circle5"
            r="12.800000"
            transform="matrix(1 0 0 1 445.60000000000002 362.39999999999998)"
            fill="rgb(0,154,175)"
            stroke="none"
            strokeWidth="1"
          />
          <Circle
            id="slot-machine-circle6"
            r="12.800000"
            transform="matrix(1 0 0 1 445.60000000000002 407.19999999999999)"
            fill="rgb(0,154,175)"
            stroke="none"
            strokeWidth="1"
          />
          <Circle
            id="slot-machine-circle7"
            r="12.800000"
            transform="matrix(1 0 0 1 445.60000000000002 452)"
            fill="rgb(0,154,175)"
            stroke="none"
            strokeWidth="1"
          />
        </G>
      </Svg>
    </View>
  );
});

const ArrowSvg = memo(() => (
  <Svg x="0px" y="0px" viewBox="0 0 500 250" enable-background="new 0 0 500 250">
    <G>
      <Polygon fill-rule="evenodd" clip-rule="evenodd" points="2.667,106.621 34.5,125 2.667,143.379" fill="#000" />
      <Path
        fill="#FFFFFF"
        d="M5.167,110.951L29.5,125L5.167,139.049V110.951 M0.167,102.291v8.66v28.098v8.66l7.5-4.33L32,129.33
              l7.5-4.33l-7.5-4.33L7.667,106.621L0.167,102.291L0.167,102.291z"
      />
    </G>
    <G>
      <Polygon fill-rule="evenodd" clip-rule="evenodd" points="465.667,125.001 497.501,106.622 497.501,143.38" fill="#000" />
      <Path
        fill="#FFFFFF"
        d="M495.001,110.952v28.098l-24.334-14.049L495.001,110.952 M500.001,102.292l-7.5,4.33l-24.334,14.049
              l-7.5,4.33l7.5,4.33l24.334,14.049l7.5,4.33v-8.66v-28.098V102.292L500.001,102.292z"
      />
    </G>
  </Svg>
));

interface RandomizerMachineProps {
  items: { imageUri: string; id: number }[];
  onRandomizingStart: () => void;
  onRandomizingEnd: (selectedItem: { imageUri: string; id: number }) => void;
  onItemPress: (item: { imageUri: string; id: number }) => void;
}

const easing = Easing.linear;

const RandomizerMachine = memo(({ items, onRandomizingStart, onRandomizingEnd, onItemPress }: RandomizerMachineProps) => {
  const listAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const blinkAnimation = useRef(new Animated.Value(0)).current;
  const [isRandomizing, setRandomizing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // spin animation
  const onPressHandle = () => {
    if (!isRandomizing) {
      onRandomizingStart();
      setRandomizing(true);
      const nextIndex = Math.floor(Math.random() * items.length);
      Animated.sequence([
        Animated.timing(listAnimation, {
          toValue: 0,
          duration: 25 * selectedIndex,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(listAnimation, {
          toValue: -items.length * 76,
          duration: 25 * items.length,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(listAnimation, {
          toValue: 0,
          duration: 25 * items.length,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(listAnimation, {
          toValue: -items.length * 76,
          duration: 25 * items.length,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(listAnimation, {
          toValue: 0,
          duration: 25 * items.length,
          easing,
          useNativeDriver: true,
        }),
        Animated.timing(listAnimation, {
          toValue: -(nextIndex - 5) * 76,
          duration: 25 * (nextIndex - 5),
          easing,
          useNativeDriver: true,
        }),
        Animated.spring(listAnimation, {
          toValue: -nextIndex * 76,
          damping: 5,
          useNativeDriver: true,
          restSpeedThreshold: 0.5,
          restDisplacementThreshold: 0.5,
        }),
      ]).start(() => {
        setSelectedIndex(nextIndex);
        onRandomizingEnd(items[nextIndex]);
        Animated.parallel([
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 3 },
          ),
          Animated.loop(
            Animated.sequence([
              Animated.timing(blinkAnimation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(blinkAnimation, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
              }),
            ]),
            { iterations: 9 },
          ),
        ]).start(() => {
          setRandomizing(false);
        });
      });
    }
  };

  return (
    <View style={styles.randomizerContaienr}>
      <RandomizerSvg isRandomizing={isRandomizing} />
      <Animated.View
        style={[
          styles.images,
          { backgroundColor: 'rgb(115, 83, 255)', borderRadius: 8, opacity: blinkAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.3] }) },
        ]}
      >
        <View style={styles.backgroundCover} />
      </Animated.View>
      <View style={styles.arrowContainer}>
        <ArrowSvg />
      </View>
      <View style={styles.handleTrigger} onTouchStart={onPressHandle} />
      <View style={styles.images}>
        <Animated.View style={[styles.imageList, { transform: [{ translateY: listAnimation }] }]}>
          {items.map((v, index) => (
            <AnimatedTouchable
              style={[
                styles.imageContainer,
                index === selectedIndex ? { transform: [{ scale: scaleAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }] } : {},
              ]}
              onPress={() => onItemPress(v)}
              key={`randomizer-item_${v.id}`}
            >
              <MyImage
                uri={v.imageUri}
                defaultSource={DefaultProfilePictureTyped}
                params={badgeImageParams}
                style={styles.image}
                imageFormat="png"
                preloadComponent={<View style={{ ...styles.image, backgroundColor: '#DDDBDD' }}></View>}
              />
            </AnimatedTouchable>
          ))}
        </Animated.View>
      </View>
    </View>
  );
});

export default RandomizerMachine;

const styles = StyleSheet.create({
  randomizerContaienr: {
    height: 220,
    width: 220,
  },
  arrowContainer: {
    position: 'absolute',
    top: 0,
    bottom: 53,
    left: 18,
    right: 18,
  },
  images: {
    position: 'absolute',
    top: 45,
    bottom: 98,
    left: 17,
    right: 17,
    overflow: 'hidden',
    alignItem: 'center',
  },
  handleTrigger: {
    position: 'absolute',
    top: 130,
    bottom: 26,
    left: 76,
    right: 76,
  },
  backgroundCover: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
  },
  imageList: {
    position: 'absolute',
    top: 0,
    left: 55,
    right: 55,
    height: 1500,
    alignItems: 'center',
  },
  imageContainer: {
    height: 76,
    width: 76,
    padding: 4,
  },
  image: {
    flex: 1,
    borderRadius: 8,
    resizeMode: 'contain',
  },
});
