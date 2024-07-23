import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Button, Alert } from 'react-native';
import { useLocation, useParams } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import 'chart.js/auto';

const ResultPage = () => {
  const { sessionId } = useParams(); // Extract session Id from URL.
  const location = useLocation();
  const [fields, setFields] = useState({});
  const [votes, setVotes] = useState({});
  const [chartData, setChartData] = useState({});
  const [selectedFields, setSelectedFields] = useState([]);

  console.log("Entering results page with session Id", sessionId);

  useEffect(() => {
    // Get the names of the fields.
    fetch(`http://localhost:5000/foods/${sessionId}`)
      .then(response => response.json())
      .then(data => setFields(data))
      .catch(error => console.error('Error fetching field names', error));

    // Get the vote data.
    fetch(`http://localhost:5000/votes/${sessionId}`)
      .then(response => response.json())
      .then(data => {
        setVotes(data);
        const labels = Object.keys(data);
        const values = Object.values(data);
        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Votes',
              data: values,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            }
          ]
        });
      })
      .catch(error => console.error("Failed to fetch vote data", error));
  }, [sessionId]);

  useEffect(() => {
    // Select two random fields when the component mounts or when fields change
    if (Object.keys(fields).length > 0) {
      const fieldNames = Object.keys(fields);
      const randomFields = [];
      while (randomFields.length < 2) {
        const randomField = fieldNames[Math.floor(Math.random() * fieldNames.length)];
        if (!randomFields.includes(randomField)) {
          randomFields.push(randomField);
        }
      }
      setSelectedFields(randomFields);
    }
  }, [fields]);

  const handleSelect = async (field, otherField) => {
    alert(`You selected ${field}: ${fields[field]} over ${fields[otherField]}`);
    await axios.post(`http://localhost:5000/vote/${sessionId}/${field}/${otherField}`)
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultContainer}>
        {selectedFields.map((field, index) => (
          <View key={index} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field}:</Text>
            <Text style={styles.fieldValue}>{fields[field]}</Text>
            <Button
              title={`Select ${fields[field]}`}
              onPress={() => handleSelect(field, selectedFields[Math.abs(1 - index)])}
            />
          </View>
        ))}
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Current Votes</Text>
        <Bar data={chartData} />
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
  fieldContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  fieldValue: {
    fontSize: 16,
    marginBottom: 10,
  },
  chartContainer: {
    width: '100%',
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
