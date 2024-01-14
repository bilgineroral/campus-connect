import axios from "axios";
import {
  ChatBubbleOutlined,
  Delete,
  FavoriteOutlined,
  Flag,
  ModeEditOutline,
  MoreVertOutlined
} from "@mui/icons-material";
import { Avatar, Box, IconButton, Menu, MenuItem, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CommentDialog from "../CommentDialog/CommentDialog.jsx";
import { colors } from "../ThemeEngine/Themes.jsx";
import PostInfoWidget from "./PostInfoWidget.jsx";
import EditPost from "../../pages/EditPost/EditPost.jsx";

export default function DefaultPostCard({ post, setPosts }) {
  const [editPostOpen, setEditPostOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const navigate = useNavigate();

  const [opData, setOpData] = useState(null);
  const postID = post.post_id;
  const userID = post.author.user_id;
  const imgPath = post.post_image;
  const imgUrl = `http://localhost:8000/${imgPath}`;

  const token = localStorage.getItem("token");
  const uid = +localStorage.getItem("uid");

  const [anchor, setAnchor] = useState(null);
  const [likeNum, setLikeNum] = useState(0);
  const [commentNum, setCommentNum] = useState(0);
  const [liked, setLiked] = useState(false);

  const open = Boolean(anchor);

  useEffect(() => {
    setCommentNum(post.comments.length);
    setComments(post.comments);
    setLikeNum(post.no_likes);

    for (let like of post.likes) {
      if (like.user_id === uid) {
        setLiked(true);
        break;
      }
    }
    setOpData(post.author);
  }, []);

  const handleCommentButtonClick = () => {
    setCommentDialogOpen(true);
  };

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false);
  };

  const handleLike = () => {
    const postLike = async () => {
      let response;
      if (liked) {
        response = await axios.post(`http://localhost:8000/posts/${postID}/unlike`, {}, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
      } else {
        response = await axios.post(`http://localhost:8000/posts/${postID}/like`, {}, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
      }
      return response;
    };

    postLike()
      .then(() => {
        setLikeNum((prev) => liked ? (prev - 1) : (prev + 1));
        setLiked((prev) => !prev);
      })
      .catch((error) => console.error(error));
  };

  const handleClick = (event) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleEdit = () => {
    handleClose();
    setEditPostOpen(true);
  };

  const handleDelete = () => {
    handleClose();

    const deletePost = async () => {
      try {
        const deleteResponse = await axios.delete(`http://localhost:8000/posts/${postID}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        const refreshResponse = await axios.get("http://localhost:8000/home", {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        setPosts(refreshResponse.data);
      } catch (error) {
        console.error("error deleting post", error);
      }
    };

    deletePost();
  };

  return (
    <Box className="wrapper" margin="1rem 0">
      <Paper variant="outlined" sx={{ padding: "1rem" }}>
        <Box className="flex-centered" alignItems="start">
          <Box sx={{ display: "flex" }}>
            <Avatar
              alt="OP's profile photo"
              src={`${opData?.profile_image ? `http://localhost:8000/${opData.profile_image}` : null}`}
              sx={{ height: "4rem", width: "4rem" }}
            />
            <Box sx={{ marginLeft: "1rem" }}>
              <Typography align="left" fontWeight="bold">
                {opData?.nickname}
              </Typography>
              <Box className="flairs" sx={{ display: "flex", flexDirection: "row", columnGap: "0.5rem" }}>
                <Typography sx={{
                  backgroundColor: colors[post.post_type],
                  borderRadius: "0.5rem",
                  minWidth: "10rem",
                  padding: "0.1rem 0 0.1rem 0",
                  fontWeight: "600",
                }}>
                  {post.post_type === "LostFound" ? "Lost & Found" : post.post_type}
                </Typography>
                <Typography sx={{
                  backgroundColor: `${post.resolved ? colors.green : colors.red}`,
                  borderRadius: "0.5rem",
                  minWidth: "8rem",
                  padding: "0.1rem 0 0.1rem 0",
                  fontWeight: "600",
                }}>
                  {post.resolved ? "Resolved" : "Ongoing"}
                </Typography>
              </Box>
              <Box className="post-body" textAlign="left">
                <Typography sx={{ mt: "1rem", mb: "1rem", wordWrap: "break-word" }}>
                  {post.content}
                </Typography>
                <PostInfoWidget post={post} />
              </Box>
              {imgPath && (
                <Box mt="1.5rem">
                  <img
                    className="posted-picture"
                    alt="Post's picture"
                    src={imgUrl}
                    style={{
                      width: "100%",
                      maxWidth: "43.725rem",
                      height: "auto",
                      maxHeight: "43.725rem"
                    }} //a very ordinary value
                  />
                </Box>
              )}
            </Box>
          </Box>
          <IconButton onClick={handleClick}>
            <MoreVertOutlined className="icon" />
          </IconButton>
          <Menu
            anchorEl={anchor}
            open={open}
            onClose={handleClose}
          >
            <MenuItem onClick={handleEdit} sx={{ display: `${userID !== uid ? "none" : "flex"}` }}>
              <ModeEditOutline />
              Edit
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ display: `${(userID === uid ? "flex" : "none")}` }}>
              <Delete />
              Delete
            </MenuItem>
            <MenuItem onClick={handleClose} sx={{ display: `${(userID !== uid ? "flex" : "none")}` }}>
              <Flag />
              Report
            </MenuItem>
          </Menu>
        </Box>
        <Box className="flex-centered" mt="1rem">
          <Box className="flex-centered" gap="0.3rem">
            <IconButton onClick={handleLike}>
              <FavoriteOutlined className="icon" sx={{ fill: `${liked ? colors.red : ""}` }}/>
            </IconButton>
            <Typography>{likeNum}</Typography>
          </Box>
          <Box className="flex-centered" gap="0.3rem">
            <IconButton onClick={handleCommentButtonClick}>
              <ChatBubbleOutlined className="icon" />
            </IconButton>
            <CommentDialog
              postId={postID}
              open={commentDialogOpen}
              onClose={handleCommentDialogClose}
              setCommentNum={setCommentNum}
              setPostComments={setComments}
              postComments={comments}/>
            <Typography>{commentNum}</Typography>
          </Box>
        </Box>
      </Paper>
      <EditPost open={editPostOpen} handle={setEditPostOpen} post={post} />
    </Box>
  );
}
