import { useContext, useMemo, useState } from "react";
import { ThemeSelectorContext } from "./ThemeSelectorContext.jsx";
import createTheme from "@mui/material/styles/createTheme";
import { themeSettings } from "./Themes.jsx";
import SettingsContext from "../../pages/Settings/SettingsContext.jsx";
import { ThemeProvider } from "@mui/material/styles";

const ThemeContextProvider = ({ children }) => {
  const { setCookie, cookie } = useContext(SettingsContext);
  const themeIsDark = cookie.preferences.themeIsDark;

  const [mode, setMode] = useState(themeIsDark ? "dark" : "light");

  const toggleTheme = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const theme = useMemo(
    () =>
      createTheme(themeSettings(mode)),
    [mode]
  );

  return (
    <ThemeSelectorContext.Provider value={{ toggleTheme, mode }}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeSelectorContext.Provider>
  );
};

export default ThemeContextProvider;
