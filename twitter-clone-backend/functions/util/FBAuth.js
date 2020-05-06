const { admin, db } = require("../util/admin");
module.exports = (req, res, next) => {
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
      req.user.imageUrl = data.docs[0].data().imageUrl;
      return next();
    })
    .catch((error) => {
      return res.status(403).json(error);
    });
};
