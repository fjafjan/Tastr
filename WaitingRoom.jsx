import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, SafeAreaView, StyleSheet, Text } from "react-native-web";
import axios from "axios";
import { SERVER_URL } from "./constants/Constants";

const socket = io(`${SERVER_URL}`); // Replace with your server URL

const WaitingRoom = () => {
  const { categoryId } = useParams();
  const [waiting, setWaiting] = useState(true);
  const [hostId, setHostId] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId || localStorage.getItem("userId");

  if (!userId) {
    navigate(`/${categoryId}`);
  }

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

  const addUserToSession = async () => {
    const sessionEntry = await getSession();
    if (sessionEntry === undefined) {
      console.error("Failed to get add user to session");
      return;
    }
    setHostId(sessionEntry.hostId);
    const sessionId = sessionEntry.sessionId;
    console.log("Got session ID ", sessionId);
    try {
      if (!sessionEntry.tasterIds.includes(userId)) {
        await axios.post(`${SERVER_URL}/${categoryId}/session/add`, {
          sessionId,
          tasterId: userId,
        });
      }
    } catch (error) {
      console.error(
        `Failed to add user ${userId} to sessionId ${sessionId}`,
        error
      );
    }
  };

  useEffect(() => {
    const setupSession = async () => {
      await addUserToSession();
    };
    setupSession();
  }, [categoryId, hostId]);

  useEffect(() => {
    socket.on("start", () => {
      setWaiting(false);
      navigate(`/${categoryId}/voting`);
    });

    socket.emit("join", { userId });

    return () => socket.off("start");
  }, [categoryId, navigate]);

  const handleStart = async () => {
    const session = await getSession();
    socket.emit("startSession", {
      categoryId,
      hostId: session.hostId,
      sessionId: session.sessionId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <div>
        {waiting ? (
          <Text>Waiting for the host to start...</Text>
        ) : (
          <Text>Starting...</Text>
        )}
      </div>
      {hostId === userId && <Button title="Start" onPress={handleStart} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WaitingRoom;
