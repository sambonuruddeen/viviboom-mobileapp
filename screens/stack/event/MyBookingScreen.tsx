import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

import MyBookingList from './MyBookingList';

const screen = Dimensions.get('screen');

const routes = [
  { key: 'Upcoming', title: 'Upcoming' },
  { key: 'Past', title: 'Past Bookings' },
];

type SceneProps = SceneRendererProps & {
  route: {
    key: string;
    title: string;
  };
};

const tabWidth = screen.width / routes.length;

const MyTabBar = (props) => {
  const colorScheme = useColorScheme();
  return (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: Colors[colorScheme].tint, width: 50, left: (tabWidth - 50) / 2 }}
      style={{ backgroundColor: Colors[colorScheme].background, height: 44 }}
      renderLabel={({ route, focused }) => (
        <MyText style={{ color: focused ? Colors[colorScheme].text : Colors[colorScheme].textInactive, fontWeight: '500' }}>{route.title}</MyText>
      )}
    />
  );
};

const MyBookingScreen = ({ navigation }: RootStackScreenProps<'MyBookingScreen'>) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();

  const [tab, setTab] = useState(0); // tab index

  const Scene = ({ route }: SceneProps) => {
    switch (route.key) {
      // to add more routes. e.g. home page
      default:
        return <MyBookingList type={route.key} />;
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: t('My Bookings'),
      headerTintColor: Colors[colorScheme].text,
      headerStyle: { backgroundColor: Colors[colorScheme].secondaryBackground },
      headerShadowVisible: false,
      headerBackTitle: '',
    });
  }, [colorScheme, navigation, t]);

  return (
    <View style={styles.container}>
      <View style={[styles.tabViewContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <TabView
          navigationState={{ index: tab, routes }}
          onIndexChange={setTab}
          renderScene={Scene}
          renderTabBar={MyTabBar}
          initialLayout={{ width: screen.width, height: 0 }}
          lazy
        />
      </View>
    </View>
  );
};

export default MyBookingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabViewContainer: {
    flex: 1,
    width: '100%',
  },
});
