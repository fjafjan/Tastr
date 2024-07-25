// src/components/WaitingRoom.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, SafeAreaView, StyleSheet } from 'react-native-web';

const socket = io('http://localhost:5000'); // Replace with your server URL

const WaitingRoom = () => {
  const { categoryId } = useParams(); // Extract session Id from URL.
  const [waiting, setWaiting] = useState(true);
  const navigate = useNavigate();


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
  }, [history]);

  const handleStart = () => {
    const userId = localStorage.getItem('userId')
    socket.emit('start', {categoryId: categoryId, hostId: userId})
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
