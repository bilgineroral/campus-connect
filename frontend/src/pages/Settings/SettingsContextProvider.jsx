import { CookiesProvider, useCookies } from "react-cookie";
import SettingsContext from "./SettingsContext.jsx";

const SettingsContextProvider = ({ children }) => {
  const [cookie, setCookie] = useCookies(["preferences"]);

  if (!cookie.preferences) {
    setCookie("preferences", {
      "showResolved": false,
      "themeIsDark": true,
      "filters": {
        "LostFound": true,
        "Secondhand Sales": true,
        "Donation": true,
        "Borrowing": true
      }
    }, {
      sameSite: "none",
      secure: "true"
    });
  }

  return (
    <SettingsContext.Provider value={{ setCookie, cookie }}>
      <CookiesProvider>
        {children}
      </CookiesProvider>
    </SettingsContext.Provider>
  );
};

export default SettingsContextProvider;
