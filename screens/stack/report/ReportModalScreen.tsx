import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import ContentReportApi from 'rn-viviboom/apis/viviboom/ContentReportApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

export default function ReportModalScreen({ navigation, route }: RootStackScreenProps<'ReportModalScreen'>) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();
  const isRootEnv = useReduxStateSelector((s) => s?.account?.institutionId === 1);
  const authToken = useReduxStateSelector((s) => s.account?.authToken);

  const [text, setText] = useState('');

  const onSubmit = async () => {
    const textToSubmit = text.trim();
    if (!textToSubmit.length) return;
    try {
      await ContentReportApi.post({ authToken, relevantId: route.params?.relevantId, relevantType: route.params?.relevantType, reason: text });
      navigation.pop();
      Toast.show({ text1: 'Your report has been submited!', type: 'success' });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.warn(err.message || err?.response?.data?.message);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: `Report this ${route.params?.relevantType.toLowerCase()}`,
      headerTintColor: Colors[colorScheme].text,
      headerBackTitle: '',
    });
  }, [colorScheme, navigation, route.params?.relevantType]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}
      keyboardVerticalOffset={insets.top + 50}
    >
      <View style={styles.description}>
        <MyText style={styles.descriptionText}>{t(isRootEnv ? 'reportDescription' : 'reportDescriptionNonRoot')}</MyText>
      </View>
      <View style={styles.contentContainer}>
        <TextInput
          multiline
          style={[styles.textInput, { backgroundColor: Colors[colorScheme].textInput, color: Colors[colorScheme].text }]}
          placeholder="Write your report here..."
          value={text}
          onChangeText={setText}
          placeholderTextColor={Colors[colorScheme].textSecondary}
        />
      </View>
      <MyButton
        mode="contained"
        onPress={onSubmit}
        disabled={!text.length}
        style={!text.length ? { backgroundColor: '#ddd' } : null}
        labelStyle={!text.length ? { color: '#aaa' } : null}
      >
        Submit
      </MyButton>
      <View style={{ height: insets.bottom }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  description: {},
  descriptionText: {
    fontSize: 18,
    lineHeight: 22,
  },
  contentContainer: {
    flex: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    textAlignVertical: 'top',
  },
});
