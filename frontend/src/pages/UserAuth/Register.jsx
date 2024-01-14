import Auth, {FrontendError} from "./Auth.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import StyledButton from "../../components/StyledButton.jsx";
import StyledTextField from "../../components/StyledTextField.jsx";
import PasswordField from "../../components/PasswordField.jsx";
import { Alert, Collapse, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AlertContext from "../../components/AlertContext/AlertContext.jsx";
import { useContext } from "react";

export default function Register() {
  const navigate = useNavigate();
  const { alert, setAlert } = useContext(AlertContext);

  // User information hooks
  const [bilkentID, setBilkentID] = useState(-1);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [open, setOpen] = useState(false);

  // Function to call submit
  const handleSubmit = async (e) => {
    // Prevents page reload on wrongs creds
    e.preventDefault();
    setError("");

    await Auth.register(bilkentID, email, nickname, username, password, passwordConfirmation)
    .then((response) => {
      localStorage.setItem("email", email);
      localStorage.setItem("nickname", nickname);
      setAlert({ type: 'success', message: 'Account created successfully!' })
      navigate("/login");  
    })
    .catch((err) => {
      console.log(err);
      if (err instanceof FrontendError) {
        setError(err.message);
      }
      else {
        setError(err.response.data.detail);
        console.log("here");
      }
    })
    .finally(() => {
      console.log("here");
      setOpen(true);
    });
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
          maxWidth="lg"
          sx={{ mt: "5rem" }}
          rowSpacing={3}
          columnSpacing={{ xs: 1, sm: 2, md: 3 }}
        >
          <Grid xs={6}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              label="Bilkent ID"
              onChange={e => setBilkentID(e.target.value)}
              autoFocus
              type="number"
            />
          </Grid>

          <Grid xs={6}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              label="E-mail"
              type="email"
              onChange={e => setEmail(e.target.value)}
            />
          </Grid>

          <Grid xs={6}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              label="Nickname"
              onChange={e => setNickname(e.target.value)}
            />
          </Grid>

          <Grid xs={6}>
            <StyledTextField
              margin="normal"
              required
              fullWidth
              label="Username"
              onChange={e => setUsername(e.target.value)}
            />
          </Grid>

          <Grid xs={6}>
            <PasswordField
              margin="normal"
              required
              fullWidth
              onChange={e => setPassword(e.target.value)}
            />
          </Grid>

          <Grid xs={6}>
            <PasswordField
              margin="normal"
              required
              fullWidth
              label="Confirm your password"
              onChange={e => setPasswordConfirmation(e.target.value)}
            />
          </Grid>

          <Grid
            container
            justifyContent="space-between"
            sx={{ mt: "2rem", flexGrow: 1 }}
          >
            <Grid>
              <StyledButton onClick={() => navigate("/login")}>
                Already have an account?
              </StyledButton>
            </Grid>
            <Grid>
              <StyledButton type="submit">
                Register
              </StyledButton>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      {error && (
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
          <Collapse in={open}>
            <Alert variant="filled"
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setError("");
                    setOpen(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              {<strong>{error}</strong>}
            </Alert>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
