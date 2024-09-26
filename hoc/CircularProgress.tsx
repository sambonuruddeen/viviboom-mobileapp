import * as React from 'react';
import { Component, useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import Svg, { Circle, CircleProps, G, StrokeProps } from 'react-native-svg';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CircularProgressProps {
  percentage?: number;
  radius?: number;
  strokeWidth?: number;
  duration?: number;
  color?: string;
  delay?: number;
  textColor?: string;
  max?: number;
  showText?: boolean;
  style?: ViewStyle;
  show?: boolean;
}

export default function CircularProgress({
  percentage = 75,
  radius = 40,
  strokeWidth = 10,
  duration = 500,
  color = 'tomato',
  delay = 0,
  textColor,
  max = 100,
  showText = true,
  style,
  show = true,
  ...rest
}: CircularProgressProps) {
  const animated = useRef(new Animated.Value(0)).current;
  const circleRef = useRef<Component<CircleProps>>();
  const inputRef = useRef<TextInput>();
  const circumference = 2 * Math.PI * radius;
  const halfCircle = radius + strokeWidth;

  const animation = useCallback(
    (toValue: number) => {
      Animated.timing(animated, {
        delay,
        toValue,
        duration,
        useNativeDriver: true,
      }).start();
    },
    [animated, duration, delay],
  );

  useEffect(() => {
    animated.addListener((v) => {
      const maxPerc = (100 * v.value) / max;
      const strokeDashoffset = circumference - (circumference * maxPerc) / 100;
      if (showText && inputRef?.current) {
        inputRef.current.setNativeProps({
          text: `${Math.round(v.value)}`,
        });
      }
      if (circleRef?.current) {
        circleRef.current.setNativeProps({
          strokeDashoffset,
        });
      }
    });

    return () => {
      animated.removeAllListeners();
    };
  }, [animated, animation, circumference, max, percentage, showText]);

  useEffect(() => {
    if (show) animation(percentage);
  }, [show]);

  return (
    <View style={[{ width: radius * 2, height: radius * 2 }, style]} {...rest}>
      <Svg height={radius * 2} width={radius * 2} viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}>
        <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
          <Circle
            ref={circleRef}
            cx="50%"
            cy="50%"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDashoffset={circumference}
            strokeDasharray={circumference}
          />
          <Circle cx="50%" cy="50%" r={radius} fill="transparent" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeOpacity=".1" />
        </G>
      </Svg>
      {showText && (
        <AnimatedTextInput
          ref={inputRef}
          underlineColorAndroid="transparent"
          editable={false}
          defaultValue="0"
          style={[StyleSheet.absoluteFillObject, { fontSize: radius / 2, color: textColor ?? color }, styles.text]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontWeight: '900', textAlign: 'center' },
});
