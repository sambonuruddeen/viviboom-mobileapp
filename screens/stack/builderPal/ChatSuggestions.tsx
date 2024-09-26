import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';

import BuilderPalApi from 'rn-viviboom/apis/viviboom/BuilderPalApi';
import Colors from 'rn-viviboom/constants/Colors';
import Layout from 'rn-viviboom/constants/Layout';
import { BuilderPalChatType } from 'rn-viviboom/enums/BuilderPalChatType';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { BuilderPalStackParamList } from 'rn-viviboom/navigation/types';

interface ChatSuggestionsProps {
  chatId: number;
  hasStartChat: boolean;
  sendMessage: (content: string, type?: string) => Promise<void>;
}

export default function ChatSuggestions({ chatId, hasStartChat, sendMessage }: ChatSuggestionsProps) {
  const { t } = useTranslation('translation');
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<BuilderPalStackParamList, 'BuilderPalChatScreen'>>();
  const user = useReduxStateSelector((state) => state.account);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [shouldRecommendProjects, setShouldRecommendProjects] = useState(false);

  const [suggestionLoading, setSuggestionLoading] = useState(false);

  const bounceAnimation = useRef(new Animated.Value(0)).current;

  const bounceAnim = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const getSuggestions = useCallback(async () => {
    if (!user.authToken || !chatId) return;
    setSuggestionLoading(true);
    try {
      const res = await BuilderPalApi.getSuggestions({ authToken: user.authToken, chatId });
      setSuggestions(res.data.suggestions);
      if (res.data.shouldRecommendProjects !== undefined && hasStartChat) setShouldRecommendProjects(res.data.shouldRecommendProjects);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      Toast.show({ text1: err.response?.data?.message || err.message, type: 'error' });
    }
    setSuggestionLoading(false);
  }, [chatId, hasStartChat, user.authToken]);

  const onClickSuggestion = async (suggestion: string) => {
    await sendMessage(suggestion, BuilderPalChatType.DISCOVERY);
  };

  useEffect(() => {
    getSuggestions();
  }, [getSuggestions]);

  useEffect(() => {
    bounceAnim();
  }, []);

  return (
    <View style={styles.suggestions}>
      {suggestionLoading && (
        <Animated.View style={[styles.suggestionLoading, { opacity: bounceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }]}>
          <ActivityIndicator size={16} />
          <MyText style={styles.suggestionLoadingText}>{t('Thinking and suggesting...')}</MyText>
        </Animated.View>
      )}
      {!suggestionLoading &&
        !shouldRecommendProjects &&
        suggestions.slice(0, Layout.screen.width > 600 ? 3 : 2).map((v) => (
          <TouchableOpacity
            key={`suggestion-${v}`}
            style={{ ...styles.suggestion, borderColor: Colors[colorScheme].tint }}
            onPress={() => onClickSuggestion(v)}
            activeOpacity={0.8}
          >
            <MyText style={{ ...styles.suggestionText, color: Colors[colorScheme].tint }}>{v}</MyText>
          </TouchableOpacity>
        ))}
      {!suggestionLoading && shouldRecommendProjects && (
        <>
          <TouchableOpacity
            style={{ ...styles.suggestion, borderColor: Colors[colorScheme].tint }}
            onPress={() => navigation.navigate('BuilderPalChallengeListScreen', { chatId })}
            activeOpacity={0.8}
          >
            <MyText style={{ ...styles.suggestionText, color: Colors[colorScheme].tint }}>{t('Reveal related Viviboom Challenges!')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ ...styles.suggestion, borderColor: Colors[colorScheme].tint }}
            onPress={() => navigation.navigate('BuilderPalRelatedProjectListScreen', { chatId })}
            activeOpacity={0.8}
          >
            <MyText style={{ ...styles.suggestionText, color: Colors[colorScheme].tint }}>{t('Hit me with related Viviboom Projects!')}</MyText>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ ...styles.suggestion, borderColor: Colors[colorScheme].tint }}
            onPress={() => navigation.navigate('BuilderPalProjectListScreen', { chatId })}
            activeOpacity={0.8}
          >
            <MyText style={{ ...styles.suggestionText, color: Colors[colorScheme].tint }}>{t('Dream up some projects for me!')}</MyText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  suggestions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    flexWrap: 'wrap',
  },
  suggestionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionLoadingText: {
    fontSize: 15,
    marginLeft: 12,
    fontWeight: '400',
  },
  suggestion: {
    marginRight: 12,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {
    fontWeight: '400',
    fontSize: 14,
  },
});
