import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import MyText from './MyText';

type OverlayLoaderProps = {
  // ...
  show: boolean;
  text?: string;
  hideAll?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
};

export default function OverlayLoader({ show, text, hideAll, animationType }: OverlayLoaderProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount((a) => (a + 1) % 5);
    }, 500);
    return () => clearInterval(id);
  }, []);

  return (
    <Modal visible={show} hardwareAccelerated animationType={animationType || 'none'} transparent>
      <View style={!hideAll ? styles.container : styles.hide}>
        {!hideAll && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#fff" style={{ margin: 12 }} />
            <MyText style={{ color: '#fff', fontSize: 18, minWidth: 80 }}>
              {text || 'Loading'}
              {Array(count).join('.')}
            </MyText>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hide: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderContainer: {
    height: 120,
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
});
