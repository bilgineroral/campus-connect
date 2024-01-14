import DefaultPostCard from "../PostWidgets/DefaultPostCard.jsx";
import { useContext } from "react";
import { Box } from "@mui/material";
import SettingsContext from "../../pages/Settings/SettingsContext.jsx";

export default function PostsView({ isProfile = false, posts, setPosts }) {

  return (
    <Box>
      {posts.map(post => (
          <DefaultPostCard
            key={post.post_id}
            post={post}
            setPosts={setPosts}
          />
        )
      )}
    </Box>
  );

}
