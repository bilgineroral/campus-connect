import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Avatar, Typography, Grid, Container, Paper, Button, styled, Box } from '@mui/material';
import StyledDivider from "../../components/StyledDivider.jsx";
import StyledButton from "../../components/StyledButton.jsx";
import { useWebSocket } from "../../components/WebSockets/WebSocketContext";
import PostsView from '../../components/PostsView/PostsView';
import { useParams } from 'react-router-dom';
import { Warning } from '@mui/icons-material';

export default function UserProfile() {
  const { ws, handleCloseDialog } = useWebSocket();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserNickname = localStorage.getItem("nickname");
  const { nickname } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const currentUserId = +localStorage.getItem("uid");

  useEffect(() => {
    // Define an asynchronous function to fetch user data and posts
    const fetchData = async () => {
      try {
        const userResponse = await axios.get(`http://localhost:8000/users?nickname=${nickname}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          }
        });
        const userData = userResponse.data;
        setUser(userData);

        // Fetch user posts after user data is available
        const postsResponse = await axios.get(`http://localhost:8000/home?owner=${userData.user_id}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        const postsData = postsResponse.data;
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching user data or posts", error);
      } finally {
        // Set loading to false after fetching user data and posts, whether successful or not
        setLoading(false);
      }
    };

    // Fetch user data and posts
    fetchData();
  }, [nickname, token]);



  const handleSendRequest = () => {
    // Implement send request functionality
    const message =
    {
      sender:
      {
        nickname: currentUserNickname,
        user_id: currentUserId,
      },
      receiver:
      {
        nickname: nickname,
        user_id: user.user_id,
      },
      type: "request",
      detail: "New Live Chat Request!",
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket connection is not open.");
      // You might want to handle this case, e.g., by notifying the user.
    }

  };

  const handleBlockUser = async () => {
    try {
      const resp = await axios.post(`http://127.0.0.1:8000/users/block?user_id=${user.user_id}`, {}, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      window.location.reload();
    }
    catch (error) {
      console.error("Error blocking user", error);
    }
  };

  const handleReportUser = () => {
    // Implement report user functionality
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleUnblock = async () => {
    try {
      const resp = await axios.delete(`http://127.0.0.1:8000/users/block?user_id=${user.user_id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      window.location.reload();
    }
    catch (error) {
      console.error("Error unblocking user", error);
    }
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  if (!user) {
    // Optionally, you can render a loading spinner or message while the data is being fetched
    return <div>Loading...</div>;
  }

  return (
    <div>
      {loading ? (
        <Typography> Loading... </Typography>
      ) : (
        <Box className="wrapper">
          <Box>
            <Typography variant="h4" fontWeight="bold" style={{ textAlign: "left" }}> 
            {user.user_id == currentUserId ? "My Profile" : "Profile of " + user.nickname}
            </Typography>
            <Grid
              container
              spacing={2}
              sx={{ marginTop: "1rem", display: "flex", alignItems: "center" }}
            >
              {/* Profile Photo */}
              <Grid item xs={12} sm={2.5}>
                <Avatar alt={user.nickname} src={user.profile_image ? `http://localhost:8000/${user.profile_image}` : undefined} sx={{ width: 150, height: 150 }} />
              </Grid>

              {/* User Info (Nickname, Actual Name, Email) */}
              <Grid item xs={12} sm={1.5} style={{ textAlign: "left" }}>
                <Typography variant="h4" fontWeight="bold">
                  {user.nickname}
                </Typography>
                <Typography variant="h5" color="textSecondary" style={{ marginTop: "1rem" }}>
                  {user.name}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {user.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={8} style={{ textAlign: "right" }}>
                {currentUserId === user.user_id ? (
                  <Box>
                    <StyledButton
                      onClick={handleEditProfile}
                      sx={{ marginRight: "1rem" }}
                    >
                      Edit profile
                    </StyledButton>
                    <StyledButton
                      onClick={handleSignOut}
                      variant="error"
                    >
                      Sign Out
                    </StyledButton>
                  </Box>
                ) : (!user.blocked && !user.blocked_by ? (
                  <Box>
                    <StyledButton onClick={handleSendRequest}>
                      Send Live Chat Request
                    </StyledButton>
                    <Box sx={{ marginTop: "1rem" }}>
                      <StyledButton
                        variant="error"
                        sx={{ marginRight: "1rem" }}
                        onClick={handleBlockUser}
                      >
                        Block
                      </StyledButton>
                      <StyledButton
                        onClick={handleReportUser}
                        variant="error"
                      >
                        Report
                      </StyledButton>
                    </Box>
                  </Box>
                ) : (user.blocked &&
                  <StyledButton
                    onClick={handleUnblock}
                    variant="error"
                  >
                    Unblock
                  </StyledButton>
                ))}
              </Grid>
            </Grid>
            <Grid container spacing={2} style={{ marginTop: "-10px" }}>
              <Grid item xs={12} sm={12} style={{ textAlign: "left", marginTop: "1rem" }}>
                <Typography variant="body1" color="textSecondary" style={{ wordWrap: "break-word", overflow: "auto", maxWidth: "50rem" }}>
                  {user.bio}
                </Typography>
              </Grid>
            </Grid>
            <StyledDivider sx={{ marginTop: "2rem" }} />
            {!user.blocked && !user.blocked_by &&
              <PostsView posts={posts} setPosts={setPosts} />
            }
            {
              user.blocked_by &&
              <div style={{ textAlign: 'center', marginTop: '5%' }}>
                <Warning sx={{ fontSize: 100 }} />
                <Typography variant="h5" component="h2" gutterBottom style={{ marginTop: '5%' }}>
                  You are blocked by <strong>{user.nickname}</strong>. You are not able to view any content on,
                  or details about, their account.
                </Typography>
              </div>
            }
            {
              user.blocked &&
              <div style={{ textAlign: 'center', marginTop: '5%' }}>
                <Typography variant="h5" component="h2" gutterBottom style={{ marginTop: '5%' }}>
                  You have blocked <strong>{user.nickname}</strong>. Unblock to view their content.
                </Typography>
              </div>
            }
          </Box>
        </Box>
      )}
    </div>
  );
};
