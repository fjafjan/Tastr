import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native-web";
import axios from "axios";
import { SERVER_URL } from "../constants/Constants";

const socket = io(`${SERVER_URL}`); // Replace with your server URL

const WaitingRoom = () => {
  const { categoryId } = useParams();
  const [waiting, setWaiting] = useState(true);
  const [hostId, setHostId] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId || localStorage.getItem("userId");
  const [shareUrl, setShareUrl] = useState(""); // For the share link
  const [isUserAdded, setIsUserAdded] = useState(false); // Flag to track if user is added

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
    if (isUserAdded) return; // Prevent multiple additions

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
        setIsUserAdded(true);
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

    // Set the share URL when the component is mounted
    setShareUrl(window.location.href);
  }, [categoryId, hostId, isUserAdded]);

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

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        Alert.alert("Success", "Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
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

      {/* Share link input box and copy button */}
      <Text style={styles.shareText}>Share this link with others:</Text>
      <View style={styles.shareContainer}>
        <TextInput
          style={styles.shareInput}
          value={shareUrl}
          editable={false} // Make it read-only
        />
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopyToClipboard}
        >
          <Text style={styles.copyButtonText}>Copy</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shareText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
  shareContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  shareInput: {
    height: 40,
    width: 250,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    backgroundColor: "#f0f0f0",
  },
  copyButton: {
    marginLeft: 10,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  copyButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default WaitingRoom;
