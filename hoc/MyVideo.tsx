/* eslint-disable react/display-name */
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { AVPlaybackStatus, ResizeMode, Video, VideoProps, VideoReadyForDisplayEvent } from 'expo-av';
import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import { TouchableWithoutFeedback as GHTouchableWithoutFeedback } from 'react-native-gesture-handler';

import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import MyImage from './MyImage';
import MyText from './MyText';

const screen = Dimensions.get('screen');
const DEFAULT_PRELOAD_IMAGE_WIDTH = Layout.screen.width > 600 ? 1024 : 512;
const projectImagePadding = screen.width < 600 ? 12 : 18;
const mediaWidth = screen.width - 2 * projectImagePadding;
const mediaHeight = (mediaWidth * 9) / 16;

const SHOW_CONTROL_DURATION = 5000;

function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return seconds === '60' ? `${minutes + 1}:00` : `${minutes}:${+seconds < 10 ? '0' : ''}${seconds}`;
}

interface MyVideoProps {
  src: string;
  params?: Record<string, string>;
  playButtonPositon?: 'center' | 'bottomRight';
  onContainerPress?: () => void;
  carouselMode?: boolean;
  width?: number;
  height?: number;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  preloadImageUri?: string;
  shouldMount?: boolean;
}

const MyVideo = memo((props: MyVideoProps & VideoProps) => {
  const isFocus = useIsFocused();
  const [status, setStatus] = useState<AVPlaybackStatus>({});
  const [durationMillis, setDurationMillis] = useState(0);
  const [positionMillis, setPositionMillis] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: mediaWidth, height: mediaHeight });
  const [showControl, setShowControl] = useState(false);

  const colorScheme = useColorScheme();

  const hideControlTimer = useRef<{ timer: NodeJS.Timeout }>({ timer: null });

  const video = useRef<Video>(null);
  const {
    src,
    params,
    playButtonPositon,
    onContainerPress,
    carouselMode,
    width,
    height,
    onPlaybackStatusUpdate,
    preloadImageUri,
    shouldMount = true,
    ...rest
  } = props;
  const fullSrc = params && src ? `${src}?${new URLSearchParams(params).toString()}` : src;

  const onVideoLoadResize = ({ naturalSize }: VideoReadyForDisplayEvent) => {
    const { width: actualWidth, height: actualHeight } = naturalSize;
    if (width && !height) {
      setVideoDimensions({ width, height: actualHeight * (width / actualWidth) });
    } else if (!width && height) {
      setVideoDimensions({ width: actualWidth * (height / actualHeight), height });
    } else if (width && height) {
      setVideoDimensions({ width, height });
    } else {
      setVideoDimensions({ width: actualWidth, height: actualHeight });
    }
  };

  const onVideoTouchStart = () => {
    if (onContainerPress) onContainerPress();
    setShowControl(true);
    if (hideControlTimer?.current?.timer) clearTimeout(hideControlTimer.current.timer);
    hideControlTimer.current.timer = setTimeout(() => setShowControl(false), SHOW_CONTROL_DURATION);
  };

  const onToggleVideoPlay = () => {
    if (status.isPlaying) {
      video.current?.pauseAsync();
    } else {
      video.current?.playAsync();
    }
  };

  const onStatusUpdate = (newStatus: AVPlaybackStatus) => {
    // remember last played position if paused
    setStatus((prevStatus) => {
      if (!newStatus.isLoaded) setPositionMillis(prevStatus.positionMillis);
      return newStatus;
    });

    if (!durationMillis) setDurationMillis(newStatus.durationMillis);
    if (onPlaybackStatusUpdate) onPlaybackStatusUpdate(newStatus);
  };

  useEffect(() => {
    if (!isFocus) video.current?.pauseAsync();
  }, [isFocus]);

  return (
    <View style={styles.container}>
      <GHTouchableWithoutFeedback onPress={onVideoTouchStart}>
        <>
          <View
            style={{
              height: carouselMode ? screen.height : undefined,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: carouselMode ? '#000' : undefined,
              width: '100%',
            }}
          >
            {shouldMount ? (
              <Video
                ref={video}
                style={[styles.video, videoDimensions, props.style]}
                source={{ uri: fullSrc }}
                useNativeControls={false}
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                isMuted={isMuted}
                onPlaybackStatusUpdate={onStatusUpdate}
                onReadyForDisplay={onVideoLoadResize}
                positionMillis={positionMillis}
                shouldPlay
                {...rest}
              />
            ) : (
              <View style={[styles.video, videoDimensions, props.style]} />
            )}
          </View>
          {(!shouldMount || !status.isLoaded) && (
            <>
              {!!preloadImageUri && (
                <View
                  style={[
                    { position: 'absolute', justifyContent: 'center', backgroundColor: carouselMode ? '#000' : '#ecf0f1' },
                    styles.video,
                    videoDimensions,
                    props.style,
                  ]}
                >
                  <MyImage
                    uri={preloadImageUri}
                    params={{ width: DEFAULT_PRELOAD_IMAGE_WIDTH }}
                    style={{ ...videoDimensions, resizeMode: status.isLoaded ? 'contain' : 'cover' }}
                  />
                </View>
              )}
              {shouldMount && (
                <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
                  <ActivityIndicator />
                </View>
              )}
              <View style={styles.durationContainer}>
                <MyText style={styles.durationText}>{durationMillis ? millisToMinutesAndSeconds(durationMillis) : 'Video'}</MyText>
              </View>
            </>
          )}
          {status.isLoaded && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.floor(((status.positionMillis || 0) / (status.durationMillis || 1)) * 100)}%`, backgroundColor: Colors[colorScheme].tint },
                ]}
              />
            </View>
          )}
          {showControl && !props.useNativeControls && (
            <>
              <View style={playButtonPositon && playButtonPositon === 'bottomRight' ? styles.button : styles.buttonCenter}>
                <View style={styles.playButton}>
                  <GHTouchableWithoutFeedback onPress={onToggleVideoPlay}>
                    <Ionicons name={status.isPlaying ? 'ios-pause-sharp' : 'ios-play-sharp'} size={48} color="#fff" />
                  </GHTouchableWithoutFeedback>
                </View>
              </View>
              <View style={styles.muteButton}>
                <GHTouchableWithoutFeedback onPress={() => setIsMuted(!isMuted)}>
                  <Ionicons name={status.isMuted ? 'ios-volume-mute-outline' : 'ios-volume-high-outline'} size={24} color="#fff" />
                </GHTouchableWithoutFeedback>
              </View>
            </>
          )}
        </>
      </GHTouchableWithoutFeedback>
    </View>
  );
});

export default MyVideo;

const styles = StyleSheet.create({
  container: {
    flex: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
  },
  video: {
    alignSelf: 'center',
    width: mediaWidth,
    minHeight: mediaHeight,
  },
  button: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  buttonCenter: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2.5,
  },
  durationContainer: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: 'black',
    opacity: 0.5,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  durationText: {
    color: '#fff',
    fontWeight: '500',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
  },
  muteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
});
