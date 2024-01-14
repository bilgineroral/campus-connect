import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@mui/material';

const VerifyPage = () => {
  const [isVerified, setIsVerified] = useState(false);
  const email = localStorage.getItem('email');
  const nickname = localStorage.getItem('nickname');

  const handleResendVerification = async () => {
    try {
      await axios.post(`http://localhost:8000/resend-verification?email=${email}`, {});
      alert('Verification email sent. Please check your inbox.');
    } catch (error) {
      console.error(error);
      alert('An error occurred while sending the verification email.');
    }
  };

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:8000/is-verified?nickname=${nickname}`);
        setIsVerified(response.data);
      } catch (error) {
        console.error(error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, [email]);

  useEffect(() => {
    if (isVerified) {
      window.location.href = '/login';
    }
  }, [isVerified]);

  return (
    <div>
      <h1>Verify Your Email</h1>
      <p>Please click the link in the verification email we sent you. If you didn't receive the email, you can request a new one.</p>
      <Button variant="contained" color="primary" onClick={handleResendVerification}>
        Resend Verification Email
      </Button>
    </div>
  );
};

export default VerifyPage;