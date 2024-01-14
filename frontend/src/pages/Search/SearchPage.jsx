import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MoreVert as MoreVertIcon, Search as SearchIcon, SearchOutlined } from "@mui/icons-material";
import {
  Avatar,
  CircularProgress,
  Container,
  CssBaseline,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography
} from "@mui/material";

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const handleMenuOpen = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:8000/users/search?key=${searchTerm}`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    return response;
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then((response) => {
        setSearchResults(response.data);
        if (response.data.length === 0) {
          setIsEmpty(true);
        }
        else {
          setIsEmpty(false);
        }
        setError(null);
      })
      .catch(err => {
        console.error(err)
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [searchTerm]);

  /* const handleSearch = async () => {
    if (searchTerm.length <= 0) {
      alert("Enter nickname to search!");
      handleMenuClose();
    } else {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`http://localhost:8000/users/search?key=${searchTerm}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        const data = response.data;
        setSearchResults(data);
      } catch (error) {
        console.error(error);
        setError("An error occurred while fetching data.");
      } finally {
        setLoading(false);
        setSearchButtonClicked(true);
      }
    }
  }; */

  const handleBlock = async () => {
    //http://127.0.0.1:8000/users/block?user_id=2
    
    handleMenuClose();
  };

  const handleReport = async () => {

    handleMenuClose();
  };

  const handleRequestLiveChat = () => {

    handleMenuClose();
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Paper elevation={3} style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <IconButton>
            <SearchOutlined />
          </IconButton>
          <Typography variant="h5">Search</Typography>
        </div>
        <TextField
          variant="outlined"
          margin="normal"
          fullWidth
          label="Nickname"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton disabled>
                  <SearchIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {loading && <CircularProgress style={{ margin: "20px" }} />}

        {error && <Typography variant="body2" color="error">{error}</Typography>}

        {!loading && !error && searchResults.length > 0 && (
          <div>
            <Typography variant="body1" style={{ marginBottom: "10px", textAlign: "left" }}>Search results are shown
              here:</Typography>
            <Grid container spacing={2}>
              {searchResults.map((user) => (
                <Grid item key={user.user_id} xs={12}>
                  <Paper style={{ padding: "10px", display: "flex", alignItems: "center", width: "100%"}}>
                    <Avatar alt={user.nickname} src={user.profile_image ? `http://localhost:8000/${user.profile_image}` : undefined} />
                    <div style={{ marginLeft: "10px" }}>
                      <Link to={`/users/${user.nickname}`} style={{ textDecoration: "none" }}>
                        <Typography variant="h6">{user.nickname}</Typography>
                        <Typography variant="subtitle1">{user.username}</Typography>
                      </Link>
                    </div>
                    { user.user_id != localStorage.getItem('uid') &&
                      <div style={{ marginLeft: "auto" }}>
                        <IconButton onClick={(event) => handleMenuOpen(event, user.user_id)}>
                          <MoreVertIcon />
                        </IconButton>
                        <Menu
                          anchorEl={anchorEl}
                          open={Boolean(anchorEl) && user.user_id === selectedUserId}
                          onClose={handleMenuClose}>
                          {user.blocked != true &&
                            <MenuItem onClick={handleRequestLiveChat}>Request live chat</MenuItem>
                          }
                          <MenuItem onClick={handleReport}>Report</MenuItem>
                          <MenuItem onClick={handleBlock}>
                            {(user.blocked == true) ? "Unblock" : "Block"}
                          </MenuItem>
                        </Menu>
                      </div>
                    }
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </div>
        )}

        {!loading && !error && isEmpty && (
          <Typography variant="body2">No results found.</Typography>
        )}
      </Paper>
    </Container>
  );
};

export default SearchPage;
