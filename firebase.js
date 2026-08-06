const admin = require('firebase-admin');
const path = require('path');

// Load the JSON service account key
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential ? admin.credential.cert(serviceAccount) : admin.cert(serviceAccount),
});

console.log('✅ Firebase Admin SDK initialized successfully');

module.exports = admin;
