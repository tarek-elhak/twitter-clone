const { db } = require("../util/admin");
const { isEmpty } = require("../util/validators");
exports.getAllTweets = (req, res) => {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let posts = [];
      data.forEach((doc) => {
        posts.push({
          id: doc.id,
          user: doc.data().user,
          content: doc.data().content,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(posts);
    })
    .catch((error) => console.error(error));
};
exports.postTweet = (req, res) => {
  // check if the tweet is empty or not
  if (isEmpty(req.body.content)) {
    return res.status(400).json({ content: "your tweet must not be empty" });
  }
  const newTweet = {
    user: req.user.userName,
    content: req.body.content,
    createdAt: new Date().toISOString(),
  };
  db.collection("posts")
    .add(newTweet)
    .then((doc) => {
      res.json({ message: "document " + doc.id + " is added successfully" });
    })
    .catch(function (err) {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};
