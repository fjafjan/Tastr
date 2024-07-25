// src/components/WaitingRoom.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useNavigate, useParams } from 'react-router-dom';

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

    // Cleanup on unmount
    return () => socket.off('start');
  }, [history]);

  return (
    <div>
      {waiting ? (
        <p>Waiting for the host to start...</p>
      ) : (
        <p>Starting...</p>
      )}
    </div>
  );
};

export default WaitingRoom;
