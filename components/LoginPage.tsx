import axios from 'axios';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView, Text, TextInput, View } from 'react-native-web';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader';
import { SERVER_URL } from '../constants/Constants';
import useValidateCategory from '../hooks/useValidateCategory';

const LoginPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  const userId: string | null =
    (location.state as { userId?: string })?.userId ||
    localStorage.getItem('userId');

  // Redirect if user ID is already known
  if (userId) {
    navigate(`/${categoryId}/waiting`);
  }

  const handleLogin = async (): Promise<void> => {
    // Save the name in local storage
    localStorage.setItem('userId', name);

    // Add the user to the database
    await axios.post(`${SERVER_URL}/users/add`, {
      userId: name,
      name: name,
      email: email,
    });

    // Navigate to the waiting page for the category
    navigate(`/${categoryId}/waiting`, { state: { userId: name } });
  };

  // Check the validity of the category, show a spinner while loading
  const validCategory = useValidateCategory({ categoryId: categoryId || '' });
  if (!validCategory) {
    return <ClipLoader size={50} color="#36D7B7" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          id="user-name-input"
          style={styles.input}
          placeholder={`Who are you who dares opine on ${categoryId}`}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          id="user-email-input"
          style={styles.input}
          placeholder="Optionally your email, to be notified of testing results"
          value={email}
          onChangeText={setEmail}
        />
        <Pressable
          id="login-button"
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.buttonText}> Continue </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

// Styles defined as plain objects for compatibility with react-native-web
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '80%',
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonPressed: {
    backgroundColor: '#0056b3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default LoginPage;
