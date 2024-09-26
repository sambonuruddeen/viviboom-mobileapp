import { ColorSchemeName, StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

interface MyTextProps extends TextProps {
  viviboomLogo?: boolean;
}

export default function MyText(props: MyTextProps) {
  const colorScheme = useColorScheme();
  const style = handleFontStyle(props, colorScheme);
  return <Text {...props} style={style} />;
}

const handleFontStyle = (props: MyTextProps, colorScheme: ColorSchemeName) => {
  const { viviboomLogo, style } = props;

  let styleFont = { ...styles.titilliumSemiBold, color: Colors[colorScheme].text };
  const textStyle = style as TextStyle;
  if (viviboomLogo) {
    styleFont = { ...styleFont, ...styles.viviboomLogo };
  } else if (textStyle) {
    if (textStyle.fontWeight === '300' || textStyle.fontWeight === '400') {
      styleFont = { ...styleFont, ...styles.titillium };
    } else if (textStyle.fontWeight === '500' || textStyle.fontWeight === '600') {
      styleFont = { ...styleFont, ...styles.titilliumSemiBold };
    } else if (textStyle.fontWeight === '700' || textStyle.fontWeight === 'bold') {
      styleFont = { ...styleFont, ...styles.titilliumBold };
    } else if (textStyle.fontWeight === '800' || textStyle.fontWeight === '900') {
      styleFont = { ...styleFont, ...styles.titilliumBlack };
    }
  }

  const nonNullStyle = typeof style === 'object' ? style : {};
  const finalStyle = { ...styleFont, ...nonNullStyle };

  return finalStyle;
};

const styles = StyleSheet.create({
  titillium: { fontFamily: 'Titillium' },
  titilliumSemiBold: { fontFamily: 'TitilliumSemiBold' },
  titilliumBold: { fontFamily: 'TitilliumBold' },
  titilliumBlack: { fontFamily: 'TitilliumBlack' },
  viviboomLogo: { fontFamily: 'VivitaBold' },
});