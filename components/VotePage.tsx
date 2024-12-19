import React, { useEffect, useState, useCallback, useMemo } from "react";
import { SafeAreaView, Text, View, Pressable } from "react-native-web";
import { StyleSheet, Alert } from "react-native";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import ResultsPage from "./ResultsPage";
import { SERVER_URL } from "../constants/Constants";
import { Button } from "react-native-web";
import useValidateCategory from "../hooks/useValidateCategory";
import useAddUserToSession from "../hooks/useAddUserToSession";
import ClipLoader from "react-spinners/ClipLoader";

interface FoodAliases {
  [key: string]: string;
}

interface FoodNames {
  [key: string]: string;
}

const VotePage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [foodAliases, setFoodAliases] = useState<FoodAliases>({});
  const [foodNames, setFoodNames] = useState<FoodNames>({});
  const [hostId, setHostId] = useState<string>("");
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string>("");
  const userId = useMemo(() => localStorage.getItem("userId"), []);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [waiting, setWaiting] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);

  if (!userId) {
    navigate(`/${categoryId}`);
  }

  const fetchOptions = useCallback(
    async (currentRound: number): Promise<void> => {
      console.log(`Getting options for round ${currentRound}`);
      try {
        const optionsResponse = await axios.get<{
          foodIdA: string;
          foodIdB: string;
        }>(`${SERVER_URL}/${categoryId}/selection/${currentRound}/${userId}`);
        setSelectedFoods([
          optionsResponse.data.foodIdA,
          optionsResponse.data.foodIdB,
        ]);
      } catch (error) {
        Alert.alert("Error", "Failed to load food options.");
        console.error("Error fetching options", error);
      }
    },
    [categoryId, userId]
  );

  const categoryValid = useValidateCategory({ categoryId: categoryId });
  const userAdded = useAddUserToSession({
    categoryId: categoryId || "",
    userId: userId || "",
    setSessionId: setSessionId,
    setHostId: setHostId,
    precondition: categoryValid,
  });

  const fetchAliases = async (): Promise<void> => {
    try {
      const aliasResponse = await axios.get<FoodAliases>(
        `${SERVER_URL}/${categoryId}/aliases`
      );
      setFoodAliases(aliasResponse.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load food aliases.");
      console.error("Error fetching aliases", error);
    }
  };

  const fetchNames = async (): Promise<void> => {
    try {
      const namesResponse = await axios.get<FoodNames>(
        `${SERVER_URL}/${categoryId}/names`
      );
      setFoodNames(namesResponse.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load food names.");
      console.error("Error fetching names", error);
    }
  };

  useEffect(() => {
    fetchNames();
    fetchAliases();
  }, [categoryId]);

  useEffect(() => {
    fetchOptions(round);
  }, [categoryId, userId, fetchOptions, round]);

  const socket = useMemo<Socket>(() => io(`${SERVER_URL}`), [categoryId]);

  useEffect(() => {
    const handleRoundReady = async (data: {
      sessionId: string;
      round: number;
    }): Promise<void> => {
      if (sessionId !== data.sessionId) {
        console.log("Voting in other session");
        return;
      }
      console.log("Round ready event received: ", data.round);
      setRound(data.round);
      await fetchOptions(data.round);
      setWaiting(false);
    };

    socket.on("round ready", handleRoundReady);

    return () => {
      socket.off("round ready", handleRoundReady);
      socket.disconnect();
    };
  }, [socket, fetchOptions, sessionId]);

  const handleSelect = useCallback(
    async (foodIdA: string, foodIdB: string): Promise<void> => {
      if (!userId) {
        console.error("No user ID found");
        return;
      }
      try {
        setWaiting(true);
        await axios.post(
          `${SERVER_URL}/${categoryId}/vote/${foodIdA}/${foodIdB}`,
          { userId }
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

  const handleGoNextRound = async (): Promise<void> => {
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

  if (!(categoryValid && userAdded)) {
    return <ClipLoader size={50} color="#36D7B7" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Which do you prefer</Text>
      <View style={styles.resultContainer}>
        {!waiting &&
          selectedFoods.map((foodId, index) => (
            <Pressable
              key={index}
              style={styles.selectButton}
              onPress={() => {
                handleSelect(foodId, selectedFoods[1 - index]);
              }}
            >
              <Text style={styles.buttonText}>{foodNames[foodId]}</Text>
            </Pressable>
          ))}
      </View>

      <View>
        <ResultsPage round={round} />
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
