// src/hooks/useAddUserToSession.js
import { useEffect, useState } from "react";
import axios from "axios";
import { SERVER_URL } from "../constants/Constants";

const useAddUserToSession = (
  categoryId,
  userId,
  setSessionId,
  setHostId,
  onSuccessCallback
) => {
  const [userAdded, setUserAdded] = useState(false); // Flag to track if user is added

  const getSession = async () => {
    try {
      const sessionEntryResponse = await axios.get(
        `${SERVER_URL}/${categoryId}/session/${userId}/get`
      );
      return sessionEntryResponse.data;
    } catch (error) {
      console.error("Failed to get active session ID", error);
    }
  };

  useEffect(() => {
    const addUserToSession = async () => {
      if (userAdded) return; // Prevent multiple additions

      const sessionEntry = await getSession();
      if (sessionEntry === undefined) {
        console.error("Failed to get add user to session");
        return;
      }
      if (setSessionId) {
        setSessionId(sessionEntry.sessionId);
      }
      setHostId(sessionEntry.hostId);
      console.log("Got session ID ", sessionEntry.sessionId);
      try {
        if (!sessionEntry.tasterIds.includes(userId)) {
          await axios.post(`${SERVER_URL}/${categoryId}/session/add`, {
            sessionId: sessionEntry.sessionId,
            tasterId: userId,
          });
          setUserAdded(true);
        }
      } catch (error) {
        console.error(
          `Failed to add user ${userId} to categoryId ${categoryId}`,
          error
        );
      }
    };

    addUserToSession();
  }, [categoryId, userId]);

  if (onSuccessCallback) {
    useEffect(() => {
      if (userAdded) {
        onSuccessCallback();
      }
    });
  }
  return userAdded
};

export default useAddUserToSession;
