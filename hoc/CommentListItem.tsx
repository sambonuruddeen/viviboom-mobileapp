import { useActionSheet } from '@expo/react-native-action-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DateTime } from 'luxon';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Alert, ImageRequireSource, Platform, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import CommentApi from 'rn-viviboom/apis/viviboom/CommentApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import MyImage from './MyImage';
import MyText from './MyText';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;

const DEFAULT_PROFILE_IMAGE_SIZE = 128;

interface IProps {
  preloadedData: ProjectComment;
  showChildComment?: boolean;
  isPreview?: boolean;
  onPress?: () => void;
  onShowAll?: () => void;
  onPressMainComment?: () => void;
  reloadData?: () => void;
}

const CommentListItem = memo(({ preloadedData, showChildComment, isPreview, onPress, onShowAll, onPressMainComment, reloadData }: IProps) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const { showActionSheetWithOptions } = useActionSheet();
  const user = useReduxStateSelector((s) => s?.account);

  const [comment, setComment] = useState<ProjectComment>(preloadedData);

  const [isUserLiked, setUserLiked] = useState<boolean>(!!comment.likes?.find((l) => l.userId === user.id));
  const [isUserLikedChildComment, setUserLikedChildComment] = useState<boolean>(
    comment.childComments.length ? !!comment.childComments[0].likes?.find((l) => l.userId === user.id) : false,
  );
  const [isLikeLoading, setLikeLoading] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const isAuthor = useMemo(() => user.id === comment.userId, [user, comment]);

  useEffect(() => {
    setComment(preloadedData);
  }, [preloadedData]);

  const onLikePress = useCallback(async () => {
    setLikeLoading(true);
    try {
      const res = await CommentApi.like({
        authToken: user?.authToken,
        commentId: comment?.id,
        isLike: !isUserLiked,
      });
      setUserLiked(res.data?.isLike);
      setComment({ ...comment, likeCount: comment.likeCount + (res.data?.isLike ? 1 : -1) });
    } catch (err) {
      console.error(err);
    }
    setLikeLoading(false);
  }, [user?.authToken, comment, isUserLiked]);

  const onLikeChildCommentPress = useCallback(async () => {
    if (!comment?.childComments.length) return;
    setLikeLoading(true);
    try {
      const res = await CommentApi.like({
        authToken: user?.authToken,
        commentId: comment?.childComments[0].id,
        isLike: !isUserLikedChildComment,
      });
      setUserLikedChildComment(res.data?.isLike);
      const newChildComments = [...comment.childComments];
      newChildComments[0] = { ...newChildComments[0], likeCount: newChildComments[0].likeCount + (res.data?.isLike ? 1 : -1) };
      setComment({ ...comment, childComments: newChildComments });
    } catch (err) {
      console.error(err.response.data.message);
    }
    setLikeLoading(false);
  }, [user?.authToken, comment, isUserLikedChildComment]);

  const handleDeleteComment = useCallback(async () => {
    setLoading(true);
    try {
      await CommentApi.deleteComment({ authToken: user?.authToken, commentId: comment?.id });
      setLoading(false);

      if (reloadData) reloadData();
      Toast.show({ text1: t('Comment Deleted!'), type: 'success' });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ text1: err?.response?.data?.message, type: 'error' });
      console.log(err);
    }
  }, [comment?.id, reloadData, t, user?.authToken]);

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

  // long press to delete/flag individual comment
  const onLongPress = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: isAuthor ? ['Cancel', 'Delete'] : ['Cancel', 'Flag'],
        destructiveButtonIndex: 1,
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
  }, [handleDeleteComment, handleFlagComment, isAuthor, showActionSheetWithOptions, t]);

  const dateString = useMemo(() => {
    let res = '-';
    try {
      res = DateTime.fromJSDate(new Date(comment?.createdAt)).toLocaleString(DateTime.DATE_MED);
    } catch (err) {
      console.warn(err);
    }
    return res;
  }, [comment?.createdAt]);

  return (
    <Pressable style={styles.container} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.topRow}>
        <Pressable style={styles.profileContainer} onPress={() => navigation.push('MemberScreen', { preloadedData: comment?.user })}>
          <MyImage
            uri={comment?.user?.profileImageUri}
            params={{ width: DEFAULT_PROFILE_IMAGE_SIZE }}
            style={styles.profileImage}
            defaultSource={DefaultProfilePictureTyped}
          />
          <Pressable style={styles.nameAndTime} onPress={onPressMainComment} onLongPress={onLongPress}>
            <MyText style={{ ...styles.userText, color: Colors[colorScheme].textSecondary }}>{comment?.user?.name}</MyText>
            <MyText style={styles.dateText}>{dateString}</MyText>
          </Pressable>
        </Pressable>
        <TouchableOpacity style={styles.likeContainer} onPress={onLikePress}>
          <MyText style={styles.likeCount}>{comment.likeCount}</MyText>
          <MaterialCommunityIcons
            name={isUserLiked ? 'thumb-up' : 'thumb-up-outline'}
            size={20}
            color={isUserLiked ? 'rgb(248,48,95)' : Colors[colorScheme].text}
          />
        </TouchableOpacity>
      </View>
      <Pressable style={styles.commentBody} onPress={onPressMainComment} onLongPress={onLongPress}>
        <MyText style={styles.commentText}>{comment?.text}</MyText>
      </Pressable>
      {!!comment?.childComments?.length && showChildComment && (
        <View style={styles.nestedComment}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
              <View style={{ borderLeftColor: '#aaa', borderLeftWidth: 2, height: 14, marginBottom: 2 }} />
              <MyText style={styles.nestedUserText}>{comment.childComments[0].user?.name}</MyText>
            </View>
            <TouchableOpacity style={styles.likeContainer} onPress={onLikeChildCommentPress}>
              <MyText style={styles.likeCount}>{comment.childComments[0].likeCount}</MyText>
              <MaterialCommunityIcons
                name={isUserLikedChildComment ? 'thumb-up' : 'thumb-up-outline'}
                size={20}
                color={isUserLikedChildComment ? 'rgb(248,48,95)' : Colors[colorScheme].text}
              />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <View style={{ opacity: 0, borderLeftWidth: 2, height: 14 }} />
            <MyText style={styles.nestedText}>{comment.childComments[0].text}</MyText>
          </View>
          {comment.childComments.length > 1 && !isPreview && (
            <TouchableOpacity style={styles.showAllButton} onPress={onShowAll}>
              <MyText style={{ color: Colors[colorScheme].tint }}>Show All ({comment.childComments.length})</MyText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Pressable>
  );
});

export default CommentListItem;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 24,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileContainer: {
    flexDirection: 'row',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  nameAndTime: {
    padding: Platform.OS === 'ios' ? 2 : 0,
  },
  userText: {
    fontWeight: '400',
    fontSize: 16,
  },
  dateText: {
    fontWeight: '400',
    fontSize: 10,
    color: '#aaa',
    marginTop: Platform.OS === 'ios' ? 4 : 0,
  },
  likeContainer: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
  },
  likeCount: {
    marginTop: Platform.OS === 'ios' ? 7 : 2,
    marginRight: 6,
    fontWeight: '400',
    fontSize: 14,
  },
  commentBody: {
    marginLeft: 48,
    marginRight: 24,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  commentText: {
    fontWeight: '400',
    fontSize: 16,
  },
  nestedComment: {
    marginLeft: 48,
    paddingVertical: 6,
    paddingLeft: 2,
  },
  nestedUserText: {
    paddingLeft: 6,
    fontSize: 16,
    fontWeight: '400',
    color: '#aaa',
    borderLeftColor: '#aaa',
  },
  nestedText: {
    marginTop: 4,
    paddingLeft: 6,
    fontSize: 16,
    fontWeight: '400',
  },
  showAllButton: {
    marginTop: 8,
  },
});
