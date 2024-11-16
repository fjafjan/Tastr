import React, { useState } from "react";
import { SERVER_URL } from "../constants/Constants";
import { useNavigate, useParams } from "react-router-dom";
import {
  SafeAreaView,
  TextInput,
  Button,
  StyleSheet,
  View,
} from "react-native-web";
import { io } from "socket.io-client";
import axios from "axios";
import useValidateCategory from "../hooks/useValidateCategory";

const socket = io(`${SERVER_URL}`); // Replace with your server URL

const LoginPage = () => {
  const { categoryId } = useParams(); // Extract session Id from URL.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Save the name in local storage or cookies as needed
    localStorage.setItem("userId", name);

    // Add the name to the database of users. TODO: Replace userId with an actual ID and not the name.
    await axios.post(`${SERVER_URL}/users/add`, {
      userId: name,
      name: name,
      email: email,
    });

    // Navigate to the Voting page for the category
    navigate(`/${categoryId}/waiting`, { state: { userId: name } });
  };

  useValidateCategory(categoryId);

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
          placeholder={
            "Optionally your email, to be notified of testing results"
          }
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
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    width: "80%",
    alignItems: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    width: "100%",
    paddingHorizontal: 10,
  },
});

export default LoginPage;
