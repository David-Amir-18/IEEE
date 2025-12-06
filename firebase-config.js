// Firebase Configuration
// You'll need to replace these values with your actual Firebase project credentials

const firebaseConfig = {
    apiKey: "AIzaSyD5mtM4ZZxZ1Vx-J4tQeiPiQ3AMT4USMNk",
    authDomain: "ieee-404a2.firebaseapp.com",
    databaseURL: "https://ieee-404a2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "ieee-404a2",
    storageBucket: "ieee-404a2.firebasestorage.app",
    messagingSenderId: "881119364016",
    appId: "1:881119364016:web:6e6813b6e4b366e0130c75",
    measurementId: "G-J04BCNJPGW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database
const database = firebase.database();
const interviewRef = database.ref('interviews');
