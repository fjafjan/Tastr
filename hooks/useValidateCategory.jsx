import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SERVER_URL } from "../constants/Constants";

const useValidateCategory = (categoryId, onSuccessCallback) => {
  const navigate = useNavigate();
  const [isCategoryValid, setIsCategoryValid] = useState(false);

  useEffect(() => {
    const validateCategory = async () => {
      try {
        const categoryResponse = await axios.get(
          `${SERVER_URL}/category/get/${categoryId}`
        );

        if (categoryResponse && categoryResponse.status === 200) {
          console.log(`Found category ${categoryId}`);
          setIsCategoryValid(true);

          // Run the success callback if provided
          if (onSuccessCallback) {
            onSuccessCallback();
          }
        } else {
          console.warn(
            `Category ${categoryId} validation failed with status ${categoryResponse.status}`
          );
          navigate(`/`);
        }
      } catch (error) {
        console.warn(`Failed to find category ${categoryId}:`, error.message);
        navigate(`/`);
      }
    };

    if (categoryId) {
      validateCategory();
    }
  }, [categoryId, navigate, onSuccessCallback]);

  return isCategoryValid; // Optional return if needed by consuming component
};

export default useValidateCategory;
