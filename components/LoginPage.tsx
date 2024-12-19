import React, { useState } from "react";
import { SERVER_URL } from "../constants/Constants";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { SafeAreaView, TextInput, Button, View } from "react-native-web";
import { StyleSheet } from "react-native";
import { io } from "socket.io-client";
import axios from "axios";
import useValidateCategory from "../hooks/useValidateCategory";
import ClipLoader from "react-spinners/ClipLoader";

// Replace with your server URL
const socket = io(SERVER_URL);

const LoginPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const userId: string | null =
    (location.state as { userId?: string })?.userId ||
    localStorage.getItem("userId");

  // Redirect if user ID is already known
  if (userId) {
    navigate(`/${categoryId}/waiting`);
  }

  const handleLogin = async (): Promise<void> => {
    // Save the name in local storage
    localStorage.setItem("userId", name);

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
  const validCategory = useValidateCategory(categoryId || "");
  if (!validCategory) {
    return <ClipLoader size={50} color="#36D7B7" />;
  }

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
          placeholder="Optionally your email, to be notified of testing results"
          value={email}
          onChangeText={setEmail}
        />
        <Button title="Continue" onPress={handleLogin} />
      </View>
    </SafeAreaView>
  );
};

// Styles defined as plain objects for compatibility with react-native-web
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
