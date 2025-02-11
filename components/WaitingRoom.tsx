import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import {
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native-web';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import io, { Socket } from 'socket.io-client';
import { SERVER_URL } from '../constants/Constants';
import useAddUserToSession from '../hooks/useAddUserToSession';
import useValidateCategory from '../hooks/useValidateCategory';

const socket: Socket = io(SERVER_URL); // Replace with your server URL

const WaitingRoom: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [waiting, setWaiting] = useState<boolean>(true);
  const [hostId, setHostId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const userId: string | null =
    location.state?.userId || localStorage.getItem('userId');
  const [shareUrl, setShareUrl] = useState<string>(''); // For the share link

  if (!userId) {
    navigate(`/${categoryId}`);
  }

  const proceedToVotingIfRunning = async (): Promise<boolean> => {
    try {
      const runningResponse = await axios.get(
        `${SERVER_URL}/${categoryId}/session/running`,
      );
      if (runningResponse.data.running) {
        navigate(`/${categoryId}/voting`);
      }
      return true;
    } catch (error) {
      console.error('Failed to check if session was running', error);
      return false;
    }
  };

  const categoryValid = useValidateCategory({ categoryId: categoryId });
  const userAdded = useAddUserToSession({
    categoryId: categoryId || '',
    userId: userId || '',
    setSessionId: setSessionId,
    setHostId: setHostId,
    precondition: categoryValid,
  });

  useEffect(() => {
    // Set the share URL when the component is mounted
    setShareUrl(window.location.href);
  }, [categoryId]);

  useEffect(() => {
    const handleStart = async (data: { sessionId: string }): Promise<void> => {
      console.log('Session started event received: ', data.sessionId);
      if (data.sessionId === sessionId) {
        setWaiting(false);
        navigate(`/${categoryId}/voting`);
      } else {
        console.info('Different session has started');
      }
    };

    socket.on('start', handleStart);

    if (userId !== null) {
      socket.emit('join', { userId });
    }

    return () => {
      socket.off('start', handleStart);
    };
  }, [socket, categoryId, navigate, sessionId, userId]);

  useEffect(() => {
    if (categoryValid && userAdded) {
      proceedToVotingIfRunning();
    }
  }, [categoryValid, userAdded]);

  const handleStartButtonPressed = async (): Promise<void> => {
    socket.emit('startSession', {
      categoryId: categoryId,
      hostId: userId,
      sessionId: sessionId,
    });
  };

  const handleCopyToClipboard = (): void => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        Alert.alert('Success', 'Link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

  if (!(categoryValid && userAdded)) {
    return <ClipLoader size={50} color="#36D7B7" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <div id="info-text">
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
        <Pressable
          id="start-session-button"
          onPress={handleStartButtonPressed}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
          ]}
        >
          <Text style={styles.buttonText}>Start</Text>
        </Pressable>
      )}

      {/* Share link input box and copy button */}
      <Text style={styles.shareText}>Share this link with others:</Text>
      <View style={styles.shareContainer}>
        <TextInput
          style={styles.shareInput}
          value={shareUrl}
          editable={false} // Make it read-only
        />
        <Pressable style={styles.copyButton} onPress={handleCopyToClipboard}>
          <Text style={styles.copyButtonText}>Copy</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  shareInput: {
    height: 40,
    width: 250,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
  },
  copyButton: {
    marginLeft: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  copyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonPressed: {
    backgroundColor: '#0056b3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default WaitingRoom;
