import { useEffect, useState } from "react";
import axios from "axios";
import { Box, IconButton, Modal, Paper, Typography, useTheme } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import StyledTextField from "../../components/StyledTextField.jsx";
import StyledButton from "../../components/StyledButton.jsx";
import dayjs from "dayjs";
import StyledSwitch from "../../components/StyledSwitch.jsx";
import Dropzone from "react-dropzone";
import { DeleteOutlined } from "@mui/icons-material";

export default function EditPost({open, handle, post}) {
  const theme = useTheme();
  const postId = post.post_id;

  const initialContent = post.content || "";
  const initialImage = post.post_image;
  const initialMinDonation = post.min_donation || "";
  const initialDonationAim = post.donation_aim || "";
  const initialPrice = post.price || "";
  const initialResolved = post.resolved;

  const [editedContent, setEditedContent] = useState(initialContent);
  const [editedImage, setEditedImage] = useState(initialImage);
  const [editedMinDonation, setEditedMinDonation] = useState(initialMinDonation);
  const [editedDonationAim, setEditedDonationAim] = useState(initialDonationAim);
  const [editedPrice, setEditedPrice] = useState(initialPrice);
  const [date, setDate] = useState(null);
  const [editedResolved, setEditedResolved] = useState(initialResolved);
  const token = localStorage.getItem("token");


  const formatDate = (pref_date) => {
    let date = new Date(pref_date);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  useEffect(() => {
    // To avoid memory leaks, will run on unmount
    if (editedImage) {
      return () => URL.revokeObjectURL(editedImage.preview);
    }
  });

  const handleEditSubmit = async () => {
    let deleteImage = false;
    if (initialImage && !editedImage) {
      deleteImage = true;
    }
    const formData = new FormData();

    formData.append("content", editedContent);
    if (editedImage && initialImage !== editedImage) {
      formData.append("file", editedImage);
    }
    formData.append("delete_image", deleteImage);
    formData.append("resolved", editedResolved);

    switch (post.post_type) {
      case "LostFound":
        const editedLFDate = formatDate(date);
        formData.append("lf_date", editedLFDate);
        break;

      case "Donation":
        formData.append("min_donation", editedMinDonation);
        formData.append("donation_aim", editedDonationAim);
        break;

      case "Borrowing":
        const editedBorrowingDate = formatDate(date);
        formData.append("borrow_date", editedBorrowingDate);
        break;

      case "Secondhand Sales":
        const editedAuctionDeadline = formatDate(date);
        formData.append("auction_deadline", editedAuctionDeadline);
        formData.append("price", editedPrice);
        break;

      default:
        break;
    }

    await axios.put(`http://localhost:8000/posts/${postId}`, formData, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      }
    }).catch((error) => {
      console.error(error);
    });
    handle(false);
    window.location.reload();
  };

  const handleCancel = () => {
    setEditedContent(initialContent);
    setEditedImage(initialImage);
    setEditedMinDonation(initialMinDonation);
    setEditedDonationAim(initialDonationAim);
    setEditedPrice(initialPrice);
    setEditedResolved(initialResolved);
    handle(false);
  };

  return (
    <Modal open={open} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Paper elevation={10} sx={{ padding: "2rem", width: "62rem", height: "37rem", position: "relative" }}>
        <Typography variant="h5" align="center">
          Edit Post
        </Typography>
        <Box display="flex" margin="2rem 0 2rem 0" columnGap="2rem" height="24rem">
          <Box sx={{ display: "flex", flex: 1, flexDirection: "column", rowGap: "2rem" }}>
            <StyledTextField
              multiline
              fullWidth
              rows={4}
              label="Edit Content"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
            {post.post_type === "LostFound" && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography marginRight="1rem">
                  {post.lost_item ? "Lost" : "Found"} date:
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
                  <DatePicker
                    value={dayjs(post.lf_date)}
                    onChange={(newDate) => setDate(newDate)} />
                </LocalizationProvider>
              </Box>
            )}
            {post.post_type === "Donation" && (
              <Box display="flex" flexDirection="column" rowGap="2rem">
                <StyledTextField
                  fullWidth
                  type="number"
                  label="Minimum Donation"
                  value={editedMinDonation}
                  onChange={(e) => setEditedMinDonation(e.target.value)}
                />
                <StyledTextField
                  fullWidth
                  type="number"
                  label="Donation Aim"
                  value={editedDonationAim}
                  onChange={(e) => setEditedDonationAim(e.target.value)}
                />
              </Box>
            )}
            {post.post_type === "Borrowing" && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography marginRight="1rem">
                  Borrowed until:
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
                  <DatePicker
                    value={dayjs(post.borrow_date)}
                    onChange={(newDate) => setDate(newDate)} />
                </LocalizationProvider>
              </Box>
            )}
            {post.post_type === "Secondhand Sales" && (
              <Box display="flex" flexDirection="column" rowGap="2rem">
                <StyledTextField
                  fullWidth
                  type="number"
                  label="Price"
                  value={editedPrice}
                  onChange={(e) => setEditedPrice(e.target.value)}
                />
                {post.bids_enabled &&
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography marginRight="1rem">
                      Auction deadline:
                    </Typography>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"en-gb"}>
                      <DatePicker
                        value={dayjs(post.auction_deadline)}
                        onChange={(newAuctionDeadline) => setDate(newAuctionDeadline)}
                      />
                    </LocalizationProvider>
                  </Box>
                }
              </Box>
            )}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography>
                Resolved:
              </Typography>
              <StyledSwitch
                checked={editedResolved}
                onChange={() => setEditedResolved(!editedResolved)}
              />
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flex: 1,
              border: `1px solid ${theme.palette.primary.main}`,
              borderRadius: "5px",
              padding: "1rem",
            }}
          >
            <Dropzone
              multiple={false}
              onDrop={(acceptedFiles) => {
                setEditedImage(Object.assign(acceptedFiles[0], {
                    preview: URL.createObjectURL(acceptedFiles[0])
                  }
                ));
              }}
            >
              {({ getRootProps, getInputProps }) => (
                <Box className="flex-centered" width="100%">
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
                    {!editedImage ? (
                      <Typography> Drop or Select an Image </Typography>
                    ) : (
                      <Box className="flex-centered" sx={{ flexWrap: "wrap", justifyContent: "center" }}>
                        <Box sx={{ display: "inline-flex", boxSizing: "border-box" }}>
                          <Box sx={{ display: "flex", overflow: "hidden" }}>
                            <img
                              src={editedImage.preview || ("http://localhost:8000/" + editedImage)}
                              style={{
                                width: "100%",
                                maxWidth: "30rem",
                                height: "auto",
                                maxHeight: "18.5rem"
                              }}
                              alt="Uploaded photo"
                              // To avoid memory leaks
                              onLoad={() => {
                                URL.revokeObjectURL(editedImage.preview);
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </div>
                  {editedImage && (
                    <IconButton
                      onClick={() => {
                        // To avoid memory leaks
                        URL.revokeObjectURL(editedImage.preview);
                        setEditedImage(null);
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
        </Box>
        <Box mt="2rem" display="flex" sx={{ position: "absolute", bottom: "2rem", justifyContent: "space-between", width: "58rem" }}>
          <StyledButton
            onClick={handleEditSubmit}
          >
            Submit Edit
          </StyledButton>
          <StyledButton
            variant="error"
            onClick={handleCancel}
          >
            Cancel
          </StyledButton>
        </Box>
      </Paper>
    </Modal>
  );
}
