import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import * as FileSystem from 'expo-file-system';
import { ComponentType, JSXElementConstructor, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, ImageRequireSource, ImageSourcePropType, ImageStyle, LogBox, StyleProp, StyleSheet, View } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

import CacheManager, { CACHE_FOLDER } from './CacheManager';

interface IProps {
  uri: string;
  params?: Record<string, string | number>;
  cacheKey?: string;
  cacheDisabled?: boolean;
  preloadComponent?: ComponentType<any> | ReactElement<any, string | JSXElementConstructor<any>>;
  defaultSource?: ImageRequireSource;
  style?: StyleProp<ImageStyle> | undefined;
  imageFormat?: 'gif' | 'jpg' | 'png';
  zoomEnabled?: boolean;
}

// this is to disable unncessary warning for cache miss images in development
LogBox.ignoreLogs(['Could not find image ']);

function MyImage(props: IProps) {
  const { uri, params, preloadComponent, defaultSource, cacheKey, cacheDisabled, imageFormat, style, zoomEnabled, ...rest } = props;
  const colorScheme = useColorScheme();
  const authToken = useReduxStateSelector((state) => state.account?.authToken);

  const requestUri = useMemo(() => (uri?.startsWith('http') && params ? `${uri}?${new URLSearchParams(params).toString()}` : uri), [uri, params]);

  // if no cache key is provided, use the uri string after '/v2/', e.g. https://api.viviboom.co/v2/project/100/image/200 => project-100-image-200
  const cacheImageUri = useMemo(() => {
    let cacheFilename = '';
    if (cacheKey) {
      cacheFilename = `${CACHE_FOLDER}${cacheKey}`;
    } else if (uri?.startsWith('http')) {
      const paramsSuffix = params ? Object.keys(params).reduce((str, param) => `${str}-${param}-${params[param]}`, '') : '';
      cacheFilename = `${uri?.split('/v2/')?.[1]?.replace(/\//g, '-')}${paramsSuffix}`;
    } else {
      return null;
    }
    return `${CACHE_FOLDER}${cacheFilename}.${imageFormat || 'jpg'}`;
  }, [cacheKey, uri, imageFormat, params]);

  const [_source, setSrc] = useState<ImageSourcePropType>();
  const [isImageLoading, setImageLoading] = useState(false);
  const [isCacheHit, setCacheHit] = useState(true); // assume cache hit first
  const [isImageReady, setImageReady] = useState(false);
  const [dimensions, setDimensions] = useState({});
  const componentIsMounted = useRef(true);
  const componentIdRef = useRef(uuid());

  const callback = useCallback((downloadProgress) => {
    // track progress
  }, []);

  const loadImage = useCallback(async () => {
    setImageLoading(true);
    try {
      const isLoadSuccess = await CacheManager.fetchFromUrlAndCache({
        uri: requestUri,
        fileUri: cacheImageUri,
        requestOptions: { headers: { 'auth-token': authToken } },
        callback,
      });

      if (!isLoadSuccess) setSrc(defaultSource);
      else setCacheHit(true); // change cache hit to true upon success fetch
    } catch (err) {
      console.log(err);
      setSrc(defaultSource);
    }
    setImageLoading(false);
  }, [authToken, cacheImageUri, callback, defaultSource, requestUri]);

  const resizeImage = useCallback(
    (actualWidth: number, actualHeight: number) => {
      const flattenedStyle = StyleSheet.flatten(style);
      if (Number.isNaN(flattenedStyle?.width) || Number.isNaN(flattenedStyle?.height)) return;
      if (flattenedStyle?.width && !flattenedStyle?.height) {
        setDimensions({ width: flattenedStyle.width, height: actualHeight * (+flattenedStyle.width / actualWidth) });
      } else if (!flattenedStyle?.width && flattenedStyle?.height) {
        setDimensions({ width: actualWidth * (+flattenedStyle.height / actualHeight), height: flattenedStyle.height });
      } else if (flattenedStyle?.width && flattenedStyle?.height) setDimensions({ width: flattenedStyle.width, height: flattenedStyle.height });
    },
    [style],
  );

  useEffect(() => {
    // lock network image cache
    if (requestUri?.startsWith('http')) {
      const componentId = componentIdRef.current;
      if (componentIsMounted.current && componentId && uri) {
        CacheManager.lockCacheFile(cacheImageUri, componentId);
      }
      const init = async () => {
        if (cacheDisabled) await FileSystem.deleteAsync(cacheImageUri, { idempotent: true });
        setSrc({ uri: cacheImageUri });
      };
      init();
      return () => {
        componentIsMounted.current = false;
        CacheManager.unlockCacheFile(cacheImageUri, componentId);
      };
    }

    // local image does not require cache lock
    setSrc(requestUri ? { uri: requestUri } : defaultSource);
  }, [cacheDisabled, cacheImageUri, defaultSource, requestUri, uri]);

  // auto height image
  useEffect(() => {
    if (!isImageLoading) {
      if (_source?.uri && isCacheHit) {
        Image.getSize(
          _source.uri,
          (w, h) => {
            setImageReady(true); // if sizes are available, image is ready
            resizeImage(w, h);
          },
          () => {
            // if error on load, try fetching from network
            setImageReady(false);
            setCacheHit(false);
            loadImage();
          },
        );
      } else if (_source && _source.uri === undefined) {
        setImageReady(true); // local images are always ready

        const localSrc = Image.resolveAssetSource(_source);
        resizeImage(localSrc.width, localSrc.height);
      }
    }
  }, [_source, isCacheHit, isImageLoading, loadImage, resizeImage]);

  if (!isImageReady) return <>{preloadComponent || <View style={[props.style, { backgroundColor: colorScheme === 'dark' ? '#333' : '#DDDBDD' }]} />}</>;

  return zoomEnabled ? (
    <ReactNativeZoomableView
      movementSensibility={3}
      pinchToZoomInSensitivity={1}
      maxZoom={30}
      minZoom={1}
      visualTouchFeedbackEnabled={false}
      disablePanOnInitialZoom
    >
      <Image {...rest} source={_source} style={[style, dimensions]} />
    </ReactNativeZoomableView>
  ) : (
    <Image {...rest} source={_source} style={[style, dimensions]} />
  );
}

export default MyImage;
