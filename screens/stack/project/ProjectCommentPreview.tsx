import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageRequireSource, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import CommentApi from 'rn-viviboom/apis/viviboom/CommentApi';
import DefaultProfilePicture from 'rn-viviboom/assets/images/default-profile-picture.png';
import Colors from 'rn-viviboom/constants/Colors';
import { CommentOrderType } from 'rn-viviboom/enums/CommentOrderType';
import CommentListItem from 'rn-viviboom/hoc/CommentListItem';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const DefaultProfilePictureTyped = DefaultProfilePicture as ImageRequireSource;

const DEFAULT_LIMIT = 2;

interface ProjectCommentPreviewProps {
  projectId: number;
  onPressAdd: () => void;
  onPressShowAll: () => void;
  shouldReload: boolean;
}

export default function ProjectCommentPreview({ projectId, onPressAdd, onPressShowAll, shouldReload }: ProjectCommentPreviewProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const isFocus = useIsFocused();
  const user = useReduxStateSelector((state) => state?.account);

  const [isFetchingComments, setIsFetchingComments] = useState(false);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isFocus || shouldReload) fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocus, shouldReload, projectId]);

  // API calls
  const fetchComments = useCallback(async () => {
    if (isFetchingComments || !projectId) return;
    setIsFetchingComments(true);

    const requestParams = {
      authToken: user?.authToken,
      projectId,
      isRootCommentsOnly: true,
      offset: 0,
      order: CommentOrderType.LATEST,
      limit: DEFAULT_LIMIT,
    };

    try {
      const res = await CommentApi.getList(requestParams);
      setComments(res.data.comments);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error(err);
    }

    setIsFetchingComments(false);
  }, [isFetchingComments, user?.authToken, projectId]);

  return (
    <View style={styles.container}>
      {!comments.length && !isFetchingComments && (
        <View style={styles.noItemFound}>
          <MyText style={styles.noItemFoundText}>{t('No comments yet. Be the first!')}</MyText>
          <TouchableOpacity style={styles.addButton} onPress={onPressAdd}>
            <MyText style={{ color: Colors[colorScheme].tint }}>Comment Now</MyText>
          </TouchableOpacity>
        </View>
      )}
      {isFetchingComments && <ActivityIndicator />}
      <View style={styles.comments}>
        {comments.map((v) => (
          <CommentListItem
            key={`comment-preview_${v.id}`}
            preloadedData={v}
            showChildComment
            isPreview
            onPress={onPressShowAll}
            onPressMainComment={onPressShowAll}
            reloadData={fetchComments}
          />
        ))}
      </View>
      {!!totalCount && (
        <>
          <TouchableOpacity style={styles.showAll} onPress={onPressShowAll}>
            <MyText style={{ color: Colors[colorScheme].tint }}>Show All ({totalCount})</MyText>
          </TouchableOpacity>
          <View style={styles.addComment}>
            <MyImage uri={user?.profileImageUri} style={styles.profileImage} defaultSource={DefaultProfilePictureTyped} />
            <TouchableOpacity style={[styles.addCommentButton, { backgroundColor: Colors[colorScheme].textInput }]} activeOpacity={0.8} onPress={onPressAdd}>
              <MyText style={styles.addCommentText}>{t('Were you inspired? Comment to let the creators know!')}</MyText>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  noItemFound: {
    margin: 36,
    alignItems: 'center',
  },
  noItemFoundText: {
    textAlign: 'center',
    fontWeight: '400',
  },
  addButton: {
    marginTop: 12,
  },
  comments: {
    width: '100%',
  },
  showAll: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 18,
  },
  addComment: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 8,
    alignItems: 'center',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  addCommentButton: {
    flex: 1,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingTop: 3,
  },
  addCommentText: {
    color: '#aaa',
    fontWeight: '400',
    fontSize: 11,
  },
});
