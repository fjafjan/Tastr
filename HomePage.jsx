import React, {useState} from 'react'
import { SafeAreaView, ScrollView, TextInput, StyleSheet, View, Button } from 'react-native-web'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const serverUrl = `${process.env.VITE_SERVER_URL}:${process.env.VITE_SERVER_PORT}` || "http://localhost:5000"

const HomePage = () => {
  const [category, setCategory] = useState("")
  const [fields, setFields] = useState([{ id: 1, value: '' }]);

  // TODO: The homepage should navigate to a new user session directly
  const navigate = useNavigate();

  const handleChange = (id, value) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.id === id ? { ...field, value } : field
      )
    )

    // Add new field if the last visible field is filled
    if (value !== '' && id === fields[fields.length - 1].id) {
      setFields(prevFields =>
        [...prevFields, {id: prevFields.length +1, value: ''}]
      )
    }
  }

  const handleDone = async () => {
    // The category name is used as  Id for now.
    const categoryId = category.toLowerCase()

    // Filter out any fields that are empty
    const filledFields = fields.filter(field => field.value !== '');

    const foodNames = filledFields.reduce((acc, field, index) => {
      acc[`${index + 1}`] = field.value;
      return acc;
    }, {});
    // Send the data to the server.
    try {
      await axios.post(`${serverUrl}/category/add`, {
        categoryId: categoryId,
        foodNames: foodNames
      })  
    } catch (error) {
      console.error("Failed to create new category due to ", error)
    }

    navigate(`/${categoryId}`, { state: { creator: true}});
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
          {fields.map((field) => (
          <TextInput
            key={field.id}
            style={styles.input}
            placeholder={`Enter text for ${field.id}`}
            value={field.value}
            onChangeText={(value) => handleChange(field.id, value)}
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