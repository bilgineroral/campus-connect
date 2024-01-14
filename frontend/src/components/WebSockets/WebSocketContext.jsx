import React, { createContext, useContext, useState, useEffect } from 'react';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children, token }) => {
  const navigate = useNavigate();
  const [ws, setWs] = useState(null);
  // const [receivedData, setReceivedData] = useState('');
  const [message, setMessage] = useState(null);
  const [openReqDialog, setOpenReqDialog] = useState(false);
  const [openErrDialog, setOpenErrDialog] = useState(false);

  useEffect(() => {
    // Clean up existing WebSocket connection when the component unmounts
    return () => {
      if (ws) {
        ws.close();
        console.log('WebSocket connection closed');
      }
    };
  }, [ws]);

  useEffect(() => {
    if (token) {
      const newWs = new WebSocket(`ws://localhost:8000/ws?token=${token}`);

      newWs.onopen = () => {
        console.log('WebSocket connection established.');
        setWs(newWs);
      };

      newWs.onclose = () => {
        console.log('WebSocket connection closed.');
      };

      newWs.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        setMessage(msg);
        if (msg.type === "request") {
          setOpenReqDialog(true);
        }
        else if (msg.type === "chat_init") {
          const chatKey = msg.detail;
          localStorage.setItem("chatKey", chatKey);
          navigate("/chat/" + chatKey);
        }
        else if (msg.type === "error") {
          setOpenErrDialog(true);
        }
      };

      return () => {
        newWs.close();
        console.log('WebSocket connection closed');
      };
    }
  }, [token]);

  const handleCloseDialog = () => {
    setOpenReqDialog(false);
    setOpenErrDialog(false);
  };

  const handleAccept = () => {
    const msg =
    {
      sender:
      {
        nickname: message.receiver.nickname,
        user_id: message.receiver.user_id,
      },

      receiver:
      {
        nickname: message.sender.nickname,
        user_id: message.sender.user_id,
      },
      type: "request_status",
      detail: "accepted"
    };
    const json_obj = JSON.stringify(msg);
    ws.send(json_obj);
    handleCloseDialog();
  };

  const handleReject = () => {
    const msg =
    {
      sender:
      {
        nickname: message.receiver.nickname,
        user_id: message.receiver.user_id,
      },

      receiver:
      {
        nickname: message.sender.nickname,
        user_id: message.sender.user_id,
      },
      type: "request_status",
      detail: "rejected"
    }; 
    const json_obj = JSON.stringify(msg);
    ws.send(json_obj);
    handleCloseDialog();
  };

  return (
    <WebSocketContext.Provider value={{ ws, openDialog: openReqDialog, handleCloseDialog, handleAccept, handleReject }}>
      {children}
      <Dialog open={openReqDialog} onClose={handleCloseDialog}>
        <DialogTitle>You have a new chat request!</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {message && message.type === "request" &&
              `${message.sender.nickname} wants to chat with you. Do you accept?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReject} color="primary">
            Reject
          </Button>
          <Button onClick={handleAccept} color="primary">
            Accept
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openErrDialog} onClose={handleCloseDialog}>
        <DialogTitle>Couldn't send request.</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {message && message.type === "error" &&
              `${message.detail}`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
