import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SERVER_URL } from "../constants/Constants";

// Define the types for the parameters and the return value of the hook
type UseValidateCategoryProps = {
  categoryId: string | undefined;
  onSuccessCallback?: () => void; // Optional callback
};

const useValidateCategory = ({
  categoryId,
  onSuccessCallback,
}: UseValidateCategoryProps): boolean => {
  const navigate = useNavigate();
  const [isCategoryValid, setIsCategoryValid] = useState<boolean>(false);

  // TODO Should probably change this to a function that returns true or false and use that
  // to navigate instead, currently we are doing too much!
  const validateCategory = useCallback(async () => {
    if (categoryId === null) {
      navigate(`/`);
    }
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
    } catch (error: any) {
      console.warn(`Failed to find category ${categoryId}:`, error.message);
      navigate(`/`);
    }
  }, [categoryId, onSuccessCallback, navigate]);

  useEffect(() => {
    if (categoryId) {
      validateCategory();
    }
  }, [categoryId, validateCategory]);

  return isCategoryValid;
};

export default useValidateCategory;
