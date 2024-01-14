import "./App.css";
import ThemeContextProvider from "./components/ThemeEngine/ThemeContextProvider.jsx";
import { CssBaseline } from "@mui/material";
import Login from "./pages/UserAuth/Login.jsx";
import Register from "./pages/UserAuth/Register.jsx";
import Homepage from "./pages/Homepage/Homepage.jsx";
import EditProfile from "./pages/Profile/EditProfile.jsx";
import SearchPage from "./pages/Search/SearchPage.jsx";
import UserProfile from "./pages/Profile/UserProfile.jsx";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PrivateRoute from "./pages/UserAuth/PrivateRoute.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import SettingsContextProvider from "./pages/Settings/SettingsContextProvider.jsx";
import ChatPage from "./pages/LiveChat/ChatPage.jsx";
import BlockedUsers from "./pages/BlockedUsers/BlockedUsers.jsx";
import NotificationsPage from "./pages/Notifications/NotificationsPage.jsx";
import { useState } from "react";
import AlertContext, { AlertProvider } from "./components/AlertContext/AlertContext.jsx";
import ForgotPassword from "./pages/UserAuth/ForgotPassword.jsx";
import Recovery from "./pages/UserAuth/Recovery.jsx";
import VerifyPage from "./pages/UserAuth/VerifyPage.jsx";
import FeedbackPage from "./pages/FeedbackBug/FeedbackPage.jsx";
import BugReportsPage from "./pages/FeedbackBug/BugReportsPage.jsx";


export default function App() {
  const [alert, setAlert] = useState(null);
  return (
    <AlertProvider value={{ alert, setAlert }}>
      <Router>
        <SettingsContextProvider>
          <ThemeContextProvider>
            <CssBaseline />
            <Routes>
              <Route path="/" element={<PrivateRoute />}>
                <Route path="/" element={<Homepage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/feedback" element={<FeedbackPage/>} />
                <Route path="/bug-reports" element={<BugReportsPage/>} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/users/:nickname" element={<UserProfile />} />
                <Route path="/chat/:key" element={<ChatPage />} />
                <Route path="/my-blocklist" element={<BlockedUsers />} />                
              </Route>
              <Route path="/verify" element={<VerifyPage />} />
              <Route path="/password-recovery" element={<ForgotPassword />} />
              <Route path="/recover" element={<Recovery />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </ThemeContextProvider>
        </SettingsContextProvider>
      </Router>
    </AlertProvider>
  );
}
