import { ActionSheetProvider, useActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, LayoutChangeEvent, Modal, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { TouchableOpacity as GHTouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import Config from 'rn-viviboom/constants/Config';
import Layout from 'rn-viviboom/constants/Layout';
import { CACHE_FOLDER } from 'rn-viviboom/hoc/CacheManager';
import MyImage from 'rn-viviboom/hoc/MyImage';
import MyVideo from 'rn-viviboom/hoc/MyVideo';

const DEFAULT_PROJECT_IMAGE_SIZE = Layout.screen.width > 600 ? 1024 : 512;
const LARGE_PROJECT_IMAGE_SIZE = 1024;

const screen = Dimensions.get('screen');
const minCarouselHeight = (screen.width * 9) / 16;

const CarouselItem = ({
  item,
  shouldPlay,
  mediaWidth,
  mediaHeight,
  positionMillis,
  isShowingModal,
  onPress,
  onVideoPositionUpdate,
}: {
  item: MediaInfo;
  shouldPlay: boolean;
  mediaWidth: number;
  mediaHeight: number;
  positionMillis: number;
  fullScreenMode: false;
  isShowingModal: boolean;
  onPress?: () => void;
  onVideoPositionUpdate: (position: number) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [startPosition, setStartPosition] = useState(positionMillis);

  useEffect(() => {
    setStartPosition(positionMillis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowingModal]);

  return (
    <View style={styles.carouselItem}>
      {item.type === 'video' ? (
        <View style={{ paddingTop: insets.top }}>
          <MyVideo
            src={item.uri}
            key={`project-screen-video_${item.id}`}
            style={{ borderRadius: 0, width: mediaWidth, height: '100%' }}
            shouldPlay={shouldPlay}
            positionMillis={startPosition}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={(status) => onVideoPositionUpdate(status.positionMillis)}
            onContainerPress={onPress}
          />
        </View>
      ) : (
        <GHTouchableOpacity activeOpacity={1} onPress={onPress}>
          <MyImage uri={item.uri} key={item.uri} params={{ width: DEFAULT_PROJECT_IMAGE_SIZE }} style={{ width: mediaWidth, height: mediaHeight }} />
        </GHTouchableOpacity>
      )}
    </View>
  );
};

const LargeImagePreviewComponent = memo(({ uri }: { uri: string }) => (
  <View style={{ flex: 1, justifyContent: 'center' }}>
    <MyImage uri={uri} params={{ width: DEFAULT_PROJECT_IMAGE_SIZE }} style={{ width: screen.width }} />
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator />
    </View>
  </View>
));

const ModalCarouselItem = ({
  item,
  shouldPlay,
  positionMillis,
  isShowingModal,
  onVideoPositionUpdate,
  onClose,
}: {
  item: MediaInfo;
  shouldPlay: boolean;
  positionMillis: number;
  isShowingModal: boolean;
  onVideoPositionUpdate: (position: number) => void;
  onClose: () => void;
}) => {
  const touchPos = useRef([0, 0]);
  const [startPosition, setStartPosition] = useState(positionMillis);

  useEffect(() => {
    setStartPosition(positionMillis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowingModal]);

  return (
    <View
      style={styles.carouselItem}
      onTouchStart={(e) => {
        touchPos.current = [e.nativeEvent.pageX, e.nativeEvent.pageY];
      }}
      onTouchEnd={(e) => {
        const [x0, y0] = touchPos.current;
        const { pageX: x1, pageY: y1 } = e.nativeEvent;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const slope = Math.abs(dy / dx);
        // close the modal with some swipe down gesture threshold
        if (dy > 15 && slope > 3) onClose();
      }}
    >
      {item.type === 'video' ? (
        <MyVideo
          src={item.uri}
          key={`project-screen-video_${item.id}`}
          style={{ borderRadius: 0, width: screen.width, height: screen.height }}
          shouldPlay={shouldPlay}
          shouldMount={shouldPlay}
          positionMillis={startPosition}
          resizeMode={ResizeMode.CONTAIN}
          carouselMode
          onPlaybackStatusUpdate={(status) => onVideoPositionUpdate(status.positionMillis)}
          useNativeControls
        />
      ) : (
        <MyImage
          uri={item.uri}
          key={item.uri}
          params={{ width: LARGE_PROJECT_IMAGE_SIZE }}
          preloadComponent={<LargeImagePreviewComponent uri={item.uri} />}
          style={{ width: screen.width }}
          zoomEnabled={shouldPlay}
        />
      )}
    </View>
  );
};

interface ProjectMediaCarouselProps {
  project: Project;
  projectSection?: ProjectSection;
  isProjectLoading?: boolean;
  carouselWidth?: number;
}

export default function ProjectMediaCarousel({ project, projectSection, isProjectLoading, carouselWidth }: ProjectMediaCarouselProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();
  const { showActionSheetWithOptions } = useActionSheet();
  const section: { images?: { uri: string }[]; videos?: { thumbnailUri: string; uri: string }[] } = useMemo(
    () => projectSection || project,
    [project, projectSection],
  );
  const data = useMemo(
    () => [...(section?.videos?.map((v) => ({ ...v, type: 'video' })) || []), ...(section?.images?.map((v) => ({ ...v, type: 'image' })) || [])],
    [section?.images, section?.videos],
  );
  const carouselRef = useRef();
  const modalCarouselRef = useRef();

  const [carouselHeight, setCarouselHeight] = useState(minCarouselHeight);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [videoPositions, setVideoPositions] = useState(project?.videos?.map(() => 0) || []);

  const authorName = useMemo(() => {
    if (project?.authorUsers?.length < 2) {
      return `${project?.authorUsers?.[0]?.name || ''}`;
    }
    if (project?.authorUsers?.length === 2) {
      return t('authors', { name1: project?.authorUsers?.[0]?.name, name2: project?.authorUsers?.[1]?.name });
    }
    return t('authorOthers', { name: project?.authorUsers?.[0]?.name });
  }, [project?.authorUsers, t]);

  const onVideoPositionUpdate = useCallback(
    (index: number) => (position: number) => {
      if (!position || position === videoPositions[index]) return;
      const newPositions = [...videoPositions];
      newPositions[index] = position;
      setVideoPositions(newPositions);
    },
    [videoPositions],
  );

  const onPreviewLayout = useCallback((e: LayoutChangeEvent) => {
    setCarouselHeight(e.nativeEvent.layout.height);
  }, []);

  const onCarouselSnap = useCallback((index: number) => {
    setCarouselIndex(index);
    modalCarouselRef.current?.scrollTo({ index });
  }, []);

  const onModalCarouselSnap = useCallback((index: number) => {
    setCarouselIndex(index);
    carouselRef.current?.scrollTo({ index });
  }, []);

  const onPressMore = () => {
    showActionSheetWithOptions(
      {
        options: ['Cancel', 'Share', 'Save To Album'],
        cancelButtonIndex: 0,
        useModal: true,
      },
      async (buttonIndex) => {
        if (buttonIndex === 1) {
          try {
            const paramsSuffix = `width-${DEFAULT_PROJECT_IMAGE_SIZE}`;
            const cacheFilename = `${CACHE_FOLDER}${data[carouselIndex].uri?.split('/v2/')?.[1]?.replace(/\//g, '-')}-${paramsSuffix}.jpg`;
            const projectUrl = `${Config.MobileAppUrl}/project/${project?.id}`;
            const message = `Check out ${project.name} by ${authorName} on VIVIBOOM`;
            const result = await Share.share({
              message: Platform.OS === 'ios' ? message : projectUrl,
              url: cacheFilename,
              title: message,
            });
            if (result.action === Share.sharedAction) {
              Toast.show({ text1: 'Yay! Project shared successfully', type: 'success' });
              setShowCarouselModal(false);
            }
          } catch (error) {
            Toast.show({ text1: error?.message, type: 'error' });
            setShowCarouselModal(false);
          }
        } else if (buttonIndex === 2) {
          const paramsSuffix = `width-${DEFAULT_PROJECT_IMAGE_SIZE}`;
          const cacheFilename = `${CACHE_FOLDER}${data[carouselIndex].uri?.split('/v2/')?.[1]?.replace(/\//g, '-')}-${paramsSuffix}.jpg`;
          const permissionResponse = await MediaLibrary.requestPermissionsAsync();
          if (!permissionResponse.granted) {
            Toast.show({ text1: 'Permission denined.', type: 'error' });
            return;
          }
          await MediaLibrary.saveToLibraryAsync(cacheFilename);
          Toast.show({ text1: 'Yay! Project picture saved successfully', type: 'success' });
        }
      },
    );
  };

  const renderItem = (props) => (
    <CarouselItem
      {...props}
      shouldPlay={props.index === carouselIndex && !isProjectLoading && !showCarouselModal}
      mediaWidth={carouselWidth || screen.width}
      mediaHeight={carouselHeight}
      positionMillis={props.index < videoPositions.length ? videoPositions[props.index] : 0}
      onPress={() => setShowCarouselModal(true)}
      isShowingModal={showCarouselModal}
      onVideoPositionUpdate={onVideoPositionUpdate(props.index)}
    />
  );

  const renderModalItem = (props) => (
    <ModalCarouselItem
      {...props}
      shouldPlay={props.index === carouselIndex && !isProjectLoading && showCarouselModal}
      positionMillis={props.index < videoPositions.length ? videoPositions[props.index] : 0}
      isShowingModal={showCarouselModal}
      onVideoPositionUpdate={onVideoPositionUpdate(props.index)}
      onClose={() => setShowCarouselModal(false)}
    />
  );

  return (
    <>
      <View style={styles.container}>
        <View onLayout={onPreviewLayout} style={{ position: 'absolute', opacity: 0, minHeight: minCarouselHeight, maxHeight: (screen.height * 3) / 4 }}>
          {data[0]?.type === 'video' ? (
            <View style={{ paddingTop: insets.top }}>
              <MyImage uri={data[0]?.thumbnailUri} params={{ width: 128 }} style={{ width: carouselWidth || screen.width }} />
            </View>
          ) : (
            <MyImage uri={data[0]?.uri} params={{ width: 128 }} style={{ width: carouselWidth || screen.width }} />
          )}
        </View>
        <Carousel
          ref={carouselRef}
          width={carouselWidth || screen.width}
          height={carouselHeight} // auto height
          data={data}
          renderItem={renderItem}
          onSnapToItem={onCarouselSnap}
          loop={false}
        />
      </View>
      <Modal
        visible={showCarouselModal}
        onRequestClose={() => setShowCarouselModal(false)}
        hardwareAccelerated
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalContainer}>
            <Carousel
              ref={modalCarouselRef}
              width={screen.width}
              height={screen.height}
              data={data}
              defaultIndex={carouselIndex}
              renderItem={renderModalItem}
              onSnapToItem={onModalCarouselSnap}
              loop={false}
              panGestureHandlerProps={{ activeOffsetX: [-50, 50], maxPointers: 1 }}
            />
            <View style={{ ...styles.headerContainer, paddingTop: insets.top, height: styles.headerContainer.height + insets.top }}>
              <View style={styles.backButton}>
                <TouchableOpacity onPress={() => setShowCarouselModal(false)}>
                  <Ionicons name="ios-close-outline" size={30} color="#fff" />
                </TouchableOpacity>
              </View>
              {!!data.length && (
                <TouchableOpacity style={styles.mediaPressable} onPress={onPressMore}>
                  <Ionicons name="ios-ellipsis-horizontal-sharp" color="#fff" size={24} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </GestureHandlerRootView>
        <Toast position="bottom" />
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    minHeight: minCarouselHeight,
    maxHeight: (screen.height * 3) / 4,
  },
  mediaItem: {
    width: '100%',
    maxHeight: (3 / 4) * screen.height,
  },
  carouselItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    width: 70,
  },
  mediaPressable: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
