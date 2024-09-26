import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import ProjectAPi from 'rn-viviboom/apis/viviboom/ProjectApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

interface FileBottomSheetProps {
  show: boolean;
  handleClose: () => void;
}

const itemSize = (Dimensions.get('screen').width - 24 * 2) / 4 - 6 * 2;
const itemMargin = 6;
const MAX_SIZE = 8 * 1024 * 1024;
const MAX_COUNT = 10;

export default function FileBottomSheet({ show, handleClose }: FileBottomSheetProps) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const authToken = useReduxStateSelector((s) => s.account?.authToken);

  const { files, id } = useReduxStateSelector((state) => state.createProject);

  const [isLoading, setLoading] = useState(false);

  const snapPoints = useMemo(() => ['30%', '60%'], []);
  const bottomSheetRef = useRef<BottomSheet>();

  // API calls
  const onCancel = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // eslint-disable-next-line consistent-return
  const onAddFile = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) return Toast.show({ text1: 'Please try creating project again', type: 'error' });
      if (files.length >= MAX_COUNT) return Toast.show({ text1: 'You have reach the limit for project files', type: 'error' });
      const res = await DocumentPicker.getDocumentAsync();
      if (res.type === 'success') {
        if (res.size > MAX_SIZE) {
          return Toast.show({
            text1: t('fileTooLarge', { size: `${Math.round(res.size / 1024 / 1024)}MB`, maxSize: `${Math.round(MAX_SIZE / 1024 / 1024)}MB` }),
            type: 'error',
          });
        }
        const addFileResult = await ProjectAPi.postProjectFile({
          authToken,
          projectId: id,
          insertOrder: files.length + 1,
          file: { uri: res.uri, name: res.name, type: res.mimeType },
          name: res.name,
        });
        CreateProjectReduxActions.setProject({ files: files.concat(addFileResult.data.projectFile) });
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ text1: err?.response?.data?.message || err, type: 'error' });
    }
    setLoading(false);
  }, [authToken, files, id, t]);

  const onDeleteFile = useCallback(
    (fileId: number) => async () => {
      setLoading(true);
      try {
        await ProjectAPi.deleteProjectFile({ authToken, projectId: id, fileId });
        CreateProjectReduxActions.setProject({ files: files.filter((f) => f.id !== fileId) });
      } catch (err) {
        console.warn(err);
      }
      setLoading(false);
    },
    [authToken, files, id],
  );

  useEffect(() => {
    if (show) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [show]);

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onClose={onCancel}
        enablePanDownToClose
        backdropComponent={MyBottomSheetBackdrop}
        backgroundStyle={{ backgroundColor: Colors[colorScheme].secondaryBackground }}
      >
        <View style={styles.contentTopRow}>
          <MyText style={{ fontSize: 18, padding: 6 }}>Attach Files</MyText>
        </View>
        <ScrollView style={[styles.scroll, { backgroundColor: Colors[colorScheme].contentBackground }]} contentContainerStyle={styles.container}>
          <View style={styles.selectedFiles}>
            <MyText style={{ color: Colors[colorScheme].textInactive }}>Files ({files?.length || 0})</MyText>
            <View style={styles.fileItems}>
              {files.map((file) => (
                <View key={`project-file_${file.id}`} style={styles.fileItem}>
                  <Ionicons name="ios-document-outline" size={32} color="#aaa" style={{ margin: 4 }} />
                  <MyText style={{ fontWeight: '400', color: '#666' }}>{file.name}</MyText>
                  <Pressable style={styles.closeIcon} onPress={onDeleteFile(file.id)}>
                    <Ionicons name="ios-close" color={Colors[colorScheme].text} />
                  </Pressable>
                </View>
              ))}
              {isLoading ? (
                <View style={styles.addLoader}>
                  <ActivityIndicator color={Colors[colorScheme].tint} />
                </View>
              ) : (
                <TouchableOpacity style={styles.addNewFile} onPress={onAddFile} disabled={isLoading}>
                  <Ionicons name="ios-add-sharp" size={36} color="#ddd" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </BottomSheet>
    </>
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
    width: '100%',
    height: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scroll: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  container: {
    padding: 12,
  },
  selectedFiles: {
    width: '100%',
  },
  fileItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  fileItem: {
    width: itemSize,
    height: itemSize,
    margin: itemMargin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewFile: {
    width: itemSize,
    height: itemSize,
    margin: itemMargin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingLeft: 3,
  },
  addLoader: {
    width: itemSize,
    height: itemSize,
    margin: itemMargin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
