import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Button, Alert, TouchableOpacity } from 'react-native';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import 'chart.js/auto';
import { io } from 'socket.io-client';
import ResultsPage from './ResultsPage';
import { SERVER_URL } from './constants/Constants';

// Connect websocket.

const socket = io(`${SERVER_URL}`); // Replace with your server URL

const VotePage = () => {
  const { categoryId: categoryId } = useParams(); // Extract category Id from URL.
  const [foodAliases, setFoodAliases] = useState({})
  const userId = localStorage.getItem("userId")
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [waiting, setWaiting] = useState(false)

  const fetchAliases = async () => {
    try {
      const aliasResponse = await axios.get(`${SERVER_URL}/${categoryId}/aliases`)
      const aliases = aliasResponse.data
      setFoodAliases(aliases)
    } catch (error) {
      console.error('Error fetching aliases', error);
    }
  };

  const fetchOptions = async (round, user) => {
    try {
      const optionsResponse = await axios.get(`${SERVER_URL}/${categoryId}/selection/${round}/${user}`);
      const options = optionsResponse.data
      let newFoods = [ options.foodIdA, options.foodIdB ]
      setSelectedFoods(newFoods);
    } catch(error) {
      console.error("Error fetching options", error)
    }
  }

  useEffect(() => {
    fetchAliases();
    fetchOptions(0, userId);
  }, [categoryId, userId]);

  // Configure websocket behavior
  useEffect(() => {
    socket.on('round ready', (data) => {
      console.log(`Round ${data.round} is ready`)
      // Fetch the new votes.
      fetchOptions(data.round, userId)
      setWaiting(false)
    })

    // Remove subscription on unmount.
    return () => {
      socket.off('round ready')
    }
  })

  useEffect(() => {
    if (!waiting) {
      fetchAliases()
    }
  }, [waiting])

  const handleSelect = async (foodIdA, foodIdB) => {
    // const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    try {
      setWaiting(true)
      await axios.post(`${SERVER_URL}/${categoryId}/vote/${foodIdA}/${foodIdB}`, { userId: userId });
      await axios.post(`${SERVER_URL}/${categoryId}/waiting/remove`, { userId: userId });
      // TODO: We need to trigger a re-draw here though, and when we trigger  re-draw we need the
      // result page to re-load the votes count.
      // Hide the options here and just post ready.
    } catch (error) {
      console.error('Error submitting vote', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Which do you prefer</Text>
      <View style={styles.resultContainer}>
        {!waiting && selectedFoods.map((foodId, index) => (
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
        <ResultsPage></ResultsPage>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  selectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 1,  // Increase the padding for larger button size
    paddingHorizontal: 1, // Increase the padding for larger button size
    marginVertical: 20,
    marginHorizontal: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 24,
    color: 'white',
  },
  chartContainer: {
    width: '80%',
    height: 300,
    padding: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});


export default VotePage;
