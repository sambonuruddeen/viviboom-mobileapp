import { Platform, StatusBar, View } from 'react-native';
import Tooltip from 'react-native-walkthrough-tooltip';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import MyText from './MyText';

function MyTooltip({ children, text, ...attr }) {
  const colorScheme = useColorScheme();

  return (
    <Tooltip
      content={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MyText style={{ margin: 8, fontSize: 20, fontWeight: '700', color: Colors[colorScheme].textInverse }}>{text}</MyText>
        </View>
      }
      backgroundColor="rgba(0,0,0,0.3)"
      topAdjustment={Platform.OS === 'android' ? -StatusBar.currentHeight : 0}
      contentStyle={{ borderRadius: 12, backgroundColor: Colors[colorScheme].tint }}
      childContentSpacing={12}
      disableShadow
      {...attr}
    >
      {children}
    </Tooltip>
  );
}

export default MyTooltip;
