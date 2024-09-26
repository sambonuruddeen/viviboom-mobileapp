import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

import Colors from 'rn-viviboom/constants/Colors';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

type MyButtonProps = React.ComponentProps<typeof Button> & {
  // ...
};

export default function MyButton(props: MyButtonProps) {
  const colorScheme = useColorScheme();

  const combinedStyle = [styles.default];
  const labelStyle = [];

  if (props.mode === 'contained') {
    combinedStyle.push({ backgroundColor: Colors[colorScheme].tint });
    labelStyle.push({ color: Colors[colorScheme].textInverse });
  }
  if (props.mode === 'outlined') {
    combinedStyle.push({ borderColor: Colors[colorScheme].tint });
    labelStyle.push({ color: Colors[colorScheme].tint });
  }

  if (props.mode === 'text') {
    labelStyle.push({ color: Colors[colorScheme].tint });
  }

  combinedStyle.push(props.style);
  labelStyle.push(props.labelStyle);

  return <Button {...props} style={combinedStyle} labelStyle={labelStyle} />;
}

const styles = StyleSheet.create({
  default: {
    paddingVertical: 5,
  },
});
