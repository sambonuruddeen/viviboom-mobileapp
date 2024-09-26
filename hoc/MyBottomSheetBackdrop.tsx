import { BottomSheetBackdrop, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { memo } from 'react';
import { Keyboard, Pressable } from 'react-native';

const MyBottomSheetBackdrop: React.FC<BottomSheetBackdropProps> = (props) => (
  <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1}>
    <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }} />
  </BottomSheetBackdrop>
);

export default memo(MyBottomSheetBackdrop);
