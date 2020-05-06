const functions = require("firebase-functions"); // importing
const app = require("express")(); // importing express
const { db } = require("./util/admin");
const {
  getAllTweets,
  postTweet,
  getTweet,
  postComment,
  likeTweet,
  unlikeTweet,
  deleteTweet,
} = require("./handlers/tweets");
const {
  signup,
  login,
  uploadImage,
  addProfileDetails,
  getUserData,
  getUserDetails,
  markNotificationsRead,
} = require("./handlers/users");
const FBAuth = require("./util/FBAuth");

//tweets route
app.get("/tweets", getAllTweets);
app.post("/tweet", FBAuth, postTweet);
app.get("/tweet/:tweetId", getTweet);
app.post("/tweet/:tweetId/comment", FBAuth, postComment);
app.get("/tweet/:tweetId/like", FBAuth, likeTweet);
app.get("/tweet/:tweetId/unlike", FBAuth, unlikeTweet);
app.get("/tweet/:tweetId/delete", FBAuth, deleteTweet);
// users route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user/profile", FBAuth, addProfileDetails);
app.get("/user/profile", FBAuth, getUserData);
app.get("/user/:userName", getUserDetails);
app.post("/user/notifications", FBAuth, markNotificationsRead);
// API multiple routes
exports.api = functions.https.onRequest(app);
// create like notifications
exports.createNotificationOnLike = functions.firestore
  .document("likes/{id}")
  .onCreate((snapshot) => {
    return db
      .doc("/posts/" + snapshot.data().tweetId)
      .get()
      .then((doc) => {
        // check if the tweet is exists and the person who made the like is not the tweet owner
        if (doc.exists && doc.data().userName !== snapshot.data().userName) {
          return db.doc("/notifications/" + snapshot.id).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userName,
            sender: snapshot.data().userName,
            isRead: false,
            type: "like",
            tweetId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });
// create comment notifications
exports.createNotificationOnComment = functions.firestore
  .document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc("/posts/" + snapshot.data().tweetId)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().userName !== snapshot.data().userName) {
          return db.doc("/notifications/" + snapshot.id).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userName,
            sender: snapshot.data().userName,
            isRead: false,
            type: "comment",
            tweetId: doc.id,
          });
        }
      })
      .catch((err) => console.error(err));
  });
// delete the created like notification when that person unlikes thia tweet
exports.deleteNotificationOnUnLike = functions.firestore
  .document("likes/{id}")
  .onDelete((snapshot) => {
    return db
      .doc("/notifications/" + snapshot.id)
      .delete()
      .catch((err) => console.error(err));
  });
// db trigger to update user image in all tweets once he uploaded a new one
exports.onUserImageChange = functions.firestore
  .document("users/{userId}")
  .onUpdate((change) => {
    // make sure that the image url is the one is changed
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      const batch = db.batch();
      return db
        .collection("posts")
        .where("userName", "==", change.before.data().userName)
        .get()
        .then((docs) => {
          docs.forEach((doc) => {
            const tweet = db.doc("/posts/" + doc.id);
            batch.update(tweet, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    }
  });
// delete the likes , comments and notifications of a tweet once it's deleted
exports.onTweetDeleted = functions.firestore
  .document("posts/{tweetId}")
  .onDelete((snapshot, context) => {
    const tweetId = context.params.tweetId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("tweetId", "==", tweetId)
      .get()
      .then((docs) => {
        docs.forEach((doc) => {
          batch.delete(db.doc("/comments/" + doc.id));
        });
        return db
          .collection("likes")
          .where("tweetId", "==", tweetId)
          .get()
          .then((docs) => {
            docs.forEach((doc) => {
              batch.delete(db.doc("/likes/" + doc.id));
            });
            return db
              .collection("notifications")
              .where("tweetId", "==", tweetId)
              .get()
              .then((docs) => {
                docs.forEach((doc) => {
                  batch.delete(db.doc("/notifications/" + doc.id));
                });
                return batch.commit();
              });
          });
      })
      .catch((err) => {
        console.error(err);
      });
  });
