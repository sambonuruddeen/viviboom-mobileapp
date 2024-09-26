import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { Checkbox, RadioButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BookingApi from 'rn-viviboom/apis/viviboom/BookingApi';
import EventApi from 'rn-viviboom/apis/viviboom/EventApi';
import Colors from 'rn-viviboom/constants/Colors';
import { EventQuestionDestinationType } from 'rn-viviboom/enums/EventQuestionDestinationType';
import { EventQuestionType } from 'rn-viviboom/enums/EventQuestionType';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import useColorScheme from 'rn-viviboom/hooks/useColorScheme';
import { useReduxStateSelector } from 'rn-viviboom/hooks/useReduxStateSelector';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const footerHeight = 60;

const EventQuestionScreen = ({ navigation, route }: RootStackScreenProps<'EventQuestionScreen'>) => {
  const { t } = useTranslation('translation', { keyPrefix: '' });
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const account = useReduxStateSelector((s) => s.account);

  const event = useMemo(() => route.params.event, [route.params.event]);
  const bookingQuestions = useMemo(() => event?.eventQuestions?.filter((q) => q.destination === EventQuestionDestinationType.BOOKING), [event?.eventQuestions]);

  const [isLoading, setLoading] = useState(false);

  const [input, setInput] = useState({});

  useEffect(() => {
    navigation.setOptions({
      title: '',
      headerTintColor: Colors[colorScheme].text,
      headerStyle: { backgroundColor: Colors[colorScheme].secondaryBackground },
      headerBackTitle: '',
    });
  }, [colorScheme, navigation, route.params?.event?.title, t]);

  // multiple response questions are special case. An array attribute is added for input element to track whether the boxes are checked.
  // a value atribute is added for input elememt to track what are the responses to submit.
  const handleMultiResponse = (eventQuestionId: number, option: EventQuestionAnswerOption) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const multiQuestionResponses = [...(input[eventQuestionId] || [])];

    // find the index of the changed option if exists
    const modifiedIdx = multiQuestionResponses.findIndex((r) => r === option.answer);

    // if exists and unchecked, delete, if does not exists and checked, insert
    if (modifiedIdx >= 0) {
      multiQuestionResponses.splice(modifiedIdx, 1);
    } else {
      multiQuestionResponses.push(option.answer);
    }

    setInput({ ...input, [eventQuestionId]: multiQuestionResponses });
  };

  const handleRegister = async () => {
    const responses = [];

    bookingQuestions.forEach((q) => {
      if (input[q.id]) {
        if (q.type === EventQuestionType.MULTIPLE) responses.push(...input[q.id].map((response) => ({ eventQuestionId: q.id, response })));
        else responses.push({ eventQuestionId: q.id, response: input[q.id] });
      }
    });

    // register
    setLoading(true);
    try {
      const res = await BookingApi.post({ authToken: account?.authToken, userId: account?.id, eventId: event?.id });

      if (responses.length > 0) {
        await EventApi.postResponse({
          authToken: account?.authToken,
          eventId: event?.id,
          bookingId: res.data?.booking?.id,
          responses,
        });
      }

      navigation.replace('BookingSuccessScreen', { event, booking: res.data?.booking });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const flatListRenderItem = ({ item, index }: { item: EventQuestion; index: number }) => {
    switch (item.type) {
      case EventQuestionType.SINGLE:
        return (
          <View style={styles.questionContainer}>
            <MyText style={styles.questionNumber}>Question {index + 1}</MyText>
            <MyText style={styles.questionTitle}>{item.question}</MyText>
            <View style={styles.options}>
              {item.answerOptions.map((option) => (
                <TouchableOpacity
                  key={`question_${item.id}_option_${option.id}`}
                  style={styles.option}
                  onPress={() => setInput({ ...input, [item.id]: option.answer })}
                  activeOpacity={1}
                >
                  <RadioButton.Android
                    status={input[item.id] === option.answer ? 'checked' : 'unchecked'}
                    uncheckedColor={Colors[colorScheme].textSecondary}
                    color={Colors[colorScheme].tint}
                    value=""
                    onPress={() => setInput({ ...input, [item.id]: option.answer })}
                  />
                  <MyText style={styles.optionText}>{option.answer}</MyText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case EventQuestionType.MULTIPLE:
        return (
          <View style={styles.questionContainer}>
            <MyText style={styles.questionNumber}>Question {index + 1}</MyText>
            <MyText style={styles.questionTitle}>{item.question}</MyText>
            <View style={styles.options}>
              {item.answerOptions.map((option) => (
                <TouchableOpacity
                  key={`question_${item.id}_option_${option.id}`}
                  style={styles.option}
                  onPress={() => handleMultiResponse(item.id, option)}
                  activeOpacity={1}
                >
                  <Checkbox.Android
                    status={input[item.id]?.includes(option.answer) ? 'checked' : 'unchecked'}
                    uncheckedColor={Colors[colorScheme].textSecondary}
                    color={Colors[colorScheme].tint}
                  />
                  <MyText style={styles.optionText}>{option.answer}</MyText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case EventQuestionType.TEXT:
        return (
          <View style={styles.questionContainer}>
            <MyText style={styles.questionNumber}>Question {index + 1}</MyText>
            <MyText style={styles.questionTitle}>{item.question}</MyText>
            <TextInput
              multiline
              style={styles.textInput}
              onChangeText={(text) => setInput({ ...input, [item.id]: text })}
              value={input[item.id] || ''}
              placeholder={t('Enter your answer here...')}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <KeyboardAwareFlatList
        ListHeaderComponent={<MyText style={styles.title}>{t('Please answer the following question(s) before registering the event:')}</MyText>}
        data={bookingQuestions}
        renderItem={flatListRenderItem}
        keyExtractor={(item) => `question_${item.id}`}
        contentContainerStyle={[styles.container, { paddingBottom: footerHeight + insets.bottom }]}
      />
      <View
        style={{
          ...styles.footerContainer,
          backgroundColor: Colors[colorScheme].secondaryBackground,
          paddingBottom: insets.bottom,
          height: styles.footerContainer.height + insets.bottom,
        }}
      >
        <MyButton mode="contained" labelStyle={{ marginVertical: 0, width: 120 }} style={{ justifyContent: 'center', height: 36 }} onPress={handleRegister}>
          {isLoading ? `${t('Loading')}...` : t('Register')}
        </MyButton>
      </View>
    </>
  );
};

export default EventQuestionScreen;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingBottom: footerHeight + 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '400',
    marginVertical: 12,
  },
  questionContainer: {
    paddingVertical: 12,
  },
  questionNumber: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 12,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 30,
  },
  options: {
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    paddingTop: 10,
    minHeight: 48,
    paddingRight: 12,
  },
  textInput: {
    borderRadius: 4,
    padding: 12,
    marginVertical: 6,
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 0.5,
    borderColor: '#666',
  },
  footerContainer: {
    height: footerHeight,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(160, 160, 160, 0.2)',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
});
