import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View, Button, Alert } from 'react-native';
import { useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

const ResultPage = () => {
  const { sessionId } = useParams() // Extract session Id from URL.
  const location = useLocation();
  const [fields, setFields] = useState({});
  const [selectedFields, setSelectedFields] = useState([]);

  console.log("Entering results page with session Id", sessionId)
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/foods/${sessionId}`);
        const data = response.data;
        setFields(data);

        // Randomly select two fields
        const fieldNames = Object.keys(data);
        const shuffled = fieldNames.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2);

        setSelectedFields(selected);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };

    fetchFields();
  }, [sessionId]);

  const handleSelect = (field) => {
    alert('Selected Field', `You selected ${field}: ${fields[field]}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultContainer}>
        {selectedFields.map((field, index) => (
          <View key={index} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field}:</Text>
            <Text style={styles.fieldValue}>{fields[field]}</Text>
            <Button
              title={`Select ${field}`}
              onPress={() => handleSelect(field)}
            />
          </View>
        ))}
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
});

export default ResultPage;
