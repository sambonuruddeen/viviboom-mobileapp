import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from 'rn-viviboom/constants/Colors';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

interface CreateProjectHeaderProps {
  onBackPressed: () => void;
  onPublishPressed: () => void;
  isProjectSaving: boolean;
}

export default function CreateProjectHeader({ onBackPressed, onPublishPressed, isProjectSaving }: CreateProjectHeaderProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        ...styles.container,
        paddingTop: insets.top,
        height: styles.container.height + insets.top,
      }}
    >
      <View style={styles.backButton}>
        <TouchableOpacity onPress={onBackPressed}>
          <Ionicons name="ios-chevron-back-outline" size={24} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      </View>
      <MyButton
        onPress={onPublishPressed}
        style={[styles.publishButton, { backgroundColor: Colors[colorScheme].contentBackground }]}
        disabled={isProjectSaving}
        labelStyle={{ marginVertical: 0 }}
      >
        <MyText style={{ ...styles.publishText, color: Colors[colorScheme].tint }}>{t('Post')}</MyText>
      </MyButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 50,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 50,
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButton: {
    height: 36,
    padding: 0,
    margin: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  publishText: {
    fontSize: 14,
  },
});
