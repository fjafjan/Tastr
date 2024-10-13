import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import ResultsPage from "./ResultsPage";
import { SERVER_URL } from "./constants/Constants";
import { Button } from "react-native-web";

const VotePage = () => {
  const { categoryId } = useParams();
  const [foodAliases, setFoodAliases] = useState({});
  const [hostId, setHostId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const userId = useMemo(() => localStorage.getItem("userId"), []);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [round, setRound] = useState(0);

  // Fetch options for the current round
  const fetchOptions = useCallback(
    async (currentRound) => {
      try {
        const optionsResponse = await axios.get(
          `${SERVER_URL}/${categoryId}/selection/${currentRound}/${userId}`
        );
        setSelectedFoods([
          optionsResponse.data.foodIdA,
          optionsResponse.data.foodIdB,
        ]);
      } catch (error) {
        Alert.alert("Error", "Failed to load food options.");
        console.error("Error fetching options", error);
      }
    },
    [categoryId, userId] // Remove `round` from dependencies to prevent conflicts
  );

  const getSession = async () => {
    try {
      const sessionEntryResponse = await axios.get(
        `${SERVER_URL}/${categoryId}/session/${userId}/get`
      );
      return sessionEntryResponse.data;
    } catch (error) {
      console.error("Failed to get active session ID", error);
    }
  };

  const addUserToSession = async () => {
    const sessionEntry = await getSession();
    if (sessionEntry === undefined) {
      console.error("Failed to get add user to session");
      return;
    }
    setSessionId(sessionEntry.sessionId);
    setHostId(sessionEntry.hostId);
    console.log("Got session ID ", sessionId);
    try {
      if (!sessionEntry.tasterIds.includes(userId)) {
        await axios.post(`${SERVER_URL}/${categoryId}/session/add`, {
          sessionId,
          tasterId: userId,
        });
      }
    } catch (error) {
      console.error(
        `Failed to add user ${userId} to sessionId ${sessionId}`,
        error
      );
    }
  };
  useEffect(() => {
    const setupSession = async () => {
      await addUserToSession();
    };
    setupSession();
  }, [categoryId, hostId, sessionId]);

  useEffect(() => {
    const fetchAliases = async () => {
      try {
        const aliasResponse = await axios.get(
          `${SERVER_URL}/${categoryId}/aliases`
        );
        setFoodAliases(aliasResponse.data);
      } catch (error) {
        Alert.alert("Error", "Failed to load food aliases.");
        console.error("Error fetching aliases", error);
      }
    };

    fetchAliases();
    fetchOptions(round); // Use the round state explicitly here
  }, [categoryId, userId, fetchOptions]);

  // Memoize socket connection
  const socket = useMemo(() => io(`${SERVER_URL}`), [categoryId]);

  useEffect(() => {
    const handleRoundReady = async (data) => {
      console.log("Round ready event received: ", data.round);
      setRound(data.round);
      await fetchOptions(data.round); // Fetch options for the new round
      setWaiting(false);
    };

    socket.on("round ready", handleRoundReady);

    return () => {
      socket.off("round ready", handleRoundReady);
      socket.disconnect(); // Ensure socket disconnects on component unmount
    };
  }, [socket, fetchOptions]); // Do not include `round` here as it's updated inside the effect

  const handleSelect = useCallback(
    async (foodIdA, foodIdB) => {
      if (!userId) {
        console.error("No user ID found");
        return;
      }
      try {
        setWaiting(true);
        await axios.post(
          `${SERVER_URL}/${categoryId}/vote/${foodIdA}/${foodIdB}`,
          {
            userId,
          }
        );
        await axios.post(`${SERVER_URL}/${categoryId}/waiting/remove`, {
          userId,
        });
      } catch (error) {
        Alert.alert(
          "Error",
          "Something went wrong while submitting your vote."
        );
        console.error("Error submitting vote", error);
      }
    },
    [categoryId, userId]
  );

  const handleGoNextRound = async () => {
    try {
      await axios.post(`${SERVER_URL}/${categoryId}/session/nextRound`, {
        sessionId,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "Something went wrong while trying to start next round."
      );
      console.error("Error starting next round of voting", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Which do you prefer</Text>
      <View style={styles.resultContainer}>
        {!waiting &&
          selectedFoods.map((foodId, index) => (
            <TouchableOpacity
              key={index}
              style={styles.selectButton}
              onPress={() => handleSelect(foodId, selectedFoods[1 - index])}
            >
              <Text style={styles.buttonText}>{foodAliases[foodId]}</Text>
            </TouchableOpacity>
          ))}
      </View>

      <View>
        <ResultsPage />
      </View>

      <View>
        {hostId === userId && (
          <Button title="Go to next round" onPress={handleGoNextRound} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  resultContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  selectButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginVertical: 20,
    marginHorizontal: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 24,
    color: "white",
  },
});

export default VotePage;
