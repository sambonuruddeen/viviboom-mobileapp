import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Camera, CameraCapturedPicture, CameraPictureOptions, CameraType, FlashMode, VideoQuality, WhiteBalance } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { DeviceMotion } from 'expo-sensors';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, GestureResponderEvent, Image, ImageSourcePropType, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { GestureEvent, PinchGestureHandler, PinchGestureHandlerEventPayload } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import CircularProgress from './CircularProgress';
import MyText from './MyText';

const MAX_VIDEO_DURATION = 15;
const MAX_FILE_SIZE = 80 * 1024 * 1024;

const flashModes = [FlashMode.off, FlashMode.on, FlashMode.torch];
const flashIons: Array<'ios-flash-off-outline' | 'ios-flash-outline' | 'ios-flashlight-outline'> = [
  'ios-flash-off-outline',
  'ios-flash-outline',
  'ios-flashlight-outline',
];

const timerValues = [0, 3, 5, 10];
const whiteBalances = [WhiteBalance.auto, WhiteBalance.cloudy, WhiteBalance.fluorescent, WhiteBalance.incandescent, WhiteBalance.shadow, WhiteBalance.sunny];
interface MyCameraProps {
  show: boolean;
  handleClose: () => void;
  onPictureSaved: (picture: CameraCapturedPicture) => void;
  onVideoSaved: (video: { uri: string; width: number; height: number }) => void;
  onLaunchSystemCamera: () => Promise<void>;
  onLaunchMediaLibrary: () => Promise<void>;
  cameraPictureOptions?: CameraPictureOptions;
}

const CountDownTimer = ({ show, initialValue, onTimerEnd }: { show: boolean; initialValue: number; onTimerEnd: () => void }) => {
  const [time, setTime] = React.useState(initialValue || 3);
  const timerRef = React.useRef(time);

  useEffect(() => {
    if (show) {
      const timerId = setInterval(() => {
        timerRef.current -= 1;
        if (timerRef.current < 1) {
          onTimerEnd();
          clearInterval(timerId);
        } else {
          setTime(timerRef.current);
        }
      }, 1000);
      return () => {
        clearInterval(timerId);
      };
    }
  }, [show]);

  return (
    show && (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <MyText style={{ color: '#fff', fontSize: 72 }}>{time}</MyText>
      </View>
    )
  );
};

