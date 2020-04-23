const { admin, db } = require("../util/admin");
const { firebaseConfig } = require("../util/config");
const firebase = require("firebase"); // importing firebase
firebase.initializeApp(firebaseConfig); // initializing firebase
const { validateSignupData, validateLoginData } = require("../util/validators");
let token, userId;

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    userName: req.body.userName,
  };
  // data validation
  const { errors, valid } = validateSignupData(newUser);
  if (!valid) {
    return res.status(400).json(errors);
  }
  const blankAvatar = "blank-avatar.png";
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
        imageUrl:
          "https://firebasestorage.googleapis.com/v0/b/" +
          firebaseConfig.storageBucket +
          "/o/" +
          blankAvatar +
          "?alt=media",
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
};
exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  // data validation
  const { errors, valid } = validateLoginData(user);
  if (!valid) {
    return res.status(400).json(errors);
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
};
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy"); // import busboy package
  const path = require("path");
  const os = require("os");
  const fs = require("fs"); // import file system module
  let imageFileName;
  let imageToBeUploaded = {};
  // inistantiate busboy instance
  const busboy = new BusBoy({ headers: req.headers });
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName =
      Math.round(Math.random() * 1000000000) + "." + imageExtension;
    const imageFilePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { imageFilePath, mimetype };
    file.pipe(fs.createWriteStream(imageFilePath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.imageFilePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl =
          "https://firebasestorage.googleapis.com/v0/b/" +
          firebaseConfig.storageBucket +
          "/o/" +
          imageFileName +
          "?alt=media";
        return db.doc("/users/" + req.user.userName).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "the image uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
};
