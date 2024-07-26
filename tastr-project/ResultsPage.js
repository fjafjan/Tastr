import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Button, Alert, TouchableOpacity } from 'react-native';
import { useLocation, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';

const ResultsPage = () => {

  const { categoryId: categoryId } = useParams(); // Extract category Id from URL.
  const [foodNames, setFoodNames] = useState({});
  const [votes, setVotes] = useState({});
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


  const fetchNames = async () => {
    try {
      // TODO we only need to do this step once!
      const namesResponse = await axios.get(`http://localhost:5000/${categoryId}/names`);
      const data = namesResponse.data;
      setFoodNames(data);
      // Randomly select two fields
    } catch (error) {
      console.error('Error fetching names', error);
    }
  };

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
  }, [categoryId]);


  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>And the Oracles have spoken</Text>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>MMR per {categoryId}</Text>
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


export default ResultsPage;
