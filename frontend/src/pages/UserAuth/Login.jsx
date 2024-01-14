import Auth from "./Auth.jsx";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Snackbar, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import StyledButton from "../../components/StyledButton.jsx";
import StyledDivider from "../../components/StyledDivider.jsx";
import StyledTextField from "../../components/StyledTextField.jsx";
import PasswordField from "../../components/PasswordField.jsx";
import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import AlertContext from "../../components/AlertContext/AlertContext.jsx";
import { useContext } from "react";

export default function Login() {
  // Hooks to redirect to original page
  const navigate = useNavigate();
  const { alert, setAlert } = useContext(AlertContext);
  const location = useLocation();

  const [message, setMessage] = useState("");
  const [type, setType] = useState("error");
  const [open, setOpen] = useState(false);

  // User information hooks
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (alert) {
      setMessage(alert.message);
      setType(alert.type);
      console.log(alert.type);
      setOpen(true);
    }
  }, [alert]);

  // Function to call submit
  const handleSubmit = async (e) => {
    // Prevents page reload on wrongs creds
    e.preventDefault();
    setMessage("");
    sessionStorage.setItem("beforeLogin", location.state?.from?.pathname);

    try {
      const data = await Auth.login(username, password);
      // Executes only when there are no 400 and 500 errors, else they are thrown as errors
      // Callbacks can be added here
      console.log("data: " + data);
      localStorage.setItem("nickname", username);
      const beforeLoginURL = sessionStorage.getItem("beforeLogin");
      sessionStorage.removeItem("beforeLogin");

      let candidate = beforeLoginURL ?? location.state?.from;

      if (typeof candidate === "undefined" || candidate == null || candidate === "undefined") {
        navigate("/", { replace: true });
      } else {
        navigate(candidate, { replace: true });
      }
    } catch (err) {
      /* if (err instanceof Error) {
        // Handle errors thrown from frontend
        setError(err.message);
      } else { */
      // TODO Handle errors thrown from backend + add correct error messages
      /* if (error.response && error.response.data.detail === "Please verify your email address") {
        console.log("Please verify your email address");
        window.location.href = "/verify";
      
      } */
      // alert(err.response.data.detail)
      if (err.response.status === 401 && err.response.data.detail === "Please verify your email address") {
        window.location.href = "/verify";
      }
      else if (err.response.status === 400 || err.response.status === 422) {
        setMessage("An error occured. Please try again later.");
        setType("error");
      }
      else {
        setMessage(err.response.data.detail + ".");
        setType("error");
      }
      setOpen(true);
    }

  };

  return (
    <Box className="wrapper">
      <Box className="flex-centered" sx={{ flexDirection: "column" }}>
        <Typography variant="h1">
          CampusConnect
        </Typography>
        <Grid
          component="form"
          onSubmit={handleSubmit}
          container
          maxWidth="sm"
          sx={{ mt: "5rem" }}
          rowSpacing={3}
        >
          <Grid xs={12}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              label="Username"
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
          </Grid>
          <Grid xs={12}>
            <PasswordField
              margin="normal"
              required
              fullWidth
              onChange={e => setPassword(e.target.value)}
            />
          </Grid>

          <Grid
            container
            justifyContent="space-between"
            sx={{ mt: "2rem", flexGrow: 1 }}
          >
            <Grid>
              <StyledButton onClick={() => navigate("/password-recovery")}>
                Forgot password?
              </StyledButton>
            </Grid>
            <Grid>
              <StyledButton type="submit">
                Log in
              </StyledButton>
            </Grid>
            <Grid xs={12}>
              <StyledDivider />
            </Grid>
            <Grid xs={12}>
              <StyledButton onClick={() => navigate("/register")}>
                Don't have an account?
              </StyledButton>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      {message && (
        <Box
          sx={{
            width: '40%',
            position: 'fixed',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
          }}
        >
          <Snackbar
            sx={{ height: "100%" }}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center"
            }}
            open={open}
            autoHideDuration={3000}
            onClose={() => {
              setAlert(null); setOpen(false)
            }}>
            <Alert variant="filled"
              severity={type}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setAlert(null);
                    setOpen(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              {<strong>{message}</strong>}
            </Alert>
          </Snackbar>

        </Box>
      )}
    </Box>
  );
}
