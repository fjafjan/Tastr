// src/components/WaitingRoom.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, SafeAreaView, StyleSheet } from 'react-native-web';
import axios from 'axios';

const socket = io('http://localhost:5000'); // Replace with your server URL

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

  const getSessionId = () => {
    // This will either get an active session for this category, or create a new one.
    let sessionEntry = axios.get(`http://localhost:5000/${categoryId}/session/get`, {userId: userId} )
    return sessionEntry.sessionId
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

  const handleStart = () => {
    const userId = localStorage.getItem('userId')
    let sessionId = getSessionId()
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
