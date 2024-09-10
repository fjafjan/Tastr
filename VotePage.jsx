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

  useEffect(() => {
    const fetchAliases = async () => {
      try {
        const aliasResponse = await axios.get(
          `${SERVER_URL}/${categoryId}/aliases`
        );
        setFoodAliases(aliasResponse.data);
      } catch (error) {
        console.error("Error fetching aliases", error);
      }
    };

    const fetchOptions = async (round) => {
      try {
        const optionsResponse = await axios.get(
          `${SERVER_URL}/${categoryId}/selection/${round}/${userId}`
        );
        setSelectedFoods([
          optionsResponse.data.foodIdA,
          optionsResponse.data.foodIdB,
        ]);
      } catch (error) {
        console.error("Error fetching options", error);
      }
    };

    fetchAliases();
    fetchOptions(0);
  }, [categoryId, userId]);

  useEffect(() => {
    const socket = io(`${SERVER_URL}`);

    socket.on("round ready", (data) => {
      fetchOptions(data.round);
      setWaiting(false);
    });

    return () => {
      socket.off("round ready");
      socket.disconnect();
    };
  }, [categoryId, userId]);

  const handleSelect = useCallback(
    async (foodIdA, foodIdB) => {
      if (!userId) {
        console.error("No user ID found");
        return;
      }
      try {
        setWaiting(true);
        await Promise.all([
          axios.post(`${SERVER_URL}/${categoryId}/vote/${foodIdA}/${foodIdB}`, {
            userId,
          }),
          axios.post(`${SERVER_URL}/${categoryId}/waiting/remove`, { userId }),
        ]);
      } catch (error) {
        Alert.alert(
          "Error",
          "Something went wrong while submitting your vote."
        );
        console.error("Error submitting vote", error);
      } finally {
        setWaiting(false);
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
