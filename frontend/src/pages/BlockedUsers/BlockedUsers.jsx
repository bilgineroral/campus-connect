import React, { useEffect } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Box,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import axios from 'axios';

const BlockedUsers = () => {

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmpty, setIsEmpty] = useState(false);

  const fetchBlockedUsers = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:8000/blocked-users', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  };

  useEffect(() => {
    let res = []
    fetchBlockedUsers()
      .then((response) => {
        if (response.data.length === 0) {
            setIsEmpty(true);
        }
        else {
            for (let user of response.data) {
                if (user.nickname.includes(searchTerm)) {
                    res.push(user)
                }
            }
        }
        setBlockedUsers(res)
    })
      .catch((error) => console.error(error));
  }, [blockedUsers.length, searchTerm]);

  const handleUnblock = async (userId) => {
    // TODO: Implement unblock logic
    const del = await axios.delete(`http://localhost:8000/users/block?user_id=${userId}`, {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        }
    });
    fetchBlockedUsers()
      .then(resp => setBlockedUsers(resp.data))
      .catch(err => console.error(err));

    console.log(`Unblock user with ID: ${userId}`);
  };

  return (
    <div sx={{ flexGrow: 1, p: 2 }}>
      <Typography variant="h4" gutterBottom textAlign={"center"}>
        Blocked Users
      </Typography>
      <Box display="flex" justifyContent="center" mb={2}>
      <TextField
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
    </Box>
      <Grid container spacing={2} style={{justifyContent: 'center'}}>
        {blockedUsers.length >  0 ? (
         blockedUsers.map((user) => (
            <Grid item xs={12} key={user.user_id} style={{textAlign: 'left'}}>
              <Card sx={{ mb: 2 }}>
                <CardHeader
                  avatar={
                    <Avatar
                      alt={user.nickname}
                      src={null}
                      sx={{ mr: 2 }}
                    />
                  }
                  title={user.nickname}
                  subheader={user.name}
                />
                <CardContent>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleUnblock(user.user_id)}
                  >
                    Unblock
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))   
        ) : ( !isEmpty ? (
            <Typography>No user found in the blocklist with the specified search key.</Typography>
        ) :
            (<Typography style={{textAlign: 'center'}}>You have not blocked any users.</Typography>)
        )}
      </Grid>
    </div>
  );
};

export default BlockedUsers;