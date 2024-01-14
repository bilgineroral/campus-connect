import { Button, styled } from "@mui/material";

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.neutral.dark,
  backgroundColor: theme.palette.background.default,
  borderRadius: "10px",
  padding: "0.7rem 1.4rem",
  border: `1px solid ${theme.palette.neutral.dark}`,
  textTransform: "none",
  minWidth: "12rem",
  fontWeight: 600,

  "&:hover": {
    color: theme.palette.neutral.dark,
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light
  },

  variants: [{
    props: { variant: "error" },
    style: {
      color: theme.palette.error.dark,
      "&:hover": {
        color: theme.palette.error.dark
      }
    }
  }]
}));

export default StyledButton;
