// src/components/WaitingRoom.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, SafeAreaView, StyleSheet } from 'react-native-web';
import axios from 'axios';
import { SERVER_URL } from './constants/Constants';

const socket = io(`${SERVER_URL}`); // Replace with your server URL

const WaitingRoom = () => {
  const { categoryId } = useParams(); // Extract session Id from URL.
  const [waiting, setWaiting] = useState(true);
  const navigate = useNavigate();

  // We expect user to enter here from login-screen. If they do not, they have to log in.
  // We could add check that the user exists in the session to make it better.
  const location = useLocation()
  const userId = location.state?.userId
  if (!userId) {
    navigate(`/${categoryId}`)
  }

  const getSessionId = async () => {
    // This will either get an active session for this category, or create a new one.
    try {
      console.log("Trying to get session ID from ", )
      const sessionEntryResponse = await axios.get(`${SERVER_URL}/${categoryId}/session/${userId}/get`)
      const sessionEntry = sessionEntryResponse.data
      console.log("Got session ID ", sessionEntry.sessionId)
      // Add us to this session.
      if (!(userId in sessionEntry.tasterIds)) {
        await axios.post(`${SERVER_URL}/${categoryId}/session/add`, { sessionId: sessionEntry.sessionId, tasterId: userId})
      }
      return sessionEntry.sessionId
    } catch(error) {
      console.error("Failed to get active session ID", error)
    }
  }

  useEffect(() => {
    // Listen for the 'start' event from the server
    socket.on('start', () => {
      setWaiting(false);
      navigate(`/${categoryId}/voting`);
    });
    const userId = localStorage.getItem('userId')

    socket.emit('join', {userId: userId})
    // Cleanup on unmount
    return () => socket.off('start');
  }, [navigate]);

  const handleStart = async () => {
    const userId = localStorage.getItem('userId')
    const sessionId = await getSessionId()

    // TODO we should replace this temporary with finding if there is an active session for this user.
    socket.emit('startSession', {categoryId: categoryId, hostId: userId, sessionId: sessionId})
  }

  return (
    <SafeAreaView style={styles.container}>
      <div>
        {waiting ? (
          <p>Waiting for the host to start...</p>
        ) : (
          <p>Starting...</p>
        )}
      </div>
      {<Button title="Start" onPress={handleStart}/>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


export default WaitingRoom;
