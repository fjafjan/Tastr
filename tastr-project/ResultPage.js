import React from 'react';
import { SafeAreaView, Text, StyleSheet, View } from 'react-native';
import { useLocation } from 'react-router-dom';

const ResultPage = () => {
    const location = useLocation();
    const { fields } = location.state || {}

    return (
        <SafeAreaView style={style.container}>
            <View style={styles.resultContainer}>
                {Object.keys(fields || {}).map((field, index) => (
                 <Text key={index} style={styles.text}>
                    {`${field}: ${fields[field]}`}
                 </Text>
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
    },
    resultContainer: {
      width: '80%',
    },
    text: {
      fontSize: 18,
      marginBottom: 10,
    },
  });

  export default ResultPage;