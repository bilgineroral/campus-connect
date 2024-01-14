import axios from "axios";
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import CreatePost from "../../components/PostWidgets/CreatePost.jsx";
import PostsView from "../../components/PostsView/PostsView.jsx";

export default function Homepage() {
  const [posts, setPosts] = useState([]);
  const token = localStorage.getItem("token");

  const getPosts = () => {

    function getCookie(cookieName) {
      const name = cookieName + "=";
      const decodedCookie = decodeURIComponent(document.cookie);
      const cookieArray = decodedCookie.split(';');

      for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
        }
        if (cookie.indexOf(name) === 0) {
          return cookie.substring(name.length, cookie.length);
        }
      }
      return null;
    }

    const getPostsCall = async () => {
      const preferencesCookie = getCookie("preferences");
      const resolvedCookie = preferencesCookie;
      // Parse the JSON content
      let preferences;
      try {
        preferences = JSON.parse(preferencesCookie);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
      const response = await axios.post("http://localhost:8000/home", {
        filters: preferences.filters,
        resolved: preferences.showResolved,
      }, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    };

    getPostsCall()
      .then((response) => {setPosts(response.data)})
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <Box className="wrapper">
      <Box display="flex" columnGap="1.5rem">
        <Box sx={{ justifyContent: "center" }}>
          <CreatePost getPosts={getPosts} />
          <PostsView posts={posts} setPosts={setPosts} />
        </Box>
      </Box>
    </Box>
  );
}
