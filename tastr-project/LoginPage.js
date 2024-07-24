import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SafeAreaView, TextInput, Button, StyleSheet, View } from 'react-native-web';

const LoginPage = () => {
  const { sessionId } = useParams(); // Extract session Id from URL.
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Save the name in local storage or cookies as needed
    localStorage.setItem('userId', name);

    // Navigate to the Voting page with sessionId
    navigate(`/${sessionId}/voting`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Who are you who dares opine on ${sessionId}`}
          value={name}
          onChangeText={setName}
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
