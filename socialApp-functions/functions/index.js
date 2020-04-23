const functions = require("firebase-functions"); // importing
const admin = require("firebase-admin"); // importing admin to use database - firestore
admin.initializeApp(); // initializing
const app = require("express")(); // importing express
const firebase = require("firebase"); // importing firebase
const firebaseConfig = {
  apiKey: "AIzaSyBKWW87KMsv6X8U5WFVw5ytRb-DICwwEW0",
  authDomain: "socialapp-eb6e2.firebaseapp.com",
  databaseURL: "https://socialapp-eb6e2.firebaseio.com",
  projectId: "socialapp-eb6e2",
  storageBucket: "socialapp-eb6e2.appspot.com",
  messagingSenderId: "689588844104",
  appId: "1:689588844104:web:29649b85245404dec58a7d",
  measurementId: "G-W2RXEJZCB2",
};
firebase.initializeApp(firebaseConfig); // initializing firebase
const db = admin.firestore();
// fetch data from firestore
app.get("/tweets", (req, res) => {
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
});
// FBAuth middleware function
function FBAuth(req, res, next) {
  let idToken;
  if (
    req.headers.autherization &&
    req.headers.autherization.startsWith("Bearer ")
  ) {
    idToken = req.headers.autherization.split("Bearer ")[1];
  } else {
    return res.status(403).json({ error: "unautherized" });
  }
  // verify this token
  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.userName = data.docs[0].data().userName;
      return next();
    })
    .catch((error) => {
      return res.status(403).json(error);
    });
}
// Add Post Route
app.post("/tweet", FBAuth, (req, res) => {
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
});
// helper function for checking if a string is empty or not
function isEmpty(string) {
  if (string.trim() === "") {
    return true;
  } else {
    return false;
  }
}
//helper function to check if the email is a valid one or not
function isEmail(email) {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) {
    return true;
  } else {
    return false;
  }
}
// signup route
let token, userId;
app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
  };
  // data validation
  var errors = {};
  if (isEmpty(newUser.email)) {
    errors.email = "must not be empty !";
  } else if (!isEmail(newUser.email)) {
    errors.email = "must be a valid one !";
  }
  if (isEmpty(newUser.password)) {
    errors.password = "must not be empty !";
  }
  if (newUser.password !== newUser.confirmPassword) {
    errors.password = "passwords must match !";
  }
  if (isEmpty(newUser.userName)) {
    errors.userName = "must not be empty !";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  // saving the user in firestore collection and the authentication system
  db.doc("/users/" + newUser.userName)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({
          userName: "the username is already taken , pick another one",
        });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((tokenId) => {
      token = tokenId;
      const user = {
        userId,
        userName: newUser.userName,
        email: newUser.email,
        password: newUser.password,
        createdAt: new Date().toISOString(),
      };
      db.doc("/users/" + newUser.userName)
        .set(user)
        .then(() => {
          return res.status(201).json({ token });
        });
    })
    .catch((err) => {
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use " });
      } else {
        return res.status(500).json({ err });
      }
    });
});
// login route

app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  const errors = {};
  if (isEmpty(user.email)) {
    errors.email = "must not be empty !";
  }
  if (isEmpty(user.password)) {
    errors.password = "must not be empty !";
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        return res.status(403).json({ general: "wrong credentials !" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
});

exports.api = functions.https.onRequest(app);
