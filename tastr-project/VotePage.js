import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Button, Alert, TouchableOpacity } from 'react-native';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import 'chart.js/auto';
import { io } from 'socket.io-client';
import ResultsPage from './ResultsPage';

// Connect websocket.
const socket = io('http://localhost:5000'); // Replace with your server URL

const VotePage = () => {
  const { categoryId: categoryId } = useParams(); // Extract category Id from URL.
  const [foodAliases, setFoodAliases] = useState({})
  const userId = localStorage.getItem("userId")
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [waiting, setWaiting] = useState(true)

  const fetchAliases = async () => {
    try {
      const aliasResponse = await axios.get(`http://localhost:5000/${categoryId}/aliases`)
      const aliases = aliasResponse.data
      setFoodAliases(aliases)
      // Randomly select two fields
    } catch (error) {
      console.error('Error fetching aliases', error);
    }
  };

  const fetchOptions = async (round) => {
    try {
      const user = localStorage.getItem("userId")
      const optionsResponse = await axios.get(`http://localhost:5000/${categoryId}/selection/${round}/${user}`);
      const options = optionsResponse.data
      let newFoods = [ options.foodIdA, options.foodIdB ]
      setSelectedFoods(newFoods);
    } catch(error) {
      console.error("Error fetching options", error)
    }
  }

  useEffect(() => {
    fetchAliases();
    fetchOptions(0);
  }, [categoryId]);

  // Configure websocket behavior
  useEffect(() => {
    socket.on('round ready', (data) => {
      console.log(`Round ${data.round} is ready`)
      // Fetch the new votes.
      fetchOptions(data.round)
      setWaiting(false)
    })

    // Remove subscription on unmount.
    return () => {
      socket.off('round ready')
    }
  })
  const handleSelect = async (foodIdA, foodIdB) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/${categoryId}/vote/${foodIdA}/${foodIdB}`, { userId });
      await axios.post(`http://localhost:5000/${categoryId}/waiting/remove`, { userId });
      // TODO: We need to trigger a re-draw here though, and when we trigger  re-draw we need the
      // result page to re-load the votes count.
      // Hide the options here and just post ready.
      setWaiting(true)
    } catch (error) {
      console.error('Error submitting vote', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Which do you prefer</Text>
      <View style={styles.resultContainer}>
        {selectedFoods.map((foodId, index) => (
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
