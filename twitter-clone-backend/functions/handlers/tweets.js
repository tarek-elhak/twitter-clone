const { db } = require("../util/admin");
const { isEmpty } = require("../util/validators");
// get all tweets handler function
exports.getAllTweets = (req, res) => {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let posts = [];
      data.forEach((doc) => {
        posts.push({
          tweetId: doc.id,
          userName: doc.data().userName,
          content: doc.data().content,
          createdAt: doc.data().createdAt,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          userImage: doc.data().userImage,
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
    userName: req.user.userName,
    content: req.body.content,
    createdAt: new Date().toISOString(),
    userImage: req.user.imageUrl,
    likeCount: 0,
    commentCount: 0,
  };
  db.collection("posts")
    .add(newTweet)
    .then((doc) => {
      const resTweet = newTweet;
      resTweet.tweetId = doc.id;
      res.json(resTweet);
    })
    .catch(function (err) {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};
// get a tweet handler function
exports.getTweet = (req, res) => {
  let tweetData = {};
  db.doc("/posts/" + req.params.tweetId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "tweet not found" });
      }
      tweetData = doc.data();
      tweetData.tweetId = doc.id;
      return db
        .collection("comments")
        .where("tweetId", "==", tweetData.tweetId)
        .orderBy("createdAt", "desc")
        .get();
    })
    .then((docs) => {
      tweetData.comments = [];
      docs.forEach((doc) => {
        tweetData.comments.push(doc.data());
      });
      return res.json(tweetData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
// post a comment handler function
exports.postComment = (req, res) => {
  if (isEmpty(req.body.content.trim()))
    return res.status(400).json({ comment: "Must not be empty" });
  const comment = {
    content: req.body.content,
    createdAt: new Date().toISOString(),
    tweetId: req.params.tweetId,
    userName: req.user.userName,
    userImage: req.user.imageUrl,
  };
  db.doc("/posts/" + req.params.tweetId)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "this tweet is no longer exist" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(comment);
    })
    .then(() => {
      res.json(comment);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: "something went wrong" });
    });
};
// like a tweet handler function
exports.likeTweet = (req, res) => {
  // check if the tweet is already exists or not
  const tweetDocument = db.doc("/posts/" + req.params.tweetId);
  const likeDocument = db
    .collection("likes")
    .where("userName", "==", req.user.userName)
    .where("tweetId", "==", req.params.tweetId)
    .limit(1);
  let tweetData;
  tweetDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        // get tweet data
        tweetData = doc.data();
        tweetData.tweetId = doc.id;
        // check if the user already liked this tweet or not
        return likeDocument.get();
      } else {
        return res
          .status(404)
          .json({ Error: "sorry , this tweet is no longer exist" });
      }
    })
    .then((data) => {
      if (data.empty) {
        // this means that this user didn't like this tweet before
        // create like document
        return db
          .collection("likes")
          .add({
            tweetId: req.params.tweetId,
            userName: req.user.userName,
          })
          .then(() => {
            tweetData.likeCount++;
            return tweetDocument.update({ likeCount: tweetData.likeCount });
          })
          .then(() => {
            return res.json(tweetData);
          });
      } else {
        return res.status(400).json({ error: "tweet is already liked" });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// unlike a tweet handler function
exports.unlikeTweet = (req, res) => {
  // check if the tweet is already exists or not
  const tweetDocument = db.doc("/posts/" + req.params.tweetId);
  const likeDocument = db
    .collection("likes")
    .where("userName", "==", req.user.userName)
    .where("tweetId", "==", req.params.tweetId)
    .limit(1);
  let tweetData;
  tweetDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        // get tweet data
        tweetData = doc.data();
        tweetData.tweetId = doc.id;
        // check if the user already liked this tweet or not
        return likeDocument.get();
      } else {
        return res
          .status(404)
          .json({ Error: "sorry , this tweet is no longer exist" });
      }
    })
    .then((data) => {
      if (data.empty) {
        // this means that this user already unlikes this tweet
        return res.status(400).json({ error: "tweet is already unliked" });
      } else {
        // this means that this user is already liked this tweet so he can unlike it
        // delete the like entry and decrease the likeCount by 1
        return db
          .doc("/likes/" + data.docs[0].id)
          .delete()
          .then(() => {
            if (tweetData.likeCount !== 0) {
              tweetData.likeCount--;
            }
            return tweetDocument.update({ likeCount: tweetData.likeCount });
          })
          .then(() => {
            return res.json(tweetData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// delete a tweet handler function
exports.deleteTweet = (req, res) => {
  const tweetDocument = db.doc("/posts/" + req.params.tweetId);
  // const commentDocuments = db
  //   .collection("comments")
  //   .where("tweetId", "==", req.params.tweetId);
  // check if the tweet is already exists or not
  tweetDocument
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res
          .status(404)
          .json({ error: "this tweet is already unexisted" });
      } // make sure that this user is the owner for this tweet
      if (req.user.userName !== doc.data().userName) {
        return res.status(403).json({ error: "unatherized" });
      } else {
        // TODO delete all likes for this tweet
        // TODO delete all comments for this tweet
        // delete this tweet
        return tweetDocument.delete();
      }
    })
    .then(() => {
      return res.json({ message: "tweet deleted successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
