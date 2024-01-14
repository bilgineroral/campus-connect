import { useEffect, useState } from 'react';
import axios from 'axios';
import { useWebSocket } from '../../components/WebSockets/WebSocketContext';
import { Container, TextField, Button, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import React from 'react';

export default function ChatPage() {
  const chatId = localStorage.getItem("chatKey");
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("uid");
  const currentUserNickname = localStorage.getItem("nickname");
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const { ws, handleCloseDialog } = useWebSocket();
  const [chattedUser, setChattedUser] = useState(null);


  useEffect(() => {
    ws.onmessage = (msg) => {
      const json_msg = JSON.parse(msg.data);
      console.log("json_msg: " + json_msg);
      setChat((prevChat) => [...prevChat, json_msg]);
    };
  }, [chat]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersResponse = await axios.get(
          `http://localhost:8000/chat?chat_id=${chatId}`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            }
          });
        const usersData = usersResponse.data;
        console.log(usersData);
        if (usersData[0].user_id == currentUserId) {
          setChattedUser(usersData[1]);
        } else {
          setChattedUser(usersData[0]);
        }
        console.log(chattedUser);
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };
    fetchUsers();
  }, []);

  const onTextChange = (e) => {
    setMessage(e.target.value);
  };

  const onMessageSubmit = (e) => {
    e.preventDefault();
    const msg =
      {
        sender:
          {
            nickname: currentUserNickname,
            user_id: currentUserId,
          },
        receiver:
          {
            nickname: chattedUser.nickname,
            user_id: chattedUser.user_id,
          },
        type: "message",
        detail: message
      }
    ws.send(JSON.stringify(msg));
    setMessage('');
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Chat
      </Typography>
      <form onSubmit={onMessageSubmit}>
        <TextField
          value={message}
          onChange={(e) => onTextChange(e)}
          fullWidth
          variant="outlined"
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">
          Send
        </Button>
      </form>
      <List>
        {chat.map((msg, idx) => (
          <ListItem key={idx}>
            <ListItemText
              primary={
                <React.Fragment>
                  <Typography component="span" variant="body1" style={{ fontWeight: 'bold' }}>
                    {msg.sender.nickname}
                  </Typography>
                  {`: ${msg.detail}`}
                </React.Fragment>
              }
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};
