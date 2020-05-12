import React, { Component } from "react";
import Grid from "@material-ui/core/Grid";
import axios from "axios";
import Tweet from "../components/Tweet";
class home extends Component {
  state = {
    tweets: null,
  };
  componentDidMount() {
    axios
      .get("/tweets")
      .then((res) => {
        this.setState({
          tweets: res.data,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
  render() {
    let recentTweets = this.state.tweets ? (
      this.state.tweets.map((tweet) => (
        <Tweet key={tweet.tweetId} tweet={tweet} />
      ))
    ) : (
      <p>Loading ....</p>
    );
    return (
      <Grid container spacing={2}>
        <Grid item sm={8} xs={12}>
          {recentTweets}
        </Grid>
        <Grid item sm={4} xs={12}>
          <p>profile</p>
        </Grid>
      </Grid>
    );
  }
}
export default home;
