import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Button, Alert, TouchableOpacity } from 'react-native';
import { useLocation, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';
import { io } from 'socket.io-client';

// Connect websocket.
const socket = io('http://localhost:5000'); // Replace with your server URL
let waiting = true

const VotePage = () => {
  const { categoryId: categoryId } = useParams(); // Extract category Id from URL.
  const [foodNames, setFoodNames] = useState({});
  const [foodAliases, setFoodAliases] = useState({})
  const [votes, setVotes] = useState({});
  const userId = localStorage.getItem("userId")
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Votes',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  });
  const [selectedFoods, setSelectedFoods] = useState([]);

  const fetchNames = async () => {
    try {
      // TODO we only need to do this step once!
      const namesResponse = await axios.get(`http://localhost:5000/${categoryId}/names`);
      const data = namesResponse.data;
      setFoodNames(data);
      const aliasResponse = await axios.get(`http://localhost:5000/${categoryId}/aliases`)
      const aliases = aliasResponse.data
      setFoodAliases(aliases)
      // Randomly select two fields
    } catch (error) {
      console.error('Error fetching names', error);
    }
  };

  const fetchOptions = async (round) => {
    try {
      const user = localStorage.getItem("userId")
      console.log("Trying to get options from ", `http://localhost:5000/${categoryId}/selection/${round}/${user}`)
      const optionsResponse = await axios.get(`http://localhost:5000/${categoryId}/selection/${round}/${user}`);
      console.log("Got response ", optionsResponse)
      const options = optionsResponse.data
      let newFoods = [ options.foodIdA, options.foodIdB ]
      console.log("Setting new foods", newFoods)
      setSelectedFoods(newFoods);
    } catch(error) {
      console.error("Error fetching options", error)
    }
  }

  const fetchVotes = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/${categoryId}/mmr`);
      const data = response.data;

      const names = Object.keys(data);
      const values = Object.values(data);
      setVotes(data);

      setChartData({
        labels: names,
        datasets: [
          {
            label: 'Votes',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching votes', error);
    }
  };

  useEffect(() => {
    fetchNames();
    fetchVotes();
    fetchOptions(0);
  }, [categoryId]);

  // Configure websocket behavior
  useEffect(() => {
    socket.on('round ready', (data) => {
      console.log(`Round ${data.round} is ready`)
      // Fetch the new votes.
      fetchOptions(data.round)
      waiting = false
    })

    // Remove subscription on unmount.
    return () => {
      socket.off('round ready')
    }
  })
  const handleSelect = async (foodIdA, foodIdB) => {
    Alert.alert(`You selected ${foodIdA}: ${foodNames[foodIdA]} over ${foodNames[foodIdB]}`);
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/${categoryId}/vote/${foodIdA}/${foodIdB}`, { userId });
      fetchVotes();
      // Hide the options here and just post ready.
      waiting = true
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
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Current Votes</Text>
        <Bar
          data={chartData}
          options={{ maintainAspectRatio: false }}
        />
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
