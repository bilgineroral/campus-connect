import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Checkbox, FormControlLabel, FormGroup, Stack, styled, Typography, useTheme } from "@mui/material";
import StyledSwitch from "../../components/StyledSwitch.jsx";
import StyledButton from "../../components/StyledButton.jsx";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { ThemeSelectorContext } from "../../components/ThemeEngine/ThemeSelectorContext.jsx";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import SettingsContext from "./SettingsContext.jsx";
import { colors } from "../../components/ThemeEngine/Themes.jsx";
import { Link } from "@mui/material";

const MGrid = styled(Grid)(() => ({
  display: "flex",
  alignItems: "center"
}));

const MTypography = styled(Typography)(() => ({
  fontSize: "1.4em"
}));

export default function Settings() {

  const navigate = useNavigate();
  const palette = useTheme();
  const { toggleTheme, mode } = useContext(ThemeSelectorContext);
  const { setCookie, cookie } = useContext(SettingsContext);

  const [showResolved, setShowResolved] = useState(cookie.preferences.showResolved);
  const [themeIsDark, setThemeIsDark] = useState(cookie.preferences.themeIsDark);
  const [filters, setFilters] = useState(cookie.preferences.filters);

  useEffect(() => {
    setCookie("preferences", {
      "showResolved": showResolved,
      "themeIsDark": themeIsDark,
      "filters": filters
    }, {
      sameSite: "none",
      secure: "true"
    });
  }, [filters, setCookie, showResolved, themeIsDark]);

  const handleThemeChange = () => {
    setThemeIsDark((prev) => !prev);
    toggleTheme();
  };

  const handleFilterChange = (filter) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filter]: !prevFilters[filter]
    }));
  };

  const handleBlocklist = () => {
    navigate("/my-blocklist")
  };

  return (
    <Box className="wrapper">
      <Box className="flex-centered" sx={{ flexDirection: "column" }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <SettingsOutlinedIcon sx={{ mt: 0.5, fontSize: "2.75rem" }} />
          <Typography variant="h1"> Settings </Typography>
        </Stack>
        <Grid
          container
          justifyContent="space-between"
          maxWidth="md"
          sx={{ mt: "4rem", flexGrow: 1 }}
          rowSpacing={8}
          columnSpacing={"10%"}
        >
          <MGrid xs={9}>
            <MTypography>
              Use dark theme
            </MTypography>
          </MGrid>
          <MGrid xs={3}>
            <StyledSwitch
              checked={themeIsDark}
              onChange={handleThemeChange}
            />
          </MGrid>
          <MGrid xs={6} sx={{ alignItems: "start" }}>
            <MTypography>
              Filter timeline by:
            </MTypography>
          </MGrid>
          <Grid xs={6}>
            <FormGroup sx={{ alignItems: "end" }}>
              {Object.keys(filters).map((filter) => (
                <FormControlLabel
                  key={filter === "Lost & Found" ? "LostFound" : filter}
                  componentsProps={{
                    typography: {
                      backgroundColor: colors[filter === "Lost & Found" ? "LostFound" : filter],
                      minWidth: "12rem",
                      minHeight: "2rem",
                      fontSize: "1.2rem"
                    }
                  }}
                  control={<Checkbox
                    checked={filters[filter]}
                    onChange={() => handleFilterChange(filter)}
                    sx={{ "& .MuiSvgIcon-root": { fontSize: "1.8rem" } }}
                  />}
                  label={filter === "LostFound" ? "Lost & Found" : filter}
                />
              ))}
            </FormGroup>
          </Grid>
          <MGrid xs={9}>
            <MTypography>
              Show resolved posts in timeline
            </MTypography>
          </MGrid>
          <MGrid xs={3}>
            <StyledSwitch
              checked={showResolved}
              onChange={() => setShowResolved(!showResolved)}
            />
          </MGrid>
          <MGrid>
            <Stack direction="column" spacing={2}>
              <StyledButton variant="error" onClick={handleBlocklist}>
                Go to your blocklist
              </StyledButton>
              <MTypography style={{marginTop: '3rem'}}>
                {'Give us '}
                <Link href="/feedback" color="#6d9eeb">
                  feedback
                </Link>
                {' or report a '}
                <Link href="/bug-reports" color="#6d9eeb">
                  bug.
                </Link>
              </MTypography>
            </Stack>
          </MGrid>
        </Grid>
      </Box>
    </Box>
  );
}
