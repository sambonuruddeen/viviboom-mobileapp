import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

const MAX_AUDIO_LENGTH = 60 * 1000;

interface ChatInputProps {
  chatId: number;
  isRecording: boolean;
  setIsRecording: (b: boolean) => void;
  sendMessage: (text: string, type?: string, audio?: { uri: string; name: string; type: string }, duration?: number) => Promise<void>;
}

const recordingOption: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.mp4',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MAX,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const waveWidth = Layout.screen.width - 148;
const dotCount = Math.floor(waveWidth / 8);

export default function ChatInput({ chatId, sendMessage, isRecording, setIsRecording }: ChatInputProps) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const isFocused = useIsFocused();

  const forceStopTimeout = useRef<NodeJS.Timeout>(null);
  const recording = useRef<Audio.Recording>();

  const [text, setText] = useState('');

  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const [duration, setDuration] = useState(0);
  const [volumes, setVolumes] = useState<number[]>([]);
  const [shouldForceStop, setShouldForceStop] = useState(false);

  const onClickSend = async () => {
    setText('');
    await sendMessage(text);
  };

  const onRecordingStatusUpdate = (status: Audio.RecordingStatus) => {
    setDuration(Math.round(status.durationMillis / 1000));
    if (status.metering) setVolumes((prev) => [...prev, Math.max(((+status.metering + 50) * 4) / 50 + 1, 1)]);
  };

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== Audio.PermissionStatus.GRANTED) {
        const { granted } = await requestPermission();
        if (!granted) throw Error(t('Please enable permission to use microphone'));
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // start recording
      const recordResult = await Audio.Recording.createAsync(recordingOption, onRecordingStatusUpdate, 100);
      setIsRecording(true);
      recording.current = recordResult.recording;

      // force stop timeout
      forceStopTimeout.current = setTimeout(() => {
        setShouldForceStop(true);
      }, MAX_AUDIO_LENGTH);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ type: 'error', text1: err.message });
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!recording.current) return;
    const status = await recording.current.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    setIsRecording(false);
    clearTimeout(forceStopTimeout.current);
    setDuration(0);
    setVolumes([]);
    setShouldForceStop(false);
    setIsRecording(false);

    const uri = recording.current.getURI();

    const durationInStatus = Math.round(status.durationMillis / 1000);
    await sendMessage(null, null, { uri, name: `builderPal-chat-audio-${(+new Date()).toString(36)}`, type: 'video/mp4' }, durationInStatus);

    recording.current = undefined;
  };

  const discardRecording = async () => {
    if (!recording.current) return;
    await recording.current.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
    setIsRecording(false);
    clearTimeout(forceStopTimeout.current);
    setDuration(0);
    setVolumes([]);
    setShouldForceStop(false);
    setIsRecording(false);

    recording.current = undefined;
  };

  useEffect(() => {
    if (shouldForceStop) {
      stopRecording();
    }
  }, [shouldForceStop]);

  const isValidText = !!text;

  useEffect(
    () => () => {
      discardRecording();
    },
    [],
  );

  useEffect(() => {
    discardRecording();
  }, [chatId]);

  useEffect(() => {
    if (!isFocused) discardRecording();
  }, [isFocused]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', () => {
      discardRecording();
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.inputContainer, { backgroundColor: Colors[colorScheme].background }]}
    >
      {!isRecording ? (
        <View style={styles.contentContainer}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={startRecording}>
            <Ionicons name="ios-mic-outline" size={28} color={Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
          <TextInput
            multiline
            style={[styles.textInput, { backgroundColor: Colors[colorScheme].textInput, color: Colors[colorScheme].text }]}
            placeholder={t('Write a message...')}
            value={text}
            onChangeText={setText}
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: isValidText ? Colors[colorScheme].success : undefined }]}
            activeOpacity={isValidText ? 0.8 : 1}
            onPress={onClickSend}
          >
            <Ionicons name="ios-send" size={16} color={isValidText ? '#fff' : Colors[colorScheme].textSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.recordingTitle}>
            <Ionicons name="ios-mic-outline" size={16} />
            <MyText style={{ ...styles.recordingTitleText, color: Colors[colorScheme].textSecondary }}>{t('Recording an audio clip...')}</MyText>
          </View>
          <View style={[styles.recordContainer, { backgroundColor: Colors[colorScheme].tintShadow }]}>
            <TouchableOpacity style={[styles.recordButon, { backgroundColor: Colors[colorScheme].background }]} onPress={discardRecording} activeOpacity={0.8}>
              <Ionicons name="ios-close-outline" size={24} color={Colors[colorScheme].textSecondary} />
            </TouchableOpacity>
            <View style={styles.durationContainer}>
              <View style={styles.wave}>
                {new Array(dotCount).fill(0).map((_, index) => (
                  <View
                    key={`wave-${index}`}
                    style={[
                      styles.waveDot,
                      {
                        backgroundColor: index < volumes.length ? Colors[colorScheme].tint : Colors[colorScheme].textInactive,
                        height: index < volumes.length ? volumes[volumes.length - index - 1] * 4 : 4,
                      },
                    ]}
                  />
                ))}
              </View>
              <MyText style={styles.durationText}>{duration} s</MyText>
            </View>
            <TouchableOpacity style={[styles.recordButon, { backgroundColor: Colors[colorScheme].tint }]} onPress={stopRecording} activeOpacity={0.8}>
              <Ionicons name="ios-checkmark-outline" size={24} color={Colors[colorScheme].textInverse} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    marginHorizontal: 8,
  },
  inputContainer: {
    width: '100%',
    // borderTopColor: '#rgba(160, 160, 160, 0.2)',
    // borderTopWidth: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 10 : undefined,
    paddingBottom: Platform.OS === 'ios' ? 10 : undefined,
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: 12,
    borderRadius: 24,
    padding: 6,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTitle: {
    width: '100%',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingTitleText: {
    fontWeight: '400',
    margin: 8,
  },
  recordContainer: {
    marginVertical: 4,
    marginHorizontal: 8,
    height: 40,
    borderRadius: 24,
    paddingHorizontal: 4,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordButon: {
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  durationContainer: {
    flex: 1,
    height: '100%',
    marginHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wave: {
    flex: 1,
    height: '100%',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    marginHorizontal: 8,
    fontWeight: '400',
    width: 28,
    textAlign: 'right',
  },
  waveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
