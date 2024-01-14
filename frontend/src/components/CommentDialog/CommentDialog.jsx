import { useState } from "react";
import {
  Avatar,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Box
} from "@mui/material";
import axios from "axios";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import StyledTextField from "../StyledTextField.jsx";
import StyledButton from "../StyledButton.jsx";
import { Delete, Flag, ModeEditOutline } from "@mui/icons-material";

export default function CommentDialog({ postId, open, onClose, setCommentNum, postComments, setPostComments }) {

  const [newComment, setNewComment] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedComment, setEditedComment] = useState("");

  const token = localStorage.getItem("token");
  const uid = +localStorage.getItem("uid");

  const fetchComments = async () => {
    const response = await axios.get(`http://localhost:8000/posts/${postId}/comments`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  };

  const handleCommentSubmit = () => {
    const formData = new FormData();
    formData.append("content", newComment);
    const postComment = async () => {
      const response = await axios.post(`http://localhost:8000/posts/${postId}`, formData, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    };

    postComment()
      .then(() => {
        setNewComment("");
      })
      .then(fetchComments)
      .then((response) => {
        setPostComments(response.data);
        setCommentNum(response.data.length);
      })
      .catch((error) => console.error(error));
  };

  const handleEllipsisClick = (event, comment) => {
    setAnchorEl(event.currentTarget);
    setSelectedComment(comment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };

  const handleDelete = () => {

    axios.delete(`http://localhost:8000/comments/${selectedComment.comment_id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      }
    })
      .then((response) => {
        fetchComments()
          .then((response) => setPostComments(response.data))
          .catch((error) => console.error(error));
        setCommentNum((prev) => prev - 1);
      });
    handleMenuClose();
  };

  const handleEdit = () => {
    setEditedComment(selectedComment.content);
    setEditDialogOpen(true);
  };

  const handleEditDialogSubmit = () => {
    // Implement the logic to submit the edited comment to the backend
    // Update the 'comments' state with the edited comment
    // Example: editComment(selectedComment.id, editedComment).then(data => {
    //   setComments(comments.map(comment => (comment.id === selectedComment.id ? data : comment)));
    //   setEditDialogOpen(false);
    // });
    console.log(selectedComment);
    const formData = new FormData();
    formData.append("content", editedComment)
    axios.put(`http://localhost:8000/comments/${selectedComment.comment_id}`, formData, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      }
    })
      .then((response) => {
        fetchComments()
          .then((response) => setPostComments(response.data))
          .catch((error) => console.error(error));
      })
      .catch((error) => {
        console.error("Error submitting comment: ", error);
      });
    setEditDialogOpen(false);
    handleMenuClose();
  };

  const handleEditDialogCancel = () => {
    // Close the edit dialog without saving changes
    setEditDialogOpen(false);
  };


  const handleReport = () => {
    // Implement report logic
    // Example: reportComment(selectedComment.id).then(() => {
    //   // Handle report success
    //   handleMenuClose();
    // });
    handleMenuClose();
  };

  return (
    <Box>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Comments</DialogTitle>
        <DialogContent>
          <List sx={{ minWidth: "25vw", maxHeight: "60vh", overflow: "auto" }}>
            {/* Display existing comments */}
            {postComments.map(comment => (
              <ListItem key={comment.comment_id}>
                <ListItemAvatar>
                  <Avatar
                    src={comment.author.profile_image ? "http://localhost:8000/" + comment.author.profile_image : undefined}
                    alt={comment.author.nickname}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography variant="body1" component="span" style={{ fontWeight: 'bold' }}>
                    {comment.author.nickname}
                  </Typography>}
                  secondary={<Typography style={{ wordWrap: 'break-word' }}>{comment.content}</Typography>}
                />
                {/*
                  Render the ellipsis icon only for the owner of the comment
                  (Replace the condition based on your user authentication logic)
                */}
                {(
                  <IconButton onClick={(event) => handleEllipsisClick(event, comment)}>
                    <MoreVertIcon />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
          {/* Add a new comment */}
          <div style={{ display: "flex", flexDirection: "column", marginTop: "1rem" }}>
            <StyledTextField
              fullWidth
              multiline
              rows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ marginBottom: "0.5rem" }}
            />
            <StyledButton
              disabled={!newComment}
              onClick={handleCommentSubmit}
            >
              Add Comment
            </StyledButton>
          </div>

          {/* Menu for ellipsis options */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {selectedComment && selectedComment.author.user_id === uid ? (
              <div>
                <MenuItem onClick={handleEdit}>
                  <ModeEditOutline />
                  Edit
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                  <Delete />
                  Delete
                </MenuItem>
              </div>
            ) : (
              <MenuItem onClick={handleReport}>
                <Flag />
                Report
              </MenuItem>
            )}
          </Menu>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Comment</DialogTitle>
        <DialogContent>
          <StyledTextField
            fullWidth
            multiline
            rows={3}
            value={editedComment}
            onChange={(e) => setEditedComment(e.target.value)}
            style={{ marginBottom: "1rem" }}
          />
          <StyledButton onClick={handleEditDialogSubmit}>
            Submit
          </StyledButton>
          <StyledButton variant="error" onClick={handleEditDialogCancel} style={{ marginLeft: "0.5rem" }}>
            Cancel
          </StyledButton>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
