import React from 'react';
import { Typography, TextField, Box, Container, Snackbar } from '@mui/material';
import StyledButton from '../../components/StyledButton';
import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("error");
    const [open, setOpen] = useState(false);

    function validateEmail(inputText) {
        var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return inputText.match(regex) !== null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            setMessage("Please enter a valid email address.");
            setType("warning");
            setOpen(true);
            return;
        }
        else {
            console.log(email);
            axios.post("http://localhost:8000/send-recovery", { email: email })
                .then((response) => {
                    setMessage("Password reset link has been sent to your email address.");
                    setType("success");
                    setOpen(true);
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 2000);
                })
                .catch((err) => {
                    console.error(err);
                    if (err.response.status === 404) {
                        setMessage("User with the given email address does not exist.");
                        setType("warning");
                        setOpen(true);
                        return;
                    }
                    setMessage("An error occurred while sending the password reset link.");
                    setType("error");
                    setOpen(true);
                });
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100vh"
                py={2}
            >
                <Typography variant="h4" gutterBottom>
                    Forgot Password?
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Email"
                        type="email"
                        variant="outlined"
                        required
                        fullWidth
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); console.log(email); }}
                        margin="normal"
                    />
                    <StyledButton
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                    >
                        Reset Password
                    </StyledButton>
                </form>
            </Box>
            {message && (
                <Box
                    sx={{
                        width: '40%',
                        position: 'fixed',
                        bottom: '20%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                    }}
                >
                    <Snackbar
                        sx={{ height: "100%", width: "100%" }}
                        anchorOrigin={{
                            vertical: "top",
                            horizontal: "center"
                        }}
                        open={open}
                        autoHideDuration={3000}
                        onClose={() => {
                            setMessage(""); setOpen(false)
                        }}>
                        <Alert variant="filled"
                            severity={type}
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={() => {
                                        setMessage("");
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
        </Container>
    );
};

export default ForgotPassword;