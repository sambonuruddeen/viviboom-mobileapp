import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import ProjectApi from 'rn-viviboom/apis/viviboom/ProjectApi';
import Colors from 'rn-viviboom/constants/Colors';
import { ProjectOrderType } from 'rn-viviboom/enums/ProjectOrderType';
import MyText from 'rn-viviboom/hoc/MyText';
import ProjectGridItem from 'rn-viviboom/hoc/ProjectGridItem';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';

const screen = Dimensions.get('screen');
const DEFAULT_PROJECT_REQUEST_COUNT = 8;

export default function RecommendedProjects() {
  const { t } = useTranslation('translation', { keyPrefix: 'projects' });
  const colorScheme = useColorScheme();
  const user = useReduxStateSelector((state) => state.account);

  // recommended projects
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [isEndOfProjects, setIsEndOfProjects] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(
    async (hardRefresh = false) => {
      if (isFetchingProjects) return;
      if (!hardRefresh && isEndOfProjects) return;
      setIsFetchingProjects(true);

      const requestParams = {
        authToken: user?.authToken,
        limit: hardRefresh ? 4 : DEFAULT_PROJECT_REQUEST_COUNT,
        offset: projects.length,
        order: ProjectOrderType.RANDOM,
        verboseAttributes: ['badges'],
      };

      try {
        const res = await ProjectApi.getList(requestParams);
        if (hardRefresh) {
          setProjects(res.data.projects);
        } else {
          setProjects([...projects, ...res.data.projects]);
        }

        // check if end of list
        if (res.data.projects.length < (hardRefresh ? 4 : DEFAULT_PROJECT_REQUEST_COUNT)) {
          setIsEndOfProjects(true);
        }
      } catch (err) {
        console.error(err);
      }
      setIsFetchingProjects(false);
    },
    [isFetchingProjects, isEndOfProjects, user?.authToken, projects],
  );

  useEffect(() => {
    fetchProjects(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <MyText style={styles.moreTitle}>More Projects</MyText>
      <View style={styles.moreProjectGrid}>
        {projects.map((p) => (
          <ProjectGridItem
            key={`recommended-project_${p.id}`}
            id={p.id}
            preloadedData={p}
            showProfile
            style={{ width: (screen.width - 3 * 18) / 2, marginTop: 18 }}
            isProjectScreen
          />
        ))}
      </View>
      {projects?.length < 4 + DEFAULT_PROJECT_REQUEST_COUNT && !isFetchingProjects && (
        <TouchableOpacity
          style={[styles.showMoreButton, { borderColor: Colors[colorScheme].tint }]}
          onPress={() => fetchProjects(false)}
          disabled={isFetchingProjects}
        >
          <MyText style={{ fontWeight: '400' }}>{t('Show More')}</MyText>
        </TouchableOpacity>
      )}
      {isFetchingProjects && <ActivityIndicator style={{ margin: 24 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 18,
    flex: 1,
  },
  moreTitle: {
    fontSize: 16,
    marginTop: 18,
  },
  moreProjectGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  noItemFoundText: {
    textAlign: 'center',
    margin: 20,
  },
  showMoreButton: {
    width: '100%',
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
});
