import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MyText from 'rn-viviboom/hoc/MyText';

interface AddProjectMediaHeaderProps {
  onBackPressed: () => void;
  onChangeHeaderTab: (key: string) => void;
  headerTabKey: string;
}

export default function AddProjectMediaHeader({ onBackPressed, onChangeHeaderTab, headerTabKey }: AddProjectMediaHeaderProps) {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const insets = useSafeAreaInsets();

  return (
    <View style={{ ...styles.container, paddingTop: insets.top, height: styles.container.height + insets.top }}>
      <View style={styles.headerTabs}>
        <TouchableOpacity style={styles.headerTabButton} onPress={() => onChangeHeaderTab('New')}>
          <MyText style={headerTabKey === 'New' ? styles.headerTabTextActive : styles.headerTabText}>New</MyText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerTabButton} onPress={() => onChangeHeaderTab('Draft')}>
          <MyText style={headerTabKey === 'Draft' ? styles.headerTabTextActive : styles.headerTabText}>Drafts</MyText>
        </TouchableOpacity>
      </View>
      <View style={styles.backButton}>
        <TouchableOpacity onPress={onBackPressed}>
          <Ionicons name="ios-close-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
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
  nextButton: {
    height: '80%',
    padding: 0,
    margin: 12,
    borderRadius: 12,
    width: 70,
  },
  nextText: {
    fontSize: 14,
  },
  headerTabs: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  headerTabButton: {
    marginHorizontal: 20,
  },
  headerTabText: {
    color: '#aaa',
    fontSize: 18,
    fontWeight: '400',
  },
  headerTabTextActive: {
    color: '#fff',
    fontSize: 18,
  },
});
