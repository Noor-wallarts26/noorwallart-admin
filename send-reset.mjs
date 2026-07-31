import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBE3Xg8m_rJOPmBPhml7se7JOu-vCqUZPw",
  authDomain: "amezeshop.firebaseapp.com",
  projectId: "amezeshop",
  storageBucket: "amezeshop.firebasestorage.app",
  messagingSenderId: "726965398711",
  appId: "1:726965398711:web:5c03826a8f01c94c75f132",
  measurementId: "G-64N7J151K4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const resetEmail = "noorwallartsofficial@gmail.com";

sendPasswordResetEmail(auth, resetEmail)
  .then(() => {
    console.log("SUCCESS: Password reset email sent to " + resetEmail);
    process.exit(0);
  })
  .catch((error) => {
    console.error("ERROR:", error.code, error.message);
    process.exit(1);
  });
