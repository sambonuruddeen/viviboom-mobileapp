/* eslint-disable indent */
import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { ActivityIndicator } from 'react-native-paper';
import { interpolate } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DefaultProjectPicture from 'rn-viviboom/assets/images/default-project-picture.png';
import { getApiUrl } from 'rn-viviboom/constants/Config';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyText from 'rn-viviboom/hoc/MyText';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';
import CreateProjectReduxActions from 'rn-viviboom/redux/createProject/CreateProjectReduxActions';

const DEFAULT_THUMBNAIL_WIDTH = 128;
const DEFAULT_PREVIEW_WIDTH = 1024;
const screen = Dimensions.get('screen');
const thumbnailWidth = screen.width - 2 * 24; // account for padding

const itemSize = 80;
const centerOffset = screen.width / 2 - itemSize / 2;

const LargeImagePreviewComponent = memo(({ uri }: { uri: string }) => (
  <View style={{ flex: 1, justifyContent: 'center' }}>
    <MyImage uri={uri} params={{ width: DEFAULT_THUMBNAIL_WIDTH }} style={{ width: screen.width }} />
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator />
    </View>
  </View>
));

const CarouselItem = ({ item }: { item: { localUri: string; previewUri: string; width: number; height: number; isGif?: boolean } }) => (
  <View style={styles.carouselItem}>
    {!!item.localUri && (
      <MyImage
        uri={item.localUri}
        params={{ width: DEFAULT_PREVIEW_WIDTH }}
        defaultSource={DefaultProjectPicture}
        style={{ width: thumbnailWidth }}
        preloadComponent={<LargeImagePreviewComponent uri={item.previewUri} />}
        imageFormat={item.isGif ? 'gif' : 'jpg'}
      />
    )}
    {!item.localUri && (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
        <ActivityIndicator color="#fff" size={36} style={{ margin: 12 }} />
        <MyText style={{ color: '#fff', textAlign: 'center' }}>Videos uploading... Thumbnails will be generated when upload completes.</MyText>
      </View>
    )}
  </View>
);

const PreviewCarouselItem = ({ item, onPress, isSelected }: { item: { previewUri: string; isGif: boolean }; onPress: () => void; isSelected: boolean }) => (
  <TouchableWithoutFeedback containerStyle={styles.previewImageContainer} onPress={onPress}>
    <MyImage uri={item.previewUri} params={{ width: DEFAULT_THUMBNAIL_WIDTH }} style={isSelected ? styles.selectedPreviewImage : styles.previewImage} />
    {item.isGif && (
      <View style={styles.gifTag}>
        <MyText style={{ color: '#eee', fontSize: 12 }}>GIF</MyText>
      </View>
    )}
  </TouchableWithoutFeedback>
);

