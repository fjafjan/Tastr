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

const VotePage = () => {
  const { categoryId } = useParams();
  const [foodAliases, setFoodAliases] = useState({});
  const userId = useMemo(() => localStorage.getItem("userId"), []);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [waiting, setWaiting] = useState(false);
  const [round, setRound] = useState(0);

  // Define fetchOptions before useEffect hooks
  const fetchOptions = useCallback(async () => {
    try {
      const optionsResponse = await axios.get(
        `${SERVER_URL}/${categoryId}/selection/${round}/${userId}`
      );
      setSelectedFoods([
        optionsResponse.data.foodIdA,
        optionsResponse.data.foodIdB,
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to load food options.");
      console.error("Error fetching options", error);
    }
  }, [categoryId, userId]);

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
    fetchOptions();
  }, [categoryId, userId, fetchOptions, round]);

  // Memoize socket connection
  const socket = useMemo(() => io(`${SERVER_URL}`), [categoryId]);

  useEffect(() => {
    const handleRoundReady = async (data) => {
      setRound(data.round);
      await fetchOptions();
      setWaiting(false);
    };

    socket.on("round ready", handleRoundReady);

    return () => {
      socket.off("round ready", handleRoundReady);
      socket.disconnect();
    };
  }, [socket, fetchOptions, setRound]);

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
