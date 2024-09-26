import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorSchemeName, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import ProjectCategoryApi from 'rn-viviboom/apis/viviboom/ProjectCategoryApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const AddCategoryBottomSheetColors: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    textInput: '#fff',
  },
  dark: {
    textInput: '#333',
  },
};
interface AddCategoryBottomSheetProps {
  show: boolean;
  handleClose: () => void;
  onAddCategory: (category: ProjectCategory) => void;
}

export default function AddCategoryModal({ show, handleClose, onAddCategory }: AddCategoryBottomSheetProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((s) => s.account?.authToken);
  const [isLoading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const contentInputRef = useRef<TextInput>();

  const onCancel = () => {
    contentInputRef.current?.blur();
    setName('');
    handleClose();
  };

  const onDone = async () => {
    if (!name) {
      setName('');
      handleClose();
    }

    setLoading(true);
    try {
      const res = await ProjectCategoryApi.post({ authToken, name });
      onAddCategory({ id: res.data.projectCategoryId, name, description: null });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    handleClose();
  };

  return (
    <Modal visible={show} onRequestClose={onCancel} hardwareAccelerated animationType="fade" transparent onShow={() => contentInputRef.current?.focus()}>
      <Pressable style={styles.centeredView} onPress={onCancel}>
        <View style={[styles.contentContainer, { backgroundColor: Colors[colorScheme].secondaryBackground }]}>
          <View style={styles.contentTopRow}>
            <MyButton style={styles.topButton} compact onPress={onCancel} mode="text">
              Cancel
            </MyButton>
            <MyText style={{ fontSize: 18, padding: 6 }}>New Category</MyText>
            <MyButton style={styles.topButton} compact onPress={onDone} mode="text">
              Done
            </MyButton>
          </View>
          <TextInput
            ref={contentInputRef}
            style={[styles.contentInput, { backgroundColor: AddCategoryBottomSheetColors[colorScheme].textInput, color: Colors[colorScheme].text }]}
            placeholder="Add Customized tag or category"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#aaa"
            maxLength={20}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 20,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    top: Platform.OS === 'ios' ? -50 : 0,
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
  },
  topButton: {
    width: 100,
    paddingVertical: 0,
  },
});
