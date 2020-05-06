const admin = require("firebase-admin"); // importing admin to use database - firestore
admin.initializeApp(); // initializing
exports.admin = admin;
exports.db = admin.firestore();
