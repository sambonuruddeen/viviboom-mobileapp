import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { AxiosError } from 'axios';
import { DateTime } from 'luxon';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ImageBackground, Platform, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { TextInput } from 'react-native-paper';
import PickerSelect from 'react-native-picker-select';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AccountApi from 'rn-viviboom/apis/viviboom/AccountApi';
import BranchApi from 'rn-viviboom/apis/viviboom/BranchApi';
import backgroundImage from 'rn-viviboom/assets/images/loginBackground.jpg';
import Layout from 'rn-viviboom/constants/Layout';
import MyButton from 'rn-viviboom/hoc/MyButton';
import MyText from 'rn-viviboom/hoc/MyText';
import { RootStackScreenProps } from 'rn-viviboom/navigation/types';

const genderOptions = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Non-Binary', value: 'NON_BINARY' },
  { label: 'No Response', value: 'NO_RESPONSE' },
  { label: 'Other', value: 'OTHER' },
];

const educationLevelOptions = [
  { label: 'Primary 1', value: 'primary 1' },
  { label: 'Primary 2', value: 'primary 2' },
  { label: 'Primary 3', value: 'primary 3' },
  { label: 'Primary 4', value: 'primary 4' },
  { label: 'Primary 5', value: 'primary 5' },
  { label: 'Primary 6', value: 'primary 6' },
  { label: 'Secondary 1', value: 'secondary 1' },
  { label: 'Secondary 2', value: 'secondary 2' },
  { label: 'Secondary 3', value: 'secondary 3' },
  { label: 'Secondary 4', value: 'secondary 4' },
  { label: 'Secondary 5', value: 'secondary 5' },
  { label: 'Grade 1', value: 'grade 1' },
  { label: 'Grade 2', value: 'grade 2' },
  { label: 'Grade 3', value: 'grade 3' },
  { label: 'Grade 4', value: 'grade 4' },
  { label: 'Grade 5', value: 'grade 5' },
  { label: 'Grade 6', value: 'grade 6' },
  { label: 'Grade 7', value: 'grade 7' },
  { label: 'Grade 8', value: 'grade 8' },
  { label: 'Grade 9', value: 'grade 9' },
  { label: 'Grade 10', value: 'grade 10' },
  { label: 'Grade 11', value: 'grade 11' },
  { label: 'Grade 12', value: 'grade 12' },
];

const relationshipOptions = [
  { label: 'Mother', value: 'MOTHER' },
  { label: 'Father', value: 'FATHER' },
  { label: 'Parent', value: 'PARENT' },
  { label: 'Grandparent', value: 'GRANDPARENT' },
  { label: 'Legal Guardian', value: 'LEGAL_GUARDIAN' },
];