export default function SelectThumbnailScreen({ navigation }: RootStackScreenProps<'SelectThumbnailScreen'>) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();

  const carouselRef = useRef();
  const previewCarouselRef = useRef();

  const { thumbnailUri } = useReduxStateSelector((state) => state.createProject);
  const { videos, images, id: projectId } = useReduxStateSelector((state) => state.createProject);
  const data = useMemo(
    () => [
      ...images.map((v) => ({
        uri: !Number.isNaN(v.id) ? `${Config.ApiBaseUrl}/v2/project/${projectId}/image/${v.id}` : null,
        localUri: v.uri,
        previewUri: v.uri,
        key: `project-cover-image_${v.id}`,
        width: v.width,
        height: v.height,
      })),
      ...videos.map((v) => ({
        uri: !Number.isNaN(v.id) ? `${Config.ApiBaseUrl}/v2/project/${projectId}/video/${v.id}/thumbnail` : null,
        localUri: v.thumbnailUri,
        previewUri: v.localThumbnailUri || v.thumbnailUri,
        key: `project-cover-thumbnail_${v.id}`,
        width: v.width,
        height: v.height,
      })),
      ...videos.map((v) => ({
        uri: !Number.isNaN(v.id) ? `${Config.ApiBaseUrl}/v2/project/${projectId}/video/${v.id}/animated-image` : null,
        localUri: v.animatedImageUri,
        previewUri: v.localThumbnailUri || v.thumbnailUri,
        key: `project-cover-animated_${v.id}`,
        width: v.width,
        height: v.height,
        isGif: true,
      })),
    ],
    [images, projectId, videos],
  );

  const animationStyle = (value: number) => {
    'worklet';

    const itemGap = interpolate(value, [-3, -2, -1, 0, 1, 2, 3], [-30, -15, 0, 0, 0, 15, 30]);

    const translateX = interpolate(value, [-1, 0, 1], [-itemSize, 0, itemSize]) + centerOffset - itemGap;

    const scale = interpolate(value, [-1, -0.5, 0, 0.5, 1], [0.8, 0.85, 1.1, 0.85, 0.8]);

    return {
      transform: [
        {
          translateX,
        },
        { scale },
      ],
    };
  };

  // eslint-disable-next-line prettier/prettier
  const [carouselIndex, setCarouselIndex] = useState(Math.max(data.findIndex((v) => v.uri === thumbnailUri), 0));

  const onDone = () => {
    if (data[carouselIndex].uri) CreateProjectReduxActions.setProject({ thumbnailUri: data[carouselIndex].uri });
    navigation.pop();
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const goToSlide = (index: number) => {
    previewCarouselRef.current?.scrollTo({ index });
    carouselRef.current?.scrollTo({ index });
    setCarouselIndex(index);
  };

  const onCarouselSnap = (index: number) => {
    setCarouselIndex(index);
    previewCarouselRef.current?.scrollTo({ index });
  };

  const onPreviewSnap = (index: number) => {
    setCarouselIndex(index);
    carouselRef.current?.scrollTo({ index });
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, react/prop-types, @typescript-eslint/no-unsafe-argument
  const renderPreviewItem = (props) => <PreviewCarouselItem {...props} isSelected={carouselIndex === props.index} onPress={() => goToSlide(props.index)} />;

  return (
    <View style={styles.container}>
      <View style={styles.mediaCarousel}>
        <Carousel
          ref={carouselRef}
          width={screen.width}
          height={screen.height}
          data={data}
          defaultIndex={carouselIndex}
          renderItem={CarouselItem}
          onSnapToItem={onCarouselSnap}
          loop={false}
        />
      </View>
      <View style={{ ...styles.header, paddingTop: insets.top, height: styles.header.height + insets.top }}>
        <View style={styles.backButton}>
          <TouchableOpacity onPress={() => navigation.pop()}>
            <Ionicons name="ios-close-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
        <MyButton compact style={styles.selectButton} labelStyle={{ fontSize: 14 }} mode="text" onPress={onDone}>
          Done
        </MyButton>
      </View>
      <View style={{ ...styles.footer, paddingBottom: insets.bottom, height: styles.footer.height + insets.bottom }}>
        <Carousel
          ref={previewCarouselRef}
          width={itemSize}
          height={itemSize}
          style={{ width: screen.width, height: 120, alignItems: 'center' }}
          loop={false}
          data={data}
          defaultIndex={carouselIndex}
          renderItem={renderPreviewItem}
          onSnapToItem={onPreviewSnap}
          customAnimation={animationStyle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  backButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    width: 70,
  },
  mediaCarousel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  carouselItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 140,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewScroll: {
    flexDirection: 'row',
  },
  previewImageContainer: {
    margin: 2,
  },
  previewImage: {
    borderRadius: 6,
    width: '100%',
    height: '100%',
  },
  selectedPreviewImage: {
    borderRadius: 6,
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: '#7353ff',
  },
  selectButton: {
    height: 36,
    marginRight: 10,
    paddingVertical: 0,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  gifTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    width: 24,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 3,
  },
});
