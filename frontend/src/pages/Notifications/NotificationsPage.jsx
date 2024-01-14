import axios from "axios";
import { useEffect, useState } from "react";
import { Box, Stack, Typography, Avatar } from "@mui/material";
import { NotificationsOutlined } from "@mui/icons-material";
import StyledButton from "../../components/StyledButton.jsx";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchNotifications = async () => {
      const response = await axios.get("http://localhost:8000/notifications", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    };

    fetchNotifications()
      .then((response) => setNotifications(response.data))
      .catch((error) => console.error(error));
  }, []);

  const handleDelete = () => {
    const response = axios.delete("http://localhost:8000/notifications/all", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    response
      .then((response) => setNotifications([]))
      .catch((error) => console.error(error));
  };

  return (
    <Box className="wrapper">
      <Box className="flex-centered" sx={{ flexDirection: "column", justifyContent: "center" }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <NotificationsOutlined sx={{ mt: 0.5, fontSize: "2.75rem" }} />
          <Typography variant="h1"> Notifications </Typography>
        </Stack>
        <Stack spacing="2rem" sx={{ minWidth: "30vw", maxHeight: "60vh", overflow: "auto", margin: "4rem 0 4rem 0" }}>
          {notifications.map((notification) => (
            <Stack key={notification.notification_id} direction="row" spacing={2} alignItems="center">
              <Avatar src={notification.user?.avatar} alt={notification.user?.name} />
              <Box className="flex-centered">
                <Typography>
                  {notification.content}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
        {notifications.length !== 0 ? (
          <StyledButton
            variant="error"
            onClick={handleDelete}
          >
            Delete All Notifications
          </StyledButton>
        ) : (
          // Add better filler
          <Typography>
            No notifications.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
