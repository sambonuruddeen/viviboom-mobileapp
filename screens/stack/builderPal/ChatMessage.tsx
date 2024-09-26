import { AVPlaybackStatusSuccess, Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import BuilderPalImage from 'rn-viviboom/assets/images/minichatavatar.png';
import soundInvertedGif from 'rn-viviboom/assets/images/sound-inverted.gif';
import soundGif from 'rn-viviboom/assets/images/sound.gif';
import Colors from 'rn-viviboom/constants/Colors';
import { BuilderPalRoleType } from 'rn-viviboom/enums/BuilderPalRoleType';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

interface ChatMessageProps {
  message: MyMessage;
  setLoading: (loading: boolean) => void;
}

export default function ChatMessage({ message, setLoading }: ChatMessageProps) {
  const colorScheme = useColorScheme();
  const [sound, setSound] = useState<Audio.Sound>();

  const [content, setContent] = useState(message?.content || '');

  const [soundDuration, setSoundDuration] = useState<number>(0);
  const [shouldAudioPlay, setShouldAudioPlay] = useState(false);

  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const bounceMiddleAnimation = useRef(new Animated.Value(0)).current;

  const bounceAnim = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    setTimeout(
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceMiddleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceMiddleAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start,
      500,
    );
  };

  const onPlayBackStatusUpdate = (status: AVPlaybackStatusSuccess) => {
    if (status.didJustFinish) setShouldAudioPlay(false);
  };

  const loadSound = useCallback(async () => {
    if (!message?.uri) return;
    const soundResult = await Audio.Sound.createAsync({ uri: message.uri }, {}, onPlayBackStatusUpdate, true);

    setSound(soundResult.sound);
    setSoundDuration(Math.round((soundResult.status as AVPlaybackStatusSuccess).durationMillis / 1000));
  }, [message?.uri]);

  const streamContent = useCallback(async () => {
    if (message?.streamReader) {
      const { streamReader } = message;
      try {
        let done;
        let value;
        const decoder = new TextDecoder();
        while (!done) {
          // eslint-disable-next-line no-await-in-loop
          ({ value, done } = await streamReader.read());
          if (done) {
            setLoading(false);
            break;
          }
          const newText = decoder.decode(value);
          setContent((prev) => `${prev}${newText}`);
        }
      } catch (err) {
        Toast.show({ text1: err.response.data.message || err.message, type: 'error' });
      }
    }
  }, [message, setLoading]);

  useEffect(() => {
    streamContent();
  }, [message]);

  // unload on unmount
  useEffect(
    () => () => {
      if (sound) sound.unloadAsync();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (sound) {
      if (shouldAudioPlay) {
        sound.playAsync();
      } else {
        sound.stopAsync();
      }
    }
  }, [shouldAudioPlay, sound]);

  const audioDuration = message?.duration || soundDuration || 0;
  const audioText = audioDuration ? `${audioDuration.toFixed()}''` : "''";

  useEffect(() => {
    bounceAnim();
  }, []);

  useEffect(() => {
    loadSound();
  }, [loadSound]);

  return message.role === BuilderPalRoleType.ASSISTANT ? (
    <View style={styles.assistantMessageContainer}>
      <View style={styles.avatar}>
        <MyImage style={styles.assistantAvatar} defaultSource={BuilderPalImage} />
      </View>
      <View style={[styles.assistantChatBox, { backgroundColor: Colors[colorScheme].textInput }]}>
        {!content ? (
          <View style={styles.dotContainer}>
            <Animated.View style={[styles.dot, { opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }]} />
            <Animated.View style={[styles.dot, { opacity: bounceMiddleAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }]} />
            <Animated.View style={[styles.dot, { opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) }]} />
          </View>
        ) : (
          <MyText style={styles.chatBoxText}>{content}</MyText>
        )}
      </View>
    </View>
  ) : (
    <View style={styles.userMessageContainer}>
      {message?.uri ? (
        <TouchableOpacity
          style={[styles.soundButton, { width: audioDuration * 30, backgroundColor: Colors[colorScheme].tint }]}
          onPress={() => setShouldAudioPlay((b) => !b)}
          activeOpacity={0.8}
        >
          <MyText style={{ ...styles.soundText, color: Colors[colorScheme].background }}>{audioText}</MyText>
          {shouldAudioPlay ? <Image style={styles.soundGif} source={colorScheme === 'dark' ? soundInvertedGif : soundGif} /> : null}
        </TouchableOpacity>
      ) : (
        <View style={[styles.userChatBox, { backgroundColor: Colors[colorScheme].tint }]}>
          <MyText style={{ ...styles.chatBoxText, color: Colors[colorScheme].background }}>{content}</MyText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  assistantMessageContainer: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  avatar: {},
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 20,
  },
  assistantChatBox: {
    marginLeft: 12,
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: 0,
  },
  chatBoxText: {
    lineHeight: 22,
    fontSize: 16,
    fontWeight: '400',
  },
  userMessageContainer: {
    width: '100%',
    flexDirection: 'row-reverse',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  userChatBox: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopRightRadius: 0,
  },
  soundButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopRightRadius: 0,
    maxWidth: 200,
    minWidth: 80,
  },
  soundGif: {
    height: 16,
    width: 32,
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    marginVertical: 7,
    marginHorizontal: 1.5,
    borderRadius: 4,
    backgroundColor: '#9880ff',
  },
  soundText: {
    lineHeight: 22,
    fontSize: 16,
    fontWeight: '400',
  },
});