export default function SignUpScreen({ navigation }: RootStackScreenProps<'SignUpScreen'>) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [showSecondGuardianFields, setShowSecondGuardianFields] = useState(false);

  const [branchId, setBranchId] = useState<number>();
  const [givenName, setGivenName] = useState<string>('');
  const [familyName, setFamilyName] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [dob, setDob] = useState<Date>(new Date());
  const [school, setSchool] = useState<string>('');
  const [educationLevel, setEducationLevel] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [guardianName, setGuardianName] = useState<string>('');
  const [guardianRelationship, setGuardianRelationship] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [guardianEmail, setGuardianEmail] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');

  const [guardianNameTwo, setGuardianNameTwo] = useState<string>('');
  const [guardianRelationshipTwo, setGuardianRelationshipTwo] = useState<string>('');
  const [guardianEmailTwo, setGuardianEmailTwo] = useState<string>('');
  const [guardianPhoneTwo, setGuardianPhoneTwo] = useState<string>('');

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const clearSecondGuardianFields = () => {
    setGuardianNameTwo('');
    setGuardianRelationshipTwo('');
    setGuardianEmailTwo('');
    setGuardianPhoneTwo('');
  };

  const toggleSecondGuardianButton = () => {
    setShowSecondGuardianFields((show) => {
      if (show) clearSecondGuardianFields();
      return !show;
    });
  };

  const onSubmitPress = useCallback(async () => {
    setIsLoading(true);

    try {
      const requestParams = {
        username,
        password,
        givenName,
        familyName,
        gender,
        dob: DateTime.fromJSDate(dob).toFormat('yyyy-LL-dd'),
        school,
        educationLevel,
        guardianName,
        guardianRelationship,
        guardianEmail,
        guardianPhone,
        address,
        branchId,
        email: undefined,
        phone: undefined,
        guardianNameTwo: undefined,
        guardianRelationshipTwo: undefined,
        guardianPhoneTwo: undefined,
        guardianEmailTwo: undefined,
      };

      if (email) requestParams.email = email;
      if (phone) requestParams.phone = phone;
      if (guardianNameTwo) requestParams.guardianNameTwo = guardianNameTwo;
      if (guardianRelationshipTwo) requestParams.guardianRelationshipTwo = guardianRelationshipTwo.toUpperCase();
      if (guardianPhoneTwo) requestParams.guardianPhoneTwo = guardianPhoneTwo;
      if (guardianEmailTwo) requestParams.guardianEmailTwo = guardianEmailTwo;

      const res = await AccountApi.signUp(requestParams);
      navigation.pop();
      Alert.alert(t('Success'), res.data?.message || 'Your application is pending. You will receive an email once its approved!');
    } catch (err) {
      if (err instanceof AxiosError) {
        Alert.alert(t('Error'), err.response?.data?.message ?? err.message);
      } else if (err instanceof Error) {
        Alert.alert(t('Error'), err.message);
      }
    }
    setIsLoading(false);
  }, [
    username,
    password,
    givenName,
    familyName,
    gender,
    dob,
    school,
    educationLevel,
    guardianName,
    guardianRelationship,
    guardianEmail,
    guardianPhone,
    address,
    branchId,
    email,
    phone,
    guardianNameTwo,
    guardianRelationshipTwo,
    guardianPhoneTwo,
    guardianEmailTwo,
    t,
    navigation,
  ]);

  const fetchBranches = async () => {
    try {
      const res = await BranchApi.getListPublic({ institutinoId: 1 });
      const fetchedBranches = res.data?.branches.map((branch) => ({
        ...branch,
      }));
      setBranches(fetchedBranches);
    } catch (err) {
      console.log(err);
    }
  };

  const onPressDobPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dob,
        onChange: (_, date) => setDob(date),
        mode: 'date',
      });
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: '',
      headerTintColor: '#fff',
      title: '',
    });
  }, [navigation]);

  const pickerStyle = { inputIOSContainer: styles.pickerContainer, inputIOS: styles.pickerText, inputAndroid: styles.pickerAndroid };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
      <ImageBackground source={backgroundImage} style={styles.backgroundImage} />
      <KeyboardAwareScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        <MyText style={styles.particularTitle}>{t("VIVINAUT's Particulars")}</MyText>
        <TextInput mode="outlined" label="Given Name" style={styles.textInput} onChangeText={setGivenName} />
        <TextInput mode="outlined" label="Family Name" style={styles.textInput} onChangeText={setFamilyName} />
        <View style={styles.pickerRow}>
          <MyText style={styles.fieldTitle}>{t('VIVISTOP')}</MyText>
          <PickerSelect
            style={pickerStyle}
            value={branchId}
            useNativeAndroidPickerStyle={false}
            onValueChange={setBranchId}
            items={branches.map((b) => ({ label: b.name, value: b.id }))}
          />
        </View>
        <View style={styles.pickerRow}>
          <MyText style={styles.fieldTitle}>{t('Gender')}</MyText>
          <PickerSelect style={pickerStyle} value={gender} useNativeAndroidPickerStyle={false} onValueChange={setGender} items={genderOptions} />
        </View>
        <TouchableOpacity style={styles.pickerRow} onPress={onPressDobPicker}>
          <MyText style={styles.fieldTitle}>{t('Date of Birth')}</MyText>
          {Platform.OS !== 'android' && <DateTimePicker value={dob} mode="date" onChange={(_, selectedDate) => setDob(selectedDate)} />}
          {Platform.OS === 'android' && <MyText style={styles.dob}>{DateTime.fromJSDate(dob).toLocaleString(DateTime.DATE_MED)}</MyText>}
        </TouchableOpacity>
        <View style={styles.pickerRow}>
          <MyText style={styles.fieldTitle}>{t('Education Level')}</MyText>
          <PickerSelect
            style={pickerStyle}
            value={educationLevel}
            useNativeAndroidPickerStyle={false}
            onValueChange={setEducationLevel}
            items={educationLevelOptions}
          />
        </View>
        <TextInput mode="outlined" label="School" style={styles.textInput} onChangeText={setSchool} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          mode="outlined"
          label="Email (optional)"
          keyboardType="email-address"
          style={styles.textInput}
          onChangeText={setEmail}
        />
        <TextInput autoCapitalize="none" autoCorrect={false} mode="outlined" label="Phone (optional)" style={styles.spacedTextInput} onChangeText={setPhone} />

        <MyText style={styles.particularTitle}>{t("Guardian's Particulars")}</MyText>

        <View style={styles.pickerRow}>
          <MyText style={styles.fieldTitle}>{t('Relationship')}</MyText>
          <PickerSelect
            style={pickerStyle}
            value={guardianRelationship}
            useNativeAndroidPickerStyle={false}
            onValueChange={setGuardianRelationship}
            items={relationshipOptions}
          />
        </View>
        <TextInput mode="outlined" label="Full Name" style={styles.textInput} onChangeText={setGuardianName} />
        <TextInput mode="outlined" label="Residential Address" style={styles.textInput} onChangeText={setAddress} />
        <TextInput
          autoCapitalize="none"
          mode="outlined"
          autoCorrect={false}
          label="Email"
          keyboardType="email-address"
          style={styles.textInput}
          onChangeText={setGuardianEmail}
        />
        <TextInput autoCapitalize="none" mode="outlined" autoCorrect={false} label="Phone" style={styles.spacedTextInput} onChangeText={setGuardianPhone} />

        {showSecondGuardianFields && (
          <>
            <MyText style={styles.particularTitle}>{t("Second Guardian's Particulars")}</MyText>

            <View style={styles.pickerRow}>
              <MyText style={styles.fieldTitle}>{t('Relationship')}</MyText>
              <PickerSelect
                style={pickerStyle}
                value={guardianRelationshipTwo}
                useNativeAndroidPickerStyle={false}
                onValueChange={setGuardianRelationshipTwo}
                items={relationshipOptions}
              />
            </View>
            <TextInput autoCorrect={false} mode="outlined" label="Full Name" style={styles.textInput} onChangeText={setGuardianNameTwo} />
            <TextInput
              autoCapitalize="none"
              mode="outlined"
              label="Email"
              keyboardType="email-address"
              style={styles.textInput}
              onChangeText={setGuardianEmailTwo}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              mode="outlined"
              label="Phone"
              style={styles.spacedTextInput}
              onChangeText={setGuardianPhoneTwo}
            />
          </>
        )}

        <MyButton loading={isLoading} mode="contained" onPress={toggleSecondGuardianButton} style={styles.signUpBtn}>
          {t(showSecondGuardianFields ? 'Remove Second Guardian' : 'Add Second Guardian')}
        </MyButton>

        <MyText style={styles.particularTitle}>{t('VIVIBOOM Account')}</MyText>
        <TextInput autoCapitalize="none" autoCorrect={false} mode="outlined" label="Username" style={styles.textInput} onChangeText={setUsername} />
        <TextInput
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          mode="outlined"
          label="Password"
          style={styles.spacedTextInput}
          onChangeText={setPassword}
        />

        <MyButton loading={isLoading} mode="contained" onPress={onSubmitPress} style={styles.signUpBtn}>
          {t('Submit')}
        </MyButton>

        <View style={{ height: 48 }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  backgroundImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
  },
  logoText: {
    color: '#fff',
    fontSize: 73,
    fontWeight: '900',
  },
  underLogoCaptionText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  whatIsVivitaText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  formContainer: {
    width: Layout.screen.width - 2 * 18,
    padding: 32,
    marginVertical: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  particularTitle: {
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  containerTitleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  textInput: { width: '100%', height: 40, marginBottom: 4 },
  spacedTextInput: { width: '100%', height: 40, marginBottom: 24 },
  fieldTitle: {
    color: '#000',
    fontSize: 16,
  },
  pickerContainer: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  pickerText: {
    fontSize: 16,
    color: '#000',
  },
  pickerAndroid: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#eee',
    fontSize: 16,
    color: '#000',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 40,
    borderRadius: 4,
    paddingHorizontal: 12,
    marginVertical: 8,
    paddingVertical: 2,
  },
  dob: {
    backgroundColor: '#eee',
    color: '#000',
    borderRadius: 8,
    fontWeight: '400',
    paddingHorizontal: 12,
    fontSize: 16,
    height: '100%',
    textAlignVertical: 'center',
  },
  troubleLoggingInText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 18,
  },
  signUpBtn: {
    marginBottom: 24,
    borderRadius: 40,
  },
  tosText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 18,
  },
  privacyPolicyText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 12,
  },
});
