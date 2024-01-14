import React from 'react';
import { Typography, TextField, Box, Container, Snackbar } from '@mui/material';
import StyledButton from '../../components/StyledButton';
import { Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from 'react';
import axios from 'axios';
import PasswordField from '../../components/PasswordField';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';


const Recovery = () => {

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('key');

    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [message, setMessage] = useState("");
    const [type, setType] = useState("error");
    const [open, setOpen] = useState(false);
    const [invalid, setInvalid] = useState(false);

    useEffect(() => {
        axios.get(`http://localhost:8000/confirm-recovery?key=${token}`)
            .catch((err) => {
                console.error(err);
                setInvalid(true);
            });
    }, []);

    const handleSubmit = async (e) => {

        e.preventDefault();
        if (password !== passwordConfirmation) {
            setMessage("Passwords do not match.");
            setType("warning");
            setOpen(true);
            return;
        }
        else {
            axios.put(
                "http://localhost:8000/users/me/edit-profile", { password: password },
                {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`
                    }
                }
            )
                .then((response) => {
                    setMessage("Successfull. Redirecting to login page..");
                    setType("success");
                    setOpen(true);
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 2000);
                })
                .catch((err) => {
                    console.error(err);
                    setMessage("An error occurred while changing the password.");
                    setType("error");
                    setOpen(true);
                });

        }
    };

    return (invalid ? (
        <></>
    ) : (
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
                    Recover your password
                </Typography>
                <form onSubmit={handleSubmit}>
                    <PasswordField
                        margin="normal"
                        required
                        fullWidth
                        onChange={e => setPassword(e.target.value)}
                    />
                    <PasswordField
                        margin="normal"
                        label='Confirm Password'
                        required
                        fullWidth
                        onChange={e => setPasswordConfirmation(e.target.value)}
                    />
                    <StyledButton
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={handleSubmit}
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

    )
    );
};

export default Recovery;