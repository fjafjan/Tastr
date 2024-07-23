import React, {useState} from 'react'
import { SafeAreaView, ScrollView, TextInput, StyleSheet, View, Button } from 'react-native-web'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const HomePage = () => {
  const [category, setCategory] = useState("")
  const [fields, setFields] = useState({
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    field5: '',
    field6: '',
  });

  // TODO: The homepage should navigate to a new user session directly
  const navigate = useNavigate();

  const handleChange = (name, value) => {
    setFields({
      ...fields,
      [name]: value
    })
  }

  const handleDone = async () => {
    // Generate session ID.
    // TODO: Actually generate a unique session ID.
    const sessionId = category

    // Send the data to the server.
    await axios.post('http://localhost:5000/save', {
      id: sessionId,
      fields: fields
    })

    navigate(`/${sessionId}/result`);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.inputContainer}>
          <TextInput
            key="Category"
            style={styles.category}
            placeholder={'What are you Sampling?'}
            value={category}
            onChangeText={setCategory}
          />
          {Object.keys(fields).map((field, index) => (
          <TextInput
            key={index}
            style={styles.input}
            placeholder={`Enter text for ${field}`}
            value={field[field]}
            onChangeText={(value) => handleChange(field, value)}
          />
          ))}

        </View>
        <Button title="Done" onPress={handleDone}/>
      </ScrollView>
    </SafeAreaView>
  )
};

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
  category: {
    height: 60,
    width: 300,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

  export default HomePage;