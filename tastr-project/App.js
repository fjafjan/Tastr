import React, { useState } from 'react';
import { SafeAreaView, ScrollView, TextInput, StyleSheet, View, Text } from 'react-native';

export default function App() {
  const [fields, setFields] = useState({
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    field5: '',
    field6: '',
  });

  const handleChange = (name, value) => {
    setFields({
      ...fields,
      [name]: value,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.inputContainer}>
          {Object.keys(fields).map((field, index) => (
            <TextInput
              key={index}
              style={styles.input}
              placeholder={`Enter text for ${field}`}
              value={fields[field]}
              onChangeText={(value) => handleChange(field, value)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    paddingVertical: 20,
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});
