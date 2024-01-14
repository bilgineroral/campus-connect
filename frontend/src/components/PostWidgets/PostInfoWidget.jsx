import { Box, Typography } from "@mui/material";
import { colors } from "../ThemeEngine/Themes.jsx";
import axios from "axios";
import StyledButton from "../StyledButton.jsx";
import { useEffect, useState } from "react";
import StyledTextField from "../StyledTextField.jsx";

const parseDate = (datestr) => {
  let date = new Date(datestr);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  let month = monthNames[date.getMonth()];
  let year = date.getFullYear();
  let day = date.getDate();
  return `${day} ${month} ${year}`;
};

function InfoFlair({ content, post, ...props }) {
  return (
    <Typography
      align="center"
      sx={{
        backgroundColor: colors[post.post_type],
        borderRadius: "0.5rem",
        padding: "0.1rem 1rem 0.1rem 1rem",
        fontWeight: "700",
        marginRight: "1rem",
      }}
      {...props}
    >
      {content}
    </Typography>
  );
}

export default function PostInfoWidget({ post }) {
  let component;
  const token = localStorage.getItem("token");
  const uid = +localStorage.getItem("uid");

  const [enteringBid, setEnteringBid] = useState(false);
  const [newBid, setNewBid] = useState();

  let highestBid;
  if (post.bids?.length > 0) {
    highestBid = post.bids[0]
  }
  let latestOwnBid;

  useEffect(() => {
    if (post.bids_enabled) {
      fetchBids();
    }
  }, []);

  const fetchBids = () => {
    const getBids = async () => {
      const response = await axios.get(`http://localhost:8000/posts/${post.post_id}/bids`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        }
      });
      return response;
    };

    getBids()
      .then((response) => {
        post.bids = response.data;
        highestBid = post.bids[0];
      })
      .catch((error) => console.error(error));
  };

  const sendBid = async () => {
    let response;
    if (latestOwnBid > 0) {
      response = await axios.put(`http://localhost:8000/posts/${post.post_id}/bids`, {
        "bid_amount": newBid
      }, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
    } else {
      response = await axios.post(`http://localhost:8000/posts/${post.post_id}/bids`, {
        "bid_amount": newBid
      }, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });
    }
    return response;
  };

  const handleBidding = () => {
    setEnteringBid(false);
    sendBid()
      .catch((error) => console.error(error));
    fetchBids();
  };

  const getLatestOwnBid = () => {
    latestOwnBid = -1;
    for (let bid of post.bids) {
      if (bid.user.user_id === uid) {
        latestOwnBid = bid.bid_amount;
        break;
      }
    }
    return latestOwnBid;
  };

  switch (post.post_type) {
    case "LostFound":
      component = (
        <Box sx={{ display: "flex" }}>
          <InfoFlair
            content={post.lost_item ? "Lost Date:" : "Found Date:"}
            post={post}
          />
          <Typography>
            {parseDate(post.lf_date)}
          </Typography>
        </Box>
      );
      break;
    case "Secondhand Sales":
      component = (
        <Box sx={{ display: "flex", flexDirection: "column", rowGap: "0.4rem" }}>
          <Box sx={{ display: "flex" }}>
            <InfoFlair
              content="Price:"
              post={post}
            />
            <Typography>
              {post.price}
            </Typography>
          </Box>
          {
            post.bids_enabled ? (
              <>
                <Box sx={{ display: "flex" }}>
                  <InfoFlair
                    content="Bids are enabled"
                    post={post}
                  />
                  <Box sx={{ display: "flex" }}>
                    <InfoFlair
                      content="Auction ends at:"
                      post={post}
                    />
                    <Typography>
                      {parseDate(post.auction_deadline)}
                    </Typography>
                  </Box>
                </Box>
                {
                  post.bids.length > 0 ? (
                    <Box sx={{ display: "flex" }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <InfoFlair
                          content="Highest bid:"
                          post={post}
                        />
                        <Typography>
                          {highestBid.bid_amount} by&nbsp;
                        </Typography>
                        <Typography fontWeight={700}>
                          {highestBid.user.nickname}
                        </Typography>
                      </Box>
                      {post.author.user_id !== uid && (
                        <Box sx={{ display: "flex", marginLeft: "1rem", alignItems: "center" }}>
                          {enteringBid ? (
                            <>
                              <StyledTextField
                                label="Enter bid"
                                onChange={(event) => setNewBid(event.target.value)}
                                type="number"
                                size="small"
                                sx={{
                                  width: "8rem",
                                }}
                              />
                              <StyledButton
                                onClick={handleBidding}
                                sx={{
                                  padding: "0.1rem 1rem 0.1rem 1rem",
                                  minWidth: "2rem",
                                  marginLeft: "1rem",
                                  backgroundColor: `${colors.green}`,
                                  "&:hover": {
                                    backgroundColor: `${colors.lighterGreen}`
                                  },
                                }}
                              >
                                Submit
                              </StyledButton>
                            </>
                          ) : (
                            <>
                              <InfoFlair
                                content="Your last bid:"
                                post={post}
                              />
                              <Typography>
                                {getLatestOwnBid() > 0 ? latestOwnBid : "None"}
                              </Typography>
                              <StyledButton
                                onClick={() => setEnteringBid(true)}
                                sx={{
                                  padding: "0.1rem 1rem 0.1rem 1rem",
                                  minWidth: "2rem",
                                  marginLeft: "1rem",
                                  backgroundColor: `${colors.green}`,
                                  "&:hover": {
                                    backgroundColor: `${colors.lighterGreen}`
                                  },
                                }}
                              >
                                {latestOwnBid > 0 ? "Update bid" : "Make bid"}
                              </StyledButton>
                            </>
                          )}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <InfoFlair
                      content="No bids yet!"
                      post={post}
                      maxWidth="10rem"
                    />
                  )}
              </>
            ) : (<></>)
          }
        </Box>
      );
      break;
    case "Donation":
      component = (
        <Box sx={{ display: "flex", flexDirection: "column", rowGap: "0.4rem" }}>
          {post.donation_aim ? (
              <Box sx={{ display: "flex" }}>
                <InfoFlair
                  content="Donation Aim:"
                  post={post}
                />
                <Typography>
                  {post.donation_aim}
                </Typography>
              </Box>
            ) : (<></>)
          }
          {
            post.min_donation ? (
              <Box sx={{ display: "flex" }}>
                <InfoFlair
                  content="Minimum Donation:"
                  post={post}
                />
                <Typography>
                  {post.min_donation}
                </Typography>
              </Box>
            ) : (<></>)
          }
        </Box>
      );
      break;
    case "Borrowing":
      component = (post.borrow_date &&
        <Box sx={{ display: "flex" }}>
          <InfoFlair
            content="To be borrowed until:"
            post={post}
          />
          <Typography>
            {parseDate(post.borrow_date)}
          </Typography>
        </Box>
      );
      break;
    default:
      component = (
        <></>
      );
      break;
  }

  return component;
}
