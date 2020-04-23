const functions = require("firebase-functions"); // importing

const app = require("express")(); // importing express

const { getAllTweets, postTweet } = require("./handlers/tweets");
const { signup, login } = require("./handlers/users");
const FBAuth = require("./util/FBAuth");

//tweets route
app.get("/tweets", getAllTweets);
app.post("/tweet", FBAuth, postTweet);

// users route
app.post("/signup", signup);
app.post("/login", login);

exports.api = functions.https.onRequest(app);
