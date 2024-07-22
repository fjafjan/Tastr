import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-web';
import { useLocation } from 'react-router-dom';

const ResultPage = () => {
  const location = useLocation();
  const { sessionId } = location.state || {}
  const [fields, setFields] = useState({})
  const [seletedFields, setSelectedFields] = useState([])

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/foods/${sessionId}`)
        const data = response.data
        setFields(data)

        // Randomly select two field s
        const fieldNames = Object.keys(data)
        const shuffled = fieldNames.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 2)

        // Save selected fields
        setSelectedFields(selected)
      } catch (error) {
        console.error("Error fetching data", error)
      }
    }
    fetchFields()
  }, [sessionId])

  const handleSelect = (field) => {
    alert('Selected Field', `You selected ${field}: ${fields[field]}`);
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.resultContainer}>
        {setFields.map((field, index) => (
           <View key={index} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>{field}:</Text>
            <Text style={styles.fieldValue}>{fields[field]}:</Text>
            <Button
              title={`Select ${field}`}
              onPress={() => handleSelect(field)}
              style={styles.selectButton}/>
          </View>
        ))}
      </View>
    </SafeAreaView>
  )
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
    justifyContent: 'space-between',  // Ensures items are spaced evenly
    width: '100%',  // Makes sure the container uses full width
    paddingHorizontal: 10,
  },
  fieldContainer: {
    flex: 1,  // Allows the field container to grow and shrink as needed
    alignItems: 'center',
    marginHorizontal: 5,  // Space between the field containers
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