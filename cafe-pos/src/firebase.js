// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAONEyCS_XsXcLz9kpRu-KvY8qhVOjwSAk",
  authDomain: "cafe-pos-app-76e9d.firebaseapp.com",
  projectId: "cafe-pos-app-76e9d",
  storageBucket: "cafe-pos-app-76e9d.firebasestorage.app",
  messagingSenderId: "97669354154",
  appId: "1:97669354154:web:c435258a138193d92e36d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);