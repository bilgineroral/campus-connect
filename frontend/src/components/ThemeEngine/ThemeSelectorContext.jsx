import { createContext } from "react";

export const ThemeSelectorContext = createContext({
  toggleTheme: () => {},
  mode: "dark"
});
