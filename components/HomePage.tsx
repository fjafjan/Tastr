import axios from "axios";
import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native-web";
import { useNavigate } from "react-router-dom";
import { SERVER_URL } from "../constants/Constants";

type FoodItem = {
  id: number;
  value: string;
};

const HomePage: React.FC = () => {
  const [categoryName, setCategoryName] = useState<string>("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: 1, value: "" },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  // Function to return alphabet letter based on index (A, B, C...)
  const getLetter = (index: number): string => String.fromCharCode(65 + index);

  const handleChange = (id: number, value: string): void => {
    setFoodItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, value } : item))
    );

    if (value !== "" && id === foodItems[foodItems.length - 1].id) {
      setFoodItems((prevItems) => [
        ...prevItems,
        { id: prevItems.length + 1, value: "" },
      ]);
    }
  };

  const handleDone = async (): Promise<void> => {
    if (!categoryName || foodItems.every((item) => item.value === "")) {
      window.alert("Error: Please enter a category and at least one item.");
      return;
    }

    const categoryId = categoryName.toLowerCase();
    const filledItems = foodItems.filter((item) => item.value !== "");
    const foodNames = filledItems.reduce<{ [key: string]: string }>(
      (acc, item, index) => {
        acc[`${index + 1}`] = item.value;
        return acc;
      },
      {}
    );

    setIsLoading(true); // Start loading
    try {
      await axios.post(`${SERVER_URL}/category/add`, {
        categoryId: categoryId,
        foodNames: foodNames,
      });
      navigate(`/${categoryId}`, { state: { creator: true } });
    } catch (error) {
      console.error("Failed to create new category:", error);
      window.alert("Error: Something went wrong. Please try again.");
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.inputContainer}>
          <TextInput
            key="Category"
            style={styles.category}
            placeholder="What are you Sampling?"
            value={categoryName}
            onChangeText={setCategoryName}
          />
          {foodItems.map((item, index) => (
            <View key={item.id} style={styles.inputWithLetter}>
              {/* Display the corresponding letter */}
              <Text style={styles.letter}>{getLetter(index)}.</Text>
              <TextInput
                style={styles.input}
                placeholder={`Enter a ${categoryName || "item"}`}
                value={item.value}
                onChangeText={(value) => handleChange(item.id, value)}
              />
            </View>
          ))}
        </View>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button
            title="Done"
            onPress={handleDone}
            disabled={
              !categoryName || foodItems.every((item) => item.value === "")
            }
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    paddingVertical: 20,
  },
  inputContainer: {
    width: "80%",
  },
  category: {
    height: 60,
    width: 300,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  inputWithLetter: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  letter: {
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
  },
});

export default HomePage;
