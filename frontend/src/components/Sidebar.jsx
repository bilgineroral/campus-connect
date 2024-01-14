import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Typography,
  useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import {
  EmailOutlined,
  Home,
  NotificationsOutlined,
  PersonOutlined,
  SearchOutlined,
  SettingsOutlined
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import StyledDivider from "./StyledDivider.jsx";

const StyledList = styled(List)(({ theme }) => ({
  "& .MuiListItem-root": {
    paddingLeft: "1rem",
    paddingRight: "1rem",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "2rem"
  },
  "& .MuiListItemText-primary": {
    fontSize: "1.5rem",
    fontWeight: 600
  }
}));

export default function Sidebar() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth <= window.outerWidth / 2); // Adjust the breakpoint as needed
    };

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const nickname = localStorage.getItem("nickname");

  return (
    <Box sx={{ display: "flex", position: "fixed", margin: "2rem 0" }}>
        <Box>
          {isSidebarCollapsed ? (
            <Typography variant="h1" sx={{ marginBottom: "4rem", fontSize: "1.5rem", fontFamily: "'Roboto', sans-serif", marginRight: '10px' }}>
              Campus<br />Connect
            </Typography>
          ) : (
            <Typography variant="h1" sx={{ marginBottom: "4rem" }}>
              Campus<br />Connect
            </Typography>
          )}
          <StyledList>
            <ListItem>
              <ListItemButton onClick={() => navigate("/")}>
                <ListItemIcon> <Home /> </ListItemIcon>
                {!isSidebarCollapsed && <ListItemText primary="Home" />}
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton onClick={() => navigate("/search")}>
                <ListItemIcon> <SearchOutlined /> </ListItemIcon>
                {!isSidebarCollapsed && <ListItemText primary="Search" />}
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton onClick={() => navigate("/notifications")}>
                <ListItemIcon> <NotificationsOutlined /> </ListItemIcon>
                {!isSidebarCollapsed && <ListItemText primary="Notifications" />}
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton onClick={() => navigate(`/users/${nickname}`)}>
                <ListItemIcon> <PersonOutlined /> </ListItemIcon>
                {!isSidebarCollapsed && <ListItemText primary="Profile" />}
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton onClick={() => navigate("/settings")}>
                <ListItemIcon> <SettingsOutlined /> </ListItemIcon>
                {!isSidebarCollapsed && <ListItemText primary="Settings" />}
              </ListItemButton>
            </ListItem>
          </StyledList>
        </Box>
      
      <StyledDivider orientation="vertical" variant="fullWidth" sx={{ minHeight: "90vh" }} />
    </Box>
  );
}
