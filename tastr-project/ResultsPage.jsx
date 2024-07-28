import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import { useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';

const ResultsPage = () => {

  const { categoryId: categoryId } = useParams(); // Extract category Id from URL.
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


  const fetchVotes = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/${categoryId}/mmr`);
      const data = response.data;

      const names = Object.keys(data);
      const values = Object.values(data);

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
