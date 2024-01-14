import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, Box, styled, IconButton, TextField, Typography, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Unstable_Grid2/Grid2";
import StyledButton from "../../components/StyledButton.jsx";
import StyledSwitch from "../../components/StyledSwitch.jsx";
import PasswordField from "../../components/PasswordField.jsx";
import StyledTextField from "../../components/StyledTextField.jsx";

const HiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const MGrid = styled(Grid)(() => ({
  display: "flex",
  alignItems: "center"
}));

const MTypography = styled(Typography)(() => ({
  fontSize: "1.4em",
  alignText: "left"
}));

export default function EditProfile() {

  const token = localStorage.getItem("token");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [open, setOpen] = useState(false);

  const [oldName, setOldName] = useState("");
  const [oldNickname, setOldNickname] = useState("");
  const [oldBio, setOldBio] = useState("");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [showEmail, setShowEmail] = useState(false);

  let initialURL = localStorage.getItem("profile_image");
  const [profileImgURL, setProfileImgURL] = useState(initialURL);
  const [editName, setEditName] = useState(false);
  const [editNickname, setEditNickname] = useState(false);
  const [editBio, setEditBio] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/users/me", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        const data = response.data;
        const fetchedName = data["name"];
        const fetchedNickname = data["nickname"];
        const fetchedBio = data["bio"];
        const fetchedURL = data["profile_image"];

        localStorage.setItem("profile_image", "http://localhost:8000/" + fetchedURL);

        setProfileImgURL(localStorage.getItem("profile_image"));
        setName(fetchedName);
        setNickname(fetchedNickname);
        setBio(fetchedBio ?? "You can describe yourself in your biography!");
        setShowEmail(data["show_mail"]);
        setOldName(fetchedName);
        setOldNickname(fetchedNickname);
        setOldBio(fetchedBio ?? "You can describe yourself in your biography!");

      } catch (error) {
        console.error(error);
      }
    };

    fetchData()
      .catch((error) => {
        console.error(error);
        setAlertMessage("An error occured while fetching user data.");
        setAlertType("error");
        setOpen(true);
      });
  }, [token]);

  const handlePhotoSubmit = (event) => {
    if (event.target.files && event.target.files[0]) {
      let profilePhoto = event.target.files[0];
      axios.post("http://localhost:8000/users/me/upload-profile-photo", { file: profilePhoto }, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      })
        .then((response) => {
          const newURL = "http://localhost:8000/" + response.data["path"];
          setProfileImgURL(newURL)
          localStorage.setItem("profile_image", newURL);
        })
        .catch((error) => console.error(error));
    }
  };

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);
  };

  const handleNicknameSubmit = async () => {
    axios.put("http://localhost:8000/users/me/edit-profile", { nickname: nickname }, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => {
        setEditNickname(false);
        setAlertMessage("Nickname successfully changed.");
        setAlertType("success");
        setOldNickname(nickname);
        setOpen(true);
      })
      .catch((error) => {
        console.error(error);
        setAlertMessage(error.response.data.detail);
        setAlertType("warning");
        setOpen(true);
        setEditNickname(false);
        setNickname(oldNickname);
      });
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleNameSubmit = async () => {
    await axios.put(
      "http://localhost:8000/users/me/edit-profile", { name: name },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then((response) => {
        setEditName(false); // Disable edit mode
        setAlertMessage("Name successfully changed.");
        setAlertType("success");
        setOldName(name);
        setOpen(true);
      })
      .catch((error) => {
        console.log(error);
        setAlertMessage("An error occured while updating user data.");
        setAlertType("warning");
        setOpen(true);
        setEditName(false);
        setName(oldName);
      });
  };

  const handleBioChange = (event) => {
    setBio(event.target.value);
  };

  const handleBioSubmit = async () => {
    axios.put(
      "http://localhost:8000/users/me/edit-profile", { bio: bio },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then((response) => {
        setEditBio(false);
        setAlertMessage("Bio successfully changed.");
        setAlertType("success");
        setOldBio(bio);
        setOpen(true);
      })
      .catch((error) => {
        console.error(error);
        setAlertMessage("An error occured while updating user data.");
        setAlertType("warning");
        setOpen(true);
        setEditBio(false);
        setBio(oldBio);
      });
  };

  const handleSubmitShowMail = async () => {
    axios.put(
      "http://localhost:8000/users/me/edit-profile", { show_mail: !showEmail },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    )
      .catch((error) => {
        setAlertMessage("An error occured while updating user data.");
        setAlertType("error");
        setOpen(true);
      });
  };

  return (
    <Box className="wrapper">
      <Box className="flex-centered" sx={{ flexDirection: "column" }}>
        <Grid
          container
          maxWidth="md"
          rowSpacing="4rem"
          columnSpacing="15%"
        >
          <Grid xs={9}>
            <Avatar
              alt="Profile photo"
              src={profileImgURL === "http://localhost:8000/null" ? undefined : profileImgURL}
              sx={{ width: "10rem", height: "10rem" }}
            />
          </Grid>
          <MGrid xs={3}>
            <StyledButton component="label">
              Upload new photo
              <HiddenInput type="file" onChange={handlePhotoSubmit} />
            </StyledButton>
          </MGrid>
          <MGrid xs={9}>
            {editNickname ? (
              <StyledTextField
                label="Nickame"
                value={nickname}
                inputProps={{ maxLength: 50 }}
                onChange={handleNicknameChange}
              />
            ) : (
              <MTypography>{nickname}</MTypography>
            )}
          </MGrid>
          <MGrid xs={3}>
            {editNickname ? (
              <StyledButton onClick={handleNicknameSubmit}>
                Submit
              </StyledButton>
            ) : (
              <StyledButton onClick={() => setEditNickname(true)}>
                Change Nickname
              </StyledButton>
            )}
          </MGrid>
          <MGrid xs={9}>
            {editName ? (
              <StyledTextField
                label="Name"
                value={name}
                inputProps={{ maxLength: 50 }}
                onChange={handleNameChange}
              />
            ) : (
              <MTypography>{name}</MTypography>
            )}
          </MGrid>
          <MGrid xs={3}>
            {editName ? (
              <StyledButton onClick={handleNameSubmit}>
                Submit
              </StyledButton>
            ) : (
              <StyledButton onClick={() => setEditName(true)}>
                Change Name
              </StyledButton>
            )}
          </MGrid>
          <MGrid xs={9}>
            {editBio ? (
              <StyledTextField
                label="Bio"
                multiline
                rows={4}
                fullWidth
                inputProps={{ maxLength: 260 }}
                value={bio}
                onChange={handleBioChange}
              />
            ) : (
              <Typography
                align="left"
                sx={{
                  wordWrap: "break-word",
                  overflow: "hidden",
                  fontWeight: "200",
                  fontSize: "1.2rem",
                  maxWidth: "50rem"
                }}
              >
                {bio}
              </Typography>
            )}
          </MGrid>
          <MGrid xs={3}>
            {editBio ? (
              <StyledButton onClick={handleBioSubmit}>
                Submit
              </StyledButton>
            ) : (
              <StyledButton onClick={() => setEditBio(true)}>
                Change Bio
              </StyledButton>
            )}
          </MGrid>
          <MGrid xs={9}>
            <PasswordField />
          </MGrid>
          <MGrid xs={3}>
            <StyledButton>
              Change password
            </StyledButton>
          </MGrid>
          <MGrid xs={9}>
            <MTypography>
              Show e-mail in profile
            </MTypography>
          </MGrid>
          <Grid xs={3}>
            <StyledSwitch
              checked={showEmail}
              onChange={() => {
                setShowEmail(!showEmail);
                handleSubmitShowMail();
              }}
            />
          </Grid>
        </Grid>
      </Box>
      <Snackbar
        sx={{
          height: "auto",
          position: "fixed",
          top: "80%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center"
        }}
        open={open}
        autoHideDuration={3000}
        onClose={() => {
          setAlertMessage("");
          setOpen(false);
        }}
      >
        <Alert variant="filled"
          severity={alertType}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlertMessage("");
                setOpen(false);
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          {<b>{alertMessage}</b>}
        </Alert>
      </Snackbar>
    </Box>
  );
}
