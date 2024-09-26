import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import CommentApi from 'rn-viviboom/apis/viviboom/CommentApi';
import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import OnboardingReduxActions from 'rn-viviboom/redux/onboarding/OnboardingReduxActions';

interface AddCommentViewProps {
  show: boolean;
  keepMounted?: boolean;
  handleClose?: () => void;
  focusOnShow?: boolean;
  projectId?: number;
  replyToComment?: ProjectComment;
  editComment?: ProjectComment;
  reloadData?: () => void;
}

export default function AddCommentView({
  show,
  keepMounted,
  handleClose,
  focusOnShow,
  projectId,
  replyToComment,
  editComment,
  reloadData,
}: AddCommentViewProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);
  const [text, setText] = useState('');
  const [isLoading, setLoading] = useState(false);

  const inputRef = useRef<TextInput>();

  const handleAddComment = useCallback(async () => {
    if (text.length <= 0) {
      Toast.show({ text1: t('Empty comment is not allowed'), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await CommentApi.post({
        authToken,
        projectId,
        text,
        parentCommentId: replyToComment?.id,
      });
      // console.log(res?.data.commentId);
    } catch (err) {
      console.log(err);
    }
    setText('');
    setLoading(false);
  }, [authToken, projectId, replyToComment?.id, t, text]);

  const handleEditComment = useCallback(async () => {
    setLoading(true);
    try {
      await CommentApi.patch({ authToken, commentId: editComment?.id, text, isFlagged: undefined });
      Toast.show({ text1: t('Comment Edited!'), type: 'success' });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ text1: err?.response?.data?.message, type: 'error' });
    }
    setText('');
    setLoading(false);
  }, [authToken, editComment?.id, t, text]);

  const onSendPress = useCallback(async () => {
    if (editComment) {
      await handleEditComment();
    } else {
      await handleAddComment();
    }
    // reload to show new comments
    if (reloadData) reloadData();
    if (handleClose) {
      inputRef?.current?.blur();
      handleClose();
    }
  }, [editComment, handleAddComment, handleClose, handleEditComment, reloadData]);

  useEffect(() => {
    if (show && focusOnShow) {
      if (Platform.OS === 'ios') inputRef?.current?.focus();
      else setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [focusOnShow, show]);

  useEffect(() => {
    if (editComment) setText(editComment?.text);
  }, [editComment]);

  return (
    (keepMounted || show) && (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { marginBottom: insets.bottom, backgroundColor: Colors[colorScheme].contentBackground }]}
      >
        <View style={styles.contentContainer}>
          <TextInput
            multiline
            style={[styles.textInput, { backgroundColor: Colors[colorScheme].textInput, color: Colors[colorScheme].text }]}
            placeholder={replyToComment ? `Reply to ${replyToComment?.user?.name}` : t('Add comment')}
            value={text}
            onChangeText={setText}
            ref={inputRef}
            onBlur={handleClose}
            placeholderTextColor={Colors[colorScheme].textSecondary}
          />
          <View style={styles.button}>
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <MyButton compact onPress={onSendPress} disabled={isLoading} labelStyle={{ marginHorizontal: 0, color: Colors[colorScheme].tint }}>
                {editComment ? 'Save' : 'Send'}
              </MyButton>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopColor: '#rgba(160, 160, 160, 0.2)',
    borderTopWidth: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    height: 60,
  },
  textInput: {
    flex: 1,
    minHeight: 32,
    maxHeight: 100,
    borderRadius: 16,
    marginLeft: 12,
    paddingLeft: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : undefined,
  },
  button: {
    width: '10%',
    maxWidth: 80,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
