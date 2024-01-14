import axios from "axios";

export class FrontendError extends Error {
  constructor(message) {
    super(message);
    this.name = "FrontendError";
  }
}

class Auth {

  login = async (username, password) => {
    return new Promise((resolve, reject) => {
      if (!(username.length > 0)) {
        reject(new FrontendError("Email was not provided"));
      }

      if (!(password.length > 0)) {
        reject(new FrontendError("Password was not provided"));
      }

      // Create data dict
      const formData = {
        "username": username,
        "password": password
      };

      axios.post("http://localhost:8000/login", formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }).then((response) => {
        const data = response.data;

        if ("access_token" in data) {
          localStorage.setItem("token", data["access_token"]);
          localStorage.setItem("permissions", "user");
          this.setUserInfo();
        }
        resolve(data);
      }).catch((error) => {
        console.error(error);
        reject(error);
      });
    });

  };

  register = async (bilkent_id, email, nickname, username, password, passwordConfirmation) => {
    function validateEmail(inputText) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      return inputText.match(regex) !== null;
    }
    return new Promise((resolve, reject) => {
      if (bilkent_id < 0 || bilkent_id > 23000000) {
        reject(new FrontendError("Invalid Bilkent ID provided."));
        return;
      }

      if (validateEmail(email) == false) {
        reject(new FrontendError("Invalid email address."));
        return;
      }

      // Check password confirmation is not empty
      if (!(passwordConfirmation.length > 0)) {
        reject(new FrontendError("Password confirmation was not provided"));
        return;
      }

      // Check passwords match
      if (password !== passwordConfirmation) {
        reject(new FrontendError("Passwords do not match"));
        return;
      }

      const parameterDict = {
        "bilkent_id": bilkent_id,
        "email": email,
        "nickname": nickname,
        "name": username,
        "password": password
      };
      for (let key in parameterDict) {
        let value = parameterDict[key];
        if (!(value.length > 0)) {
          reject(new FrontendError(`${key} was not provided.`));
          return;
        }
      }
      axios.post("http://localhost:8000/register", parameterDict, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        }
      })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  }

  setUserInfo = () => {
    const getUserInfo = async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:8000/users/me", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    };

    getUserInfo()
      .then((response) => {
        const data = response.data;
        localStorage.setItem("uid", data["user_id"]);
        if (data["profile_image"]) {
          localStorage.setItem("profile_image", "http://localhost:8000/" + data["profile_image"]);
        } else {
          localStorage.setItem("profile_image", null);
        }
      })
      .catch((error) => console.error(error));
  };

  isAuthenticated = () => {
    const permissions = localStorage.getItem("permissions");
    if (!permissions) {
      return false;
    }
    return permissions === "user";
  };
}

export default new Auth();
