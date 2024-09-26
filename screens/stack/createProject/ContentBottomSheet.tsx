import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSchemeName, StyleSheet, TextInput, View } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';

import Colors from 'rn-viviboom/constants/Colors';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

const ContentBottomSheetColors: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    textInput: '#fff',
  },
  dark: {
    textInput: '#333',
  },
};
interface ContentBottomSheetProps {
  show: boolean;
  handleClose: () => void;
}

export default function ContentBottomSheet({ show, handleClose }: ContentBottomSheetProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();

  const { content } = useReduxStateSelector((state) => state.createProject);

  const [text, setText] = useState(content);

  const bottomSheetRef = useRef<RBSheet>(null);
  const contentInputRef = useRef<TextInput>(null);

  const onCancel = useCallback(() => {
    setText(content);
    handleClose();
  }, [content, handleClose]);

  const onDone = useCallback(() => {
    CreateProjectReduxActions.setProject({ content: text });
    handleClose();
  }, [handleClose, text]);

  useEffect(() => {
    if (show) {
      setTimeout(() => contentInputRef.current?.focus(), 100);
      bottomSheetRef.current?.open();
    } else {
      bottomSheetRef.current?.close();
      contentInputRef.current?.blur();
    }
  }, [show]);

  return (
    <RBSheet
      ref={bottomSheetRef}
      height={200}
      onClose={onCancel}
      backdropComponent={MyBottomSheetBackdrop}
      closeOnDragDown
      customStyles={{ container: { borderTopRightRadius: 18, borderTopLeftRadius: 18, backgroundColor: Colors[colorScheme].background } }}
      animationType="fade"
    >
      <View style={styles.contentTopRow}>
        <MyButton style={styles.topButton} compact onPress={onCancel} mode="text">
          Cancel
        </MyButton>
        <MyText style={{ fontSize: 18, padding: 6 }}>Details</MyText>
        <MyButton style={styles.topButton} compact onPress={onDone} mode="text">
          Done
        </MyButton>
      </View>
      <TextInput
        ref={contentInputRef}
        style={[styles.contentInput, { backgroundColor: ContentBottomSheetColors[colorScheme].textInput, color: Colors[colorScheme].text }]}
        placeholder={t('How Did You Make This? (Optional! You can write this in your project update later)')}
        multiline
        value={text}
        onChangeText={setText}
        placeholderTextColor="#aaa"
      />
    </RBSheet>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  contentTopRow: {
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contentInput: {
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    marginHorizontal: 10,
    flex: 1,
    minHeight: 124,
    textAlignVertical: 'top',
  },
  topButton: {
    width: 100,
    paddingVertical: 0,
  },
});
