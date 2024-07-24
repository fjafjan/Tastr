import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Button, Alert } from 'react-native';
import { useLocation, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';

const ResultPage = () => {
  const { sessionId } = useParams(); // Extract session Id from URL.
  const [fields, setFields] = useState({});
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
  const [selectedFields, setSelectedFields] = useState([]);

  const fetchFields = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/names/${sessionId}`);
      const data = response.data;
      setFields(data);

      // Randomly select two fields
      const fieldNames = Object.keys(response.data);
      const shuffled = fieldNames.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2);

      setSelectedFields(selected);
    } catch (error) {
      console.error('Error fetching names', error);
    }
  };

  const fetchVotes = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/votes/${sessionId}`);
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
    fetchFields();
    fetchVotes();
  }, [sessionId]);

  const handleSelect = async (field, otherField) => {
    Alert.alert(`You selected ${field}: ${fields[field]} over ${fields[otherField]}`);
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('No user ID found');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/vote/${sessionId}/${field}/${otherField}`, { userId: userId});
      fetchVotes();
    } catch (error) {
      console.error('Error submitting vote', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultContainer}>
        {selectedFields.map((field, index) => (
          <View key={index} style={styles.selectButton}>
            <Button
              title={`${fields[field]}`}
              onPress={() => handleSelect(field, selectedFields[1 - index])}
            />
          </View>
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
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  selectButton: {
    flex: 1,
    alignItems: 'center',
    marginVertical: 50,
    marginHorizontal: 50,
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

export default ResultPage;
