import { Divider, styled } from "@mui/material";

const StyledDivider = styled(Divider)(({ theme }) => ({
  borderColor: theme.palette.neutral.dark,
  borderRightWidth: "0.01rem"
}));

export default StyledDivider;
