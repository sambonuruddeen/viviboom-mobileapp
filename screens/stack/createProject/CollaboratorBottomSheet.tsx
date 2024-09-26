import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import PickerSelect from 'react-native-picker-select';

import Colors from 'rn-viviboom/constants/Colors';
import { projectAuthorRoleTypes } from 'rn-viviboom/enums/ProjectAuthorRoleType';
import MyBottomSheetBackdrop from 'rn-viviboom/hoc/MyBottomSheetBackdrop';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

import SearchCollaboratorModal from './SearchCollaboratorModal';

interface CollaboratorBottomSheetProps {
  author?: User;
  show: boolean;
  handleClose: () => void;
}

export default function CollaboratorBottomSheet({ author, show, handleClose }: CollaboratorBottomSheetProps) {
  const colorScheme = useColorScheme();
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });

  const { authorUsers } = useReduxStateSelector((state) => state.createProject);
  const user = useReduxStateSelector((state) => state.account);

  const [selectedAuthorUser, setSelectedAuthorUser] = useState(author);
  const [role, setRole] = useState(author?.role || '');

  const [showSearchCollaborator, setShowSearchCollaborator] = useState(false);

  const snapPoints = useMemo(() => ['40%'], []);
  const bottomSheetRef = useRef<BottomSheet>();

  const onCancel = () => {
    setRole('');
    setSelectedAuthorUser(null);
    handleClose();
  };

  const onDone = () => {
    if (!author) {
      CreateProjectReduxActions.setProject({ authorUsers: [...authorUsers, { ...selectedAuthorUser, role }] });
    } else {
      const newAuthors = [...authorUsers];
      const authorIndex = newAuthors.findIndex((v) => v.id === author.id);
      newAuthors[authorIndex] = { ...selectedAuthorUser, role };
      CreateProjectReduxActions.setProject({ authorUsers: newAuthors });
    }
    onCancel();
  };

  useEffect(() => {
    if (show) {
      setSelectedAuthorUser(author);
      setRole(author?.role || '');
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [author, show]);

  const isOwner = user.id === author?.id;
  const isValid = role && selectedAuthorUser;

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
          <MyButton style={styles.topButton} compact onPress={onCancel} mode="text">
            Cancel
          </MyButton>
          <MyButton
            style={styles.topButton}
            labelStyle={{ color: isValid ? Colors[colorScheme].tint : '#aaa' }}
            compact
            onPress={onDone}
            mode="text"
            disabled={!isValid}
          >
            {author ? 'Save' : 'Add'}
          </MyButton>
        </View>
        <View style={[styles.roleContainer, { backgroundColor: Colors[colorScheme].background }]}>
          <MyText style={styles.roleText}>{t('Role')}</MyText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MyText style={styles.role}>{role}</MyText>
            <Ionicons name="ios-chevron-forward" size={16} color="#aaa" />
          </View>
          <View style={StyleSheet.absoluteFill}>
            <PickerSelect
              style={{ inputIOS: styles.pickerContainer, inputAndroid: styles.pickerContainer }}
              value={role}
              useNativeAndroidPickerStyle={false}
              onValueChange={setRole}
              items={projectAuthorRoleTypes.map((authorType) => ({ label: authorType, value: authorType }))}
            />
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowSearchCollaborator(true)}
          style={[styles.roleContainer, { backgroundColor: Colors[colorScheme].background, opacity: isOwner ? 0.5 : 1 }]}
          disabled={isOwner}
        >
          <MyText style={styles.roleText}>{t('Author')}</MyText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MyText style={styles.role}>{selectedAuthorUser ? `${selectedAuthorUser.name}, ${selectedAuthorUser.username}` : ''}</MyText>
            <Ionicons name="ios-chevron-forward" size={16} color="#aaa" />
          </View>
        </TouchableOpacity>
      </BottomSheet>
      <SearchCollaboratorModal
        show={showSearchCollaborator}
        authorUsers={authorUsers}
        handleClose={() => setShowSearchCollaborator(false)}
        onAddCollaborator={setSelectedAuthorUser}
      />
    </>
  );
}

const styles = StyleSheet.create({
  contentTopRow: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topButton: {
    width: 100,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
  roleContainer: {
    marginTop: 18,
    marginHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  roleText: {
    fontWeight: '400',
    fontSize: 16,
  },
  role: {
    fontWeight: '400',
    fontSize: 16,
    marginHorizontal: 8,
  },
  pickerContainer: {
    width: '100%',
    height: 44,
    opacity: 0,
  },
});
