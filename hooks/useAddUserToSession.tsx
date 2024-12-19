import { useEffect, useState } from "react";
import axios from "axios";
import { SERVER_URL } from "../constants/Constants";

// Define types for the function parameters
interface SessionEntry {
  sessionId: string;
  hostId: string;
  tasterIds: string[];
}

interface UseAddUserToSessionProps {
  categoryId: string;
  userId: string;
  setSessionId: React.Dispatch<React.SetStateAction<string>>;
  setHostId: React.Dispatch<React.SetStateAction<string>>;
  precondition: boolean;
  onSuccessCallback?: () => void;
}

const useAddUserToSession = ({
  categoryId,
  userId,
  setSessionId,
  setHostId,
  precondition,
  onSuccessCallback,
}: UseAddUserToSessionProps): boolean => {
  const [userAdded, setUserAdded] = useState<boolean>(false); // Flag to track if user is added

  const getSession = async (): Promise<SessionEntry | undefined> => {
    try {
      const sessionEntryResponse = await axios.get(
        `${SERVER_URL}/${categoryId}/session/${userId}/get`
      );
      return sessionEntryResponse.data;
    } catch (error) {
      console.error("Failed to get active session ID", error);
      return undefined;
    }
  };

  useEffect(() => {
    const addUserToSession = async () => {
      if (userAdded) return; // Prevent multiple additions

      const sessionEntry = await getSession();
      if (!sessionEntry) {
        console.error("Failed to add user to session");
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
        }
        setUserAdded(true);
      } catch (error) {
        console.error(
          `Failed to add user ${userId} to categoryId ${categoryId}`,
          error
        );
      }
    };

    if (precondition) {
      addUserToSession();
    }
  }, [categoryId, userId, precondition, setSessionId, setHostId, userAdded]);

  useEffect(() => {
    if (userAdded && onSuccessCallback) {
      onSuccessCallback();
    }
  }, [userAdded, onSuccessCallback]);

  return userAdded;
};

export default useAddUserToSession;
