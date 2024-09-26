import { useState } from 'react';
import { ColorSchemeName, StyleSheet, View } from 'react-native';

import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import BadgeList from './BadgeList';

const BadgeListTabColors: Record<ColorSchemeName, Record<string, string>> = {
  light: {
    background: '#f2f2f2',
    secondaryBackground: '#fff',
  },
  dark: {
    background: '#000',
    secondaryBackground: '#222',
  },
};

export default function MyBadgeListTab() {
  const colorScheme = useColorScheme();
  const [badgeCategory, setBadgeCategory] = useState({ id: -1, name: 'My Badges', description: '' });

  return (
    <View style={styles.container}>
      <View style={[styles.badgeContainer, { backgroundColor: BadgeListTabColors[colorScheme].secondaryBackground }]}>
        <View style={styles.allBadges}>
          <View style={styles.badges}>
            <BadgeList selectedCategory={badgeCategory} isSelected={true} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  badgeContainer: {
    flex: 1,
  },
  allBadges: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
  },
  badges: {
    flex: 2.3,
  },
});
