import { DeleteOutlined, ImageOutlined } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputBase,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography,
  useTheme,
  Alert,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { useEffect, useState } from "react";
import Dropzone from "react-dropzone";
import StyledButton from "../StyledButton.jsx";
import StyledDivider from "../StyledDivider.jsx";
import StyledTextField from "../StyledTextField.jsx";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/en-gb";

const postType = {
  LOSTFOUND: "LostFound",
  SECONDHANDSALES: "Secondhand Sales",
  DONATION: "Donation",
  BORROWING: "Borrowing"
};

export default function CreatePost({ getPosts }) {

  const profileImgURL = localStorage.getItem("profile_image");
  const theme = useTheme();
  const token = localStorage.getItem("token");

  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("warning");
  const [open, setOpen] = useState(false);

  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [attachingImage, setAttachingImage] = useState(false);
  const [image, setImage] = useState(null);

  const [lFChoice, setLFChoice] = useState("lost");
  const [lFDate, setLFDate] = useState(null);
  const [auctionDeadline, setAuctionDeadline] = useState(null);
  const [price, setPrice] = useState("");
  const [bidsEnabled, setBidsEnabled] = useState(false);
  const [minDonation, setMinDonation] = useState("");
  const [donationAim, setDonationAim] = useState("");
  const [borrowingDeadline, setBorrowingDeadline] = useState(null);

  const formatDate = (pref_date) => {
    let date = new Date(pref_date);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const handleLFChoiceChange = (event) => {
    setLFChoice((event.target).value);
  };

  const handlePost = async () => {
    const createPost = async () => {
      const formData = new FormData();

      formData.append("content", content);

      if (image) {
        formData.append("file", image);
      }
      if (!type) {
        setAlertMessage("Please select a post type.");
        setAlertType("warning");
        setOpen(true);
        return;
      }
      switch (type) {
        case postType.LOSTFOUND:
          formData.append("lost_item", lFChoice === "lost");
          if (!lFDate) {
            setAlertMessage("Please select a date.");
            setAlertType("warning");
            setOpen(true);
            return;
          } else {
            formData.append("lf_date", formatDate(lFDate));
          }
          break;
        case postType.SECONDHANDSALES:
          formData.append("bids_enabled", bidsEnabled);
          if (bidsEnabled && !auctionDeadline) {
            setAlertMessage("Please select an auction deadline.");
            setAlertType("warning");
            setOpen(true);
            return;
          } else {
            formData.append("auction_deadline", formatDate(auctionDeadline));
          }
          if (!price) {
            setAlertMessage("Please enter a price.");
            setAlertType("warning");
            setOpen(true);
            return;
          } else {
            formData.append("price", Number(price));
          }
          break;
        case postType.DONATION:
          formData.append("donation_aim", donationAim);
          formData.append("min_donation", minDonation);
          break;
        case postType.BORROWING:
          if (borrowingDeadline) {
            formData.append("borrow_date", formatDate(borrowingDeadline));
          }
          break;
      }
      if (!alertMessage) {
        const response = await axios.post(`http://localhost:8000/posts/create?type=${type}`, formData, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
        return response;
      } else {
        /* return new Promise((resolve, reject) => {
          reject(new Error("Error creating post"));
        }
      ) */
        setOpen(true);
      }
    };

    await createPost()
      .catch((error) => {
        if (error.response.status === 400 || error.response.status === 422) {
          setAlertMessage("An error occured. Please try again later.");
          setAlertType("error");
          setOpen(true);
        } else {
          setAlertMessage(error.response.data.detail + ".");
          setAlertType("error");
          setOpen(true);
        }
      });

    if (image) {
      URL.revokeObjectURL(image.preview);
    }
    setImage(null);
    setAttachingImage(false);
    setContent("");
    setLFChoice("lost");
    setLFDate(null);
    setAuctionDeadline(null);
    setPrice("");
    setBidsEnabled(false);
    setMinDonation("");
    setDonationAim("");
    setBorrowingDeadline(null);

    getPosts();
  };

  useEffect(() => {
    // To avoid memory leaks, will run on unmount
    if (image) {
      return () => URL.revokeObjectURL(image.preview);
    }
  });

  const handleSelectingType = (e) => {
    setType(e.target.value);
  };

  return (
    <Box className="wrapper">
      <Box className="flex-centered" gap="1.5rem">
        <Avatar src={profileImgURL === "http://localhost:8000/null" ? undefined : profileImgURL} />
        <InputBase
          placeholder="What's happening"
          onChange={(c) => setContent(c.target.value)}
          value={content}
          sx={{
            width: "100%",
            backgroundColor: theme.palette.background.default,
            border: `0.1rem solid ${theme.palette.neutral.main}`,
            borderRadius: "2rem",
            padding: "1rem 2rem",
            "&:hover": { borderColor: `${theme.palette.primary.main}` },
            "&.Mui-focused": { borderColor: `${theme.palette.primary.main}` }
          }}
        />
        <FormControl sx={{ width: "20rem", margin: "1rem" }}>
          <InputLabel>
            Post type
          </InputLabel>
          <Select
            value={type}
            label="Post type"
            onChange={handleSelectingType}
            MenuProps={{
              PaperProps: {
                sx: {
                  backgroundColor: `${theme.palette.background.default}`,
                  "& .MuiMenuItem-root": { padding: "1rem" }
                }
              }
            }}
            sx={{
              ".MuiOutlinedInput-notchedOutline": {
                borderColor: `${theme.palette.neutral.dark}`
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: `${theme.palette.primary.main}`
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: `${theme.palette.primary.main}`
              }
            }}
          >
            <MenuItem value={postType.LOSTFOUND}>Lost & Found</MenuItem>
            <MenuItem value={postType.SECONDHANDSALES}>Secondhand Sales</MenuItem>
            <MenuItem value={postType.DONATION}>Donation</MenuItem>
            <MenuItem value={postType.BORROWING}>Borrowing</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {attachingImage && (
        <Box
          border={`1px solid ${theme.palette.primary.main}`}
          borderRadius="5px"
          mt="1rem"
          p="1rem"
        >
          <Dropzone
            multiple={false}
            onDrop={(acceptedFiles) => {
              setImage(Object.assign(acceptedFiles[0], {
                  preview: URL.createObjectURL(acceptedFiles[0])
                }
              ));
            }}
          >
            {({ getRootProps, getInputProps }) => (
              <Box className="flex-centered">
                <div
                  style={{
                    border: `0.1rem dashed ${theme.palette.primary.main}`,
                    width: "100%",
                    padding: "1rem",
                    cursor: "pointer"
                  }}
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  {!image ? (
                    <Typography> Drop or Select an Image </Typography>
                  ) : (
                    <Box className="flex-centered" sx={{ flexWrap: "wrap", justifyContent: "center" }}>
                      <Box sx={{ display: "inline-flex", boxSizing: "border-box" }}>
                        <Box sx={{ display: "flex", overflow: "hidden" }}>
                          <img
                            src={image.preview}
                            style={{ display: "block", width: "100%", height: "100%" }}
                            alt="Uploaded photo"
                            // To avoid memory leaks
                            onLoad={() => {
                              URL.revokeObjectURL(image.preview);
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                </div>
                {image && (
                  <IconButton
                    onClick={() => {
                      // To avoid memory leaks
                      URL.revokeObjectURL(image.preview);
                      setImage(null);
                    }}
                    sx={{ marginLeft: "1rem" }}
                  >
                    <DeleteOutlined />
                  </IconButton>
                )}
              </Box>
            )}
          </Dropzone>
        </Box>
      )}

      {type === postType.LOSTFOUND ? (
        <Box className="wrapper" margin="1rem">
          <Box className="flex-centered" height="1rem">
            <RadioGroup
              row
              value={lFChoice}
              onChange={handleLFChoiceChange}
            >
              <FormControlLabel value="lost" control={<Radio />} label="Lost an item" />
              <FormControlLabel value="found" control={<Radio />} label="Found an item" />
            </RadioGroup>
            <Box sx={{ display: "flex", alignItems: "center" }} height="1rem">
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
                <DatePicker
                  slotProps={{
                    field: { clearable: true },
                  }}
                  value={lFDate}
                  label={(lFChoice == "lost" ? "Lost" : "Found") + " date:"}
                  disableFuture={true}
                  onChange={(newDate) => setLFDate(newDate)}
                />
              </LocalizationProvider>
            </Box>
          </Box>
        </Box>
      ) : type === postType.SECONDHANDSALES ? (
        <Box className="wrapper" margin="1rem">
          <Box className="flex-centered" height="1rem">
            <StyledTextField
              label="Price"
              type="number"
              value={price}
              sx={{
                maxWidth: "12rem"
              }}
              onChange={(event) => {
                setPrice(event.target.value);
              }}
            />
            {bidsEnabled &&
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
                  <DatePicker
                    slotProps={{
                      field: { clearable: true },
                    }}
                    value={auctionDeadline}
                    label="Auction deadline"
                    disablePast={true}
                    onChange={(newAuctionDeadline) => setAuctionDeadline(newAuctionDeadline)}
                  />
                </LocalizationProvider>
              </Box>
            }
            <FormControlLabel
              control={<Checkbox />}
              label="Bids enabled"
              labelPlacement="start"
              checked={bidsEnabled}
              onChange={(event) => setBidsEnabled(event.target.checked)}
            />
          </Box>
        </Box>
      ) : type === postType.DONATION ? (
        <Box className="wrapper" margin="1rem">
          <Box sx={{ display: "flex", alignItems: "center" }} height="1rem">
            <StyledTextField
              label="Minimum donatable amount"
              type="number"
              sx={{ marginRight: "1rem" }}
              value={minDonation}
              onChange={(event) => {
                setMinDonation(event.target.value);
              }}
            />
            <StyledTextField
              label="Donation aim"
              type="number"
              variant="outlined"
              value={donationAim}
              onChange={(event) => {
                setDonationAim(event.target.value);
              }}
            />
          </Box>
        </Box>
      ) : type === postType.BORROWING ? (
        <Box className="wrapper" margin="1rem">
          <Box sx={{ display: "flex", alignItems: "center" }} height="1rem">
            <Typography marginRight="1rem">
              Borrowed until:
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
              <DatePicker
                slotProps={{
                  field: { clearable: true },
                }}
                value={borrowingDeadline}
                label="Borrowed until"
                disablePast={true}
                onChange={(newBorrowingDeadline) => setBorrowingDeadline(newBorrowingDeadline)}
              />
            </LocalizationProvider>
          </Box>
        </Box>
      ) : (
        <div></div>
      )}

      <StyledDivider sx={{ margin: "2rem 0" }} />

      <Box className="flex-centered">
        <Box
          className="flex-centered"
          gap="0.25rem"
          onClick={() => setAttachingImage(!attachingImage)}
        >
          <ImageOutlined />
          <Typography
            sx={{ "&:hover": { cursor: "pointer" } }}
          >
            Image
          </Typography>
        </Box>
        <StyledButton
          className="post-btn"
          variant="contained"
          disabled={!content}
          onClick={handlePost}
          sx={{
            borderRadius: "3rem",
            minWidth: "6rem",
            padding: "0.5rem 1rem"
          }}
        >
          POST
        </StyledButton>
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
        <Alert
          variant="filled"
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
          {<strong>{alertMessage}</strong>}
        </Alert>
      </Snackbar>
    </Box>
  );
}
