import React from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import { Button } from 'react-native-web';
import { useLocation } from 'react-router-dom';

const ResultPage = () => {
    const location = useLocation();
    const { fields, selectedFields } = location.state || {}

    const handleSelect = () => {
        alert('Selected fields ' + selectedFields.join(', '))
    }


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.resultContainer}>
                {selectedFields.map((field, index) => (
                    <View key={index} style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>{field}:</Text>
                        <Text style={styles.fieldValue}>{fields[field]}:</Text>
                    </View>
                ))}
                <Button title="Selected" onPress={handleSelect}/>
            </View>
        </SafeAreaView>
    )
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultContainer: {
      width: '80%',
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
      },
  });

  export default ResultPage;