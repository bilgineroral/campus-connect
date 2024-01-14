import { createContext } from "react";

export const SettingsContext = createContext({
  setCookie: () => {},
  cookie: {}
});

export default SettingsContext;
