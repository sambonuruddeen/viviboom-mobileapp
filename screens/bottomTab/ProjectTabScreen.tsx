import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

import Colors from 'rn-viviboom/constants/Colors';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';

import { RootTabScreenProps } from '../../navigation/types';
import SearchHeader from './SearchHeader';
import HomeBanner from './projects/HomeBanner';
import ProjectList, { ProjectListRefreshHandle } from './projects/ProjectList';

const screen = Dimensions.get('screen');

const routes = [
  { key: 'New', title: 'New' },
  { key: 'Home', title: 'Home' },
  { key: 'WIP', title: 'WIP' },
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

export default function ProjectTabScreen({ navigation, route }: RootTabScreenProps<'ProjectListTabScreen'>) {
  const colorScheme = useColorScheme();
  const isFocused = useIsFocused();

  const [tab, setTab] = useState(1); // tab index

  // search header hide anim
  const hideAnim = useSharedValue(1);

  const refreshRef = useRef<ProjectListRefreshHandle>();

  const onScrollDown = () => {
    hideAnim.value = withTiming(0, { duration: 200 });
  };

  const onScrollUp = () => {
    hideAnim.value = withTiming(1, { duration: 200 });
  };

  const defaultRouteProps = {
    onScrollUp,
    onScrollDown,
  };

  const Scene = ({ route: projectRoute }: SceneProps) => {
    switch (projectRoute.key) {
      // to add more routes. e.g. home page
      case 'New':
        return <ProjectList tabKey={projectRoute.key} isShowing={isFocused && routes[tab].key === projectRoute.key} ref={refreshRef} {...defaultRouteProps} />;
      case 'Home':
        return (
          <ProjectList
            tabKey={projectRoute.key}
            isShowing={isFocused && routes[tab].key === projectRoute.key}
            {...defaultRouteProps}
            ListHeaderComponent={HomeBanner}
          />
        );
      case 'WIP':
        return <ProjectList tabKey={projectRoute.key} isShowing={isFocused && routes[tab].key === projectRoute.key} {...defaultRouteProps} />;
      default:
        return <ProjectList tabKey={projectRoute.key} isShowing={isFocused && routes[tab].key === projectRoute.key} {...defaultRouteProps} />;
    }
  };

  useEffect(() => {
    if (route?.params?.tab !== undefined) {
      setTab(route?.params?.tab ?? 1);
      if (route?.params?.tab === 0) refreshRef.current?.refresh();
    }
  }, [route?.params?.tab]);

  return (
    <View style={styles.container}>
      <SearchHeader navigation={navigation} hideAnim={hideAnim} />
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
}

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
