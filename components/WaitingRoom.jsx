import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native-web";
import axios from "axios";
import { SERVER_URL } from "../constants/Constants";
import useValidateCategory from "../hooks/useValidateCategory";
import useAddUserToSession from "../hooks/useAddUserToSession";
import { ClipLoader } from "react-spinners";

const socket = io(`${SERVER_URL}`); // Replace with your server URL

const WaitingRoom = () => {
  const { categoryId } = useParams();
  const [waiting, setWaiting] = useState(true);
  const [hostId, setHostId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId || localStorage.getItem("userId");
  const [shareUrl, setShareUrl] = useState(""); // For the share link

  if (!userId) {
    navigate(`/${categoryId}`);
  }

  const proceedToVotingIfRunning = async () => {
    try {
      const runningResponse = await axios.get(
        `${SERVER_URL}/${categoryId}/session/running`
      );
      if (runningResponse.data.running) {
        navigate(`/${categoryId}/voting`);
      }
    } catch (error) {
      console.error("Failed to check if session was running", error);
      return false;
    }
  };

  const categoryValid = useValidateCategory(categoryId);
  const userAdded = useAddUserToSession(
    categoryId,
    userId,
    setSessionId,
    setHostId,
    categoryValid
  );

  useEffect(() => {
    // Set the share URL when the component is mounted
    setShareUrl(window.location.href);
  }, [categoryId]);

  useEffect(() => {
    socket.on("start", () => {
      setWaiting(false);
      navigate(`/${categoryId}/voting`);
    });

    socket.emit("join", { userId });

    return () => socket.off("start");
  }, [categoryId, navigate]);

  if (categoryValid && userAdded) {
    proceedToVotingIfRunning();
  } else {
    return <ClipLoader size={50} color="#36D7B7" />;
  }

  const handleStartButtonPressed = async () => {
    socket.emit("startSession", {
      categoryId,
      hostId: userId,
      sessionId: sessionId,
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
          hostId === userId ? (
            <Text>Start when all tasters have joined</Text>
          ) : (
            <Text>Waiting for the host to start...</Text>
          )
        ) : (
          <Text>Starting...</Text>
        )}
      </div>
      {hostId === userId && (
        <Button title="Start" onPress={handleStartButtonPressed} />
      )}

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
