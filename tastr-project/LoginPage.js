import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SafeAreaView, TextInput, Button, StyleSheet, View } from 'react-native-web';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Replace with your server URL

const LoginPage = () => {
  const { categoryId } = useParams(); // Extract session Id from URL.
  const location = useLocation()
  const [name, setName] = useState('');
  const [email, setEmail] = useState('')
  const navigate = useNavigate();

  const wasCreated = location.state?.creator

  const handleLogin = () => {
    // Save the name in local storage or cookies as needed
    localStorage.setItem('userId', name);

    // Navigate to the Voting page for the category
    navigate(`/${categoryId}/waiting`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Who are you who dares opine on ${categoryId}`}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder={'Optionally your email, to be notified of testing results'}
          values={email}
          onChangeText={setEmail}
        />
        <Button title="Continue" onPress={handleLogin} />
      </View>
    </SafeAreaView>
  );
};

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
});

export default LoginPage;