const MyCamera = memo(
  ({ show, handleClose, onPictureSaved, onVideoSaved, onLaunchSystemCamera, onLaunchMediaLibrary, cameraPictureOptions }: MyCameraProps) => {
    const [status, requestPermission] = Camera.useCameraPermissions();
    const [libraryStatus, requestLibraryPermission] = MediaLibrary.usePermissions();
    const [microphoneStatus, requestMicrophonePermission] = Camera.useMicrophonePermissions();
    const [type, setType] = useState(CameraType.back);
    const [flashMode, setFlashMode] = useState(0);
    const [timer, setTimer] = useState(0);
    const [whiteBalance, setWhiteBalance] = useState(0);
    const [zoom, setZoom] = useState(0);
    const [coverSrc, setCoverSrc] = useState<ImageSourcePropType>();
    const [isCameraReady, setCameraReady] = useState(false);
    const [isSnapping, setSnapping] = useState(false);
    const [isRecording, setRecording] = useState(false);
    const [showTimer, setShowTimer] = useState(false);

    const camera = useRef<Camera>();
    const anim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const animIn = () => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    const animOut = () => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    const rotate = (toValue: number) => {
      Animated.timing(rotateAnim, {
        toValue,
        duration: 150,
        useNativeDriver: false,
      }).start();
    };

    const rotateAnimStyle = { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [-90, 90], outputRange: ['90deg', '-90deg'] }) }] };

    const loadMediaCover = async () => {
      if (!libraryStatus?.granted) {
        const response = await requestLibraryPermission();
        if (!response.granted) return;
      }
      try {
        const res = await MediaLibrary.getAssetsAsync({ first: 1, mediaType: 'photo' });
        if (res.assets?.length > 0) setCoverSrc({ uri: res.assets[0].uri });
      } catch (err) {
        console.warn(err);
      }
    };

    useEffect(() => {
      if (!status?.granted) requestPermission();
      loadMediaCover();
      DeviceMotion.addListener((e) => {
        if (e.orientation === 90) rotate(90);
        else if (e.orientation === -90) rotate(-90);
        else rotate(0);
      });
      return () => DeviceMotion.removeAllListeners();
    }, []);

    const toggleCameraType = () => {
      setType((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
    };

    const toggleFlashMode = () => {
      setFlashMode((current) => (current + 1) % flashModes.length);
    };

    const toggleTimer = () => {
      setTimer((current) => (current + 1) % timerValues.length);
    };

    const toggleWhiteBalance = () => {
      setWhiteBalance((current) => (current + 1) % whiteBalances.length);
    };

    const handlePinch = (e: GestureEvent<PinchGestureHandlerEventPayload>) => {
      const { scale, velocity } = e.nativeEvent;

      setZoom((oldZoom) => {
        let newZoom =
          velocity > 0
            ? oldZoom + scale * velocity * (Platform.OS === 'ios' ? 0.01 : 25)
            : oldZoom - scale * Math.abs(velocity) * (Platform.OS === 'ios' ? 0.02 : 50);

        if (newZoom < 0) newZoom = 0;
        else if (newZoom > 0.5) newZoom = 0.5;
        return newZoom;
      });
    };

    const handleSnap = async () => {
      if (isRecording || !isCameraReady) return;
      if (timer > 0) {
        setShowTimer(true);
        return;
      }
      setSnapping(true);
      try {
        const picture = await camera.current?.takePictureAsync(cameraPictureOptions);
        camera.current?.pausePreview();
        onPictureSaved(picture);
        handleClose();
      } catch (err) {
        console.warn(err);
      }
      setSnapping(false);
    };

    const handleTimerEnd = async () => {
      if (isRecording || !isCameraReady) return;
      const picture = await camera.current?.takePictureAsync(cameraPictureOptions);
      camera.current?.pausePreview();
      setShowTimer(false);
      onPictureSaved(picture);
      handleClose();
    };

    const handleRecord = async () => {
      if (isRecording || isSnapping || !isCameraReady) return;
      if (!microphoneStatus?.granted) {
        const permission = await requestMicrophonePermission();
        if (!permission.granted) Alert.prompt('Permission Denied', 'Please grant microphone permission to record video');
        return;
      }
      setRecording(true);
      try {
        if (flashMode === 2) {
          setFlashMode(1);
          setTimeout(() => {
            if (flashMode === 2) setFlashMode(2);
          }, 500);
        }
        const video = await camera.current?.recordAsync({ maxDuration: MAX_VIDEO_DURATION, maxFileSize: MAX_FILE_SIZE, quality: VideoQuality['720p'] });
        onVideoSaved({ ...video, width: 1280, height: 720 });
        handleClose();
      } catch (err) {
        Toast.show({ text1: 'The video is too short', type: 'error' });
      }
      setRecording(false);
    };

    const handlePressOut = (e: GestureResponderEvent) => {
      const detectRadius = 90;
      const { locationX: x, locationY: y } = e.nativeEvent;
      if (x * x + y * y > detectRadius * detectRadius) return;
      animOut();
      if (isRecording) camera.current?.stopRecording();
    };

    const handleLaunchSystemCamera = async () => {
      camera.current?.pausePreview();
      await onLaunchSystemCamera();
      handleClose();
    };

    const handleLaunchMediaLibrary = async () => {
      camera.current?.pausePreview();
      await onLaunchMediaLibrary();
      handleClose();
    };

    return (
      show && (
        <View style={styles.container}>
          {!!status?.granted && (
            <PinchGestureHandler onGestureEvent={handlePinch}>
              <Camera
                ref={camera}
                style={styles.camera}
                type={type}
                zoom={zoom}
                flashMode={flashModes[flashMode]}
                whiteBalance={whiteBalances[whiteBalance]}
                onCameraReady={() => setCameraReady(true)}
              >
                {showTimer && (
                  <View style={styles.countDownTimerContainer}>
                    <CountDownTimer show={showTimer} initialValue={timerValues[timer]} onTimerEnd={handleTimerEnd} />
                  </View>
                )}
                <>
                  <Animated.View style={[styles.buttons, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                    <TouchableOpacity onPress={toggleCameraType}>
                      <Animated.View style={[rotateAnimStyle, styles.button]}>
                        <Ionicons name="ios-camera-reverse-outline" size={32} color="#fff" />
                        <MyText style={styles.buttonText}>flip</MyText>
                      </Animated.View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleTimer}>
                      <Animated.View style={[rotateAnimStyle, styles.button]}>
                        <Ionicons name="ios-timer-outline" size={32} color="#fff" />
                        <MyText style={styles.buttonText}>{timerValues[timer] === 0 ? 'timer' : `${timerValues[timer]}s`}</MyText>
                      </Animated.View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleFlashMode}>
                      <Animated.View style={[rotateAnimStyle, styles.button]}>
                        <Ionicons name={flashIons[flashMode]} size={32} color="#fff" />
                        <MyText style={styles.buttonText}>{flashModes[flashMode]}</MyText>
                      </Animated.View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleWhiteBalance}>
                      <Animated.View style={[rotateAnimStyle, styles.button]}>
                        <Ionicons name="ios-color-filter-outline" size={32} color="#fff" />
                        <MyText style={styles.buttonText}>WB</MyText>
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                  <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { opacity: isRecording ? 0 : 1 }]}>
                    <Ionicons name="ios-close-outline" size={36} color="#fff" />
                  </TouchableOpacity>
                </>
                <Animated.View style={[styles.recordButtonContainer, { opacity: anim }]}>
                  <CircularProgress radius={70} percentage={100} strokeWidth={5} duration={MAX_VIDEO_DURATION * 1000} showText={false} show={isRecording} />
                </Animated.View>
              </Camera>
            </PinchGestureHandler>
          )}
          {!showTimer && (
            <>
              <View style={styles.recordButtonContainer}>
                <Animated.View style={[styles.bottomButtons, { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                  <TouchableOpacity onPress={handleLaunchSystemCamera}>
                    <Animated.View style={[rotateAnimStyle, styles.button]}>
                      <MaterialIcons name="camera" size={32} color="#fff" />
                      <MyText style={styles.buttonText}>system camera</MyText>
                    </Animated.View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleLaunchMediaLibrary}>
                    <Animated.View style={[rotateAnimStyle, styles.button]}>
                      {coverSrc && <Image source={coverSrc} style={styles.coverImage} />}
                      <MyText style={{ ...styles.buttonText, marginVertical: 5 }}>library</MyText>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View
                  style={[styles.recordButton, { width: anim.interpolate({ inputRange: [0, 1], outputRange: [88, 120] }) }]}
                  onTouchEnd={handlePressOut}
                >
                  <TouchableOpacity
                    onPressIn={animIn}
                    activeOpacity={0.6}
                    onPress={handleSnap}
                    onLongPress={handleRecord}
                    delayLongPress={300}
                    pressRetentionOffset={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  >
                    <Animated.View style={[styles.recordButtonInner, { width: anim.interpolate({ inputRange: [0, 1], outputRange: [70, 20] }) }]} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          )}
        </View>
      )
    );
  },
);

export default MyCamera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  buttons: {
    position: 'absolute',
    top: 12,
    right: 4,
    width: 50,
  },
  button: {
    alignItems: 'center',
    margin: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    left: 10,
    width: 50,
  },
  recordButtonContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    width: 88,
    aspectRatio: 1,
    borderRadius: 60,
    backgroundColor: 'rgba(238, 130, 238, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonInner: {
    width: 70,
    aspectRatio: 1,
    borderRadius: 35,
    backgroundColor: '#fff',
  },
  countDownTimerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  coverImage: {
    width: 45,
    height: 45,
    borderWidth: 3,
    borderRadius: 12,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    marginVertical: 2,
    width: 48,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowRadius: 2,
  },
});
