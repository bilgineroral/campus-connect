import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { FormControl, IconButton, InputAdornment, InputLabel, OutlinedInput, styled } from "@mui/material";

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: theme.palette.neutral.dark,
      borderRadius: "1rem"
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main
    }
  },
  "& .MuiButtonBase-root": {
    color: theme.palette.neutral.dark
  }
}));

function PasswordField({ label = "Password", ...props }) {
  const [passwordShown, setPasswordShown] = useState(false);

  const handlePasswordShown = () => {
    setPasswordShown((shown) => !shown);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  return (
    <StyledFormControl
      variant="outlined"
      {...props}
    >
      <InputLabel htmlFor="input-field">{label}</InputLabel>
      <OutlinedInput
        id="input-field"
        type={passwordShown ? "text" : "password"}
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              onClick={handlePasswordShown}
              onMouseDown={handleMouseDownPassword}
              edge="end"
            >
              {passwordShown ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        }
        label={label}
      />
    </StyledFormControl>
  );
}

export default PasswordField;
