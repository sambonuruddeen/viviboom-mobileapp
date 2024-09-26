import { useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import CommentApi from 'rn-viviboom/apis/viviboom/CommentApi';
import Colors from 'rn-viviboom/constants/Colors';
import { CommentOrderType } from 'rn-viviboom/enums/CommentOrderType';
import CommentListItem from 'rn-viviboom/hoc/CommentListItem';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

import AddCommentView from './AddCommentView';

const DEFAULT_LIMIT = 9;

export default function CommentScreen({ navigation, route }: RootStackScreenProps<'CommentScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const user = useReduxStateSelector((state) => state.account);

  const { preloadedData } = route.params;
  const [comment, setComment] = useState(preloadedData);

  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [isEndOfComments, setIsEndOfComments] = useState(false);
  const [childComments, setChildComments] = useState<ProjectComment[]>([]);

  const [showAddCommentView, setShowAddCommentView] = useState(false);
  const [replyToComment, setReplyToComment] = useState(comment);
  const [editComment, setEditComment] = useState<ProjectComment>(null);

  const [isLoading, setLoading] = useState(false);

  const isAuthor = useMemo(() => user.id === comment.userId, [user, comment]);

  const onBackPressed = useCallback(() => {
    navigation.pop();
  }, [navigation]);

  const onCommentPress = useCallback(
    (pressedComment: ProjectComment) => () => {
      setReplyToComment(pressedComment);
      setShowAddCommentView(true);
    },
    [],
  );

  // API calls
  const fetchComment = useCallback(async () => {
    try {
      const res = await CommentApi.get({ authToken: user?.authToken, commentId: comment?.id });
      setComment(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [comment?.id, user?.authToken]);

  const fetchComments = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingComments) return;
      if (!hardRefresh && isEndOfComments) return;
      setIsFetchingComments(true);

      const requestParams = {
        authToken: user?.authToken,
        parentCommentId: comment?.id,
        offset: hardRefresh ? 0 : childComments.length,
        order: CommentOrderType.LATEST,
        limit: DEFAULT_LIMIT,
      };

      try {
        const res = await CommentApi.getList(requestParams);
        if (hardRefresh) {
          setChildComments(res.data.comments);
        } else {
          setChildComments([...childComments, ...res.data.comments]);
        }

        // check if end of list
        if (res.data.comments.length < DEFAULT_LIMIT) {
          setIsEndOfComments(true);
        }
      } catch (err) {
        console.error(err);
      }

      setIsFetchingComments(false);
    },
    [isFetchingComments, isEndOfComments, user?.authToken, comment?.id, childComments],
  );

  const handleDeleteComment = useCallback(async () => {
    setLoading(true);
    try {
      await CommentApi.deleteComment({ authToken: user?.authToken, commentId: comment?.id });
      setLoading(false);
      // reload to show new comments
      await fetchComments();
      Toast.show({ text1: t('Comment Deleted!'), type: 'success' });
      onBackPressed();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ text1: err?.response?.data?.message, type: 'error' });
      console.log(err);
    }
  }, [comment?.id, fetchComments, onBackPressed, t, user?.authToken]);

  const handleFlagComment = useCallback(async () => {
    if (comment.isFlagged) {
      Toast.show({ text1: t('This comment is already flagged'), type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await CommentApi.patch({ authToken: user?.authToken, text: undefined, commentId: comment?.id, isFlagged: true });

      Toast.show({ text2: t('Thanks! This comment has been flagged for review'), type: 'info' });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ text1: err?.response?.data?.message || err, type: 'error' });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log(err?.response?.data?.message);
    }

    setLoading(false);
  }, [comment?.id, comment.isFlagged, t, user?.authToken]);

  const onMorePressed = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: isAuthor ? ['Cancel', 'Edit', 'Delete'] : ['Cancel', 'Flag'],
        destructiveButtonIndex: isAuthor ? 2 : 1,
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (!isAuthor && buttonIndex === 1) {
          // flag comment
          Alert.alert(t('Do you want to flag this comment for review?'), null, [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            { text: 'OK', onPress: handleFlagComment, style: 'destructive' },
          ]);
        } else if (isAuthor && buttonIndex === 1) {
          // edit comment
          setEditComment(comment);
          setShowAddCommentView(true);
        } else if (isAuthor && buttonIndex === 2) {
          // delete comment
          Alert.alert(t('Are you sure you want to delete this comment?'), null, [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            { text: 'OK', onPress: handleDeleteComment, style: 'destructive' },
          ]);
        }
      },
    );
  }, [comment, handleDeleteComment, handleFlagComment, isAuthor, showActionSheetWithOptions, t]);

  useEffect(() => {
    fetchComments(true);
  }, []);

  const flatListRenderHeader = useCallback(
    () => (
      <>
        <CommentListItem preloadedData={comment} onPress={onCommentPress(comment)} onPressMainComment={onCommentPress(comment)} />
        <View style={styles.replyTitle}>
          <MyText style={{ fontSize: 16 }}>{childComments?.length || 0} Replies</MyText>
        </View>
      </>
    ),
    [childComments?.length, comment, onCommentPress],
  );

  const flatListRenderItem = useCallback(
    ({ item, index }) => <CommentListItem preloadedData={item} onPress={onCommentPress(item)} onPressMainComment={onCommentPress(item)} />,
    [onCommentPress],
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme].contentBackground }]}>
      <View style={{ ...styles.headerContainer, paddingTop: insets.top, height: styles.headerContainer.height + insets.top }}>
        <View style={styles.headerButton}>
          <TouchableOpacity onPress={onBackPressed}>
            <Ionicons name="ios-chevron-back-outline" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
        <MyText style={styles.title}>{childComments?.length || 0} Replies</MyText>
        <View style={styles.headerButton}>
          <TouchableOpacity onPress={onMorePressed}>
            <Ionicons name="ios-ellipsis-horizontal" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bodyContainer}>
        <FlatList
          ListHeaderComponent={flatListRenderHeader}
          data={childComments}
          renderItem={flatListRenderItem}
          onEndReached={() => fetchComments(false)}
          refreshing={isFetchingComments}
          onRefresh={() => fetchComments(true)}
          keyExtractor={(item) => `comment_${comment?.id}-child_${item.id}`}
        />
      </View>
      <AddCommentView
        show={showAddCommentView}
        handleClose={() => {
          setShowAddCommentView(false);
          setReplyToComment(comment);
          setEditComment(null);
        }}
        keepMounted
        focusOnShow
        projectId={comment.projectId}
        replyToComment={replyToComment}
        editComment={editComment}
        reloadData={() => {
          fetchComments(true);
          fetchComment();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headerContainer: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 50,
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
  },
  replyTitle: {
    marginTop: 16,
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
});
