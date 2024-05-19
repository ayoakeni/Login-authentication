import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initializeFirestore, doc, setDoc, getDoc, serverTimestamp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBunVgeXF3xLLst1Dhi7sAx9yBCtnqK284",
  authDomain: "login-authentication-e4113.firebaseapp.com",
  projectId: "login-authentication-e4113",
  storageBucket: "login-authentication-e4113.appspot.com",
  messagingSenderId: "914208076072",
  appId: "1:914208076072:web:55bb0043e1b05c245da01d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = initializeFirestore(app, {
  useFetchStreams: false,
  cacheSizeBytes: -1 // Unlimiting the cache size
});

// Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const signupButton = document.getElementById('signupButton');
const googleContinueButton = document.getElementById('googleContinueButton');
const message = document.getElementById('message');
const eyeBox = document.getElementById('eye-box');
const eyeSlash = document.getElementById('eyeSlash');
const eye = document.getElementById('eye');
const userEmail = document.getElementById('userEmail');
const logoutButton = document.getElementById('logoutButton');
const errorAuth = document.getElementById('errorAuth');
const logIn = document.getElementById('logIn');
const logOut = document.getElementById('logOut');
const errBody = document.getElementById('errBody');

// Redirect Functions
function redirectToHomeIfLoggedIn(user) {
  if (user && window.location.pathname === '/login.html') {
    window.location.href = 'index.html';
  }
}

async function redirectToLoginIfNotLoggedIn(user) {
  const allowedPages = ['/login.html', '/signup.html']; 
  // if (!user && !allowedPages.includes(window.location.pathname)) {
  //   if (!sessionStorage.getItem('redirecting')) {
  //     sessionStorage.setItem('redirecting', 'true');
  //     window.location.href = 'login.html';
  //   }
  // } else {
  //   sessionStorage.removeItem('redirecting');
  // }
  if (!user && window.location.pathname === '/index.html') {
    window.location.href = 'login.html';
  }
  if (user && window.location.pathname === '/signup.html') {
    await signOut(auth);
    setTimeout(() => {
      showErrorMessage('Redirecting to log in...', '#28a745');
      // Redirect to login page after successful sign-out
      window.location.href = 'login.html';  
    }, 3000);
  }
}

// Authentication State
onAuthStateChanged(auth, async (user) => {
  redirectToHomeIfLoggedIn(user);
 await redirectToLoginIfNotLoggedIn(user);

  if (user) {
    console.log('Logged in');
    showLogInMessage('Login successful!', '#28a745');
    const userData = await fetchUserData(user.uid);
    if (userData) {
      if (userEmail) {
        userEmail.textContent = userData.email;
      }
    } else {
      if (userEmail) {
        userEmail.textContent = 'No User.';
      }
      showLogInMessage('Unable to fetch your data.', '#ff0000');
    }
  }
});

// Fetching Data
async function fetchUserData(userId) {
  const userDocRef = doc(db, 'users', userId);
  let userDoc;
  try {
    userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching user document:', error);
    // Retry fetching the document Data
    setTimeout(async () => {
      try {
        userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          return userDoc.data();
        } else {
          console.log('No such document!');
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        showLogInMessage('Try logging out and logging in again.', '#ff0000');
      }
    }, 3000);
  }
  return null;
}

// Form Validation
function validateForm(email, password) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    showMessage('Email is required.', '#ff0000');
    return false;
  }
  if (!emailPattern.test(email)) {
    showMessage('Invalid email format.', '#ff0000');
    return false;
  }
  if (!password) {
    showMessage('Password is required.', '#ff0000');
    return false;
  }
  return true;
}

// Display Messages
function showMessage(text, color) {
  message.textContent = text;
  message.style.color = color;
}

function showErrorMessage(text, color) {
  errorAuth.textContent = text;
  errorAuth.style.color = color;
  errBody.style.display = 'flex';
  if (logOut) {
    logOut.style.display = 'none';
  }
  setTimeout(() => {
    errBody.style.display = 'none';
  }, 3000);
}

function showLogInMessage(text, color) {
  if (logIn) {
    logIn.textContent = text;
    logIn.style.color = color;
    errBody.style.display = 'flex';
    setTimeout(() => {
      errBody.style.display = 'none';
    }, 3000);
  }
}

// Event Listeners for Enter Key
function addEnterKeyListener(input, handler) {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handler();
    }
  });
}

if (emailInput) {
  addEnterKeyListener(emailInput, login);
  emailInput.addEventListener('input', clearValidationMessage);
}

if (passwordInput) {
  addEnterKeyListener(passwordInput, login);
  passwordInput.addEventListener('input', clearValidationMessage);
}

// Clear Validation Message
function clearValidationMessage() {
  message.textContent = '';
}

// Password Visibility Toggle
if (eyeBox) {
  eyeBox.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeSlash.style.display = 'inline';
      eye.style.display = 'none';
    } else {
      passwordInput.type = 'password';
      eyeSlash.style.display = 'none';
      eye.style.display = 'inline';
    }
  });
}

// Local Storage for Logout Message
document.addEventListener('DOMContentLoaded', () => {
  const logoutMessage = localStorage.getItem('logoutMessage');
  if (logoutMessage) {
    showErrorMessage(logoutMessage, '#28a745');
    localStorage.removeItem('logoutMessage');
  }
});

// Login
if (loginButton) {
  loginButton.addEventListener('click', login);
}

async function login() {
  const email = emailInput.value;
  const password = passwordInput.value;
  if (!validateForm(email, password)) {
    return;
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp(),
      email: email
    }, { merge: true });
  } catch (error) {
    showErrorMessage(error.message, '#ff0000');
  }
}

// Logout
if (logoutButton) {
  logoutButton.addEventListener('click', logout);
}

async function logout() {
  try {
    await signOut(auth);
    localStorage.setItem('logoutMessage', 'Logout successful!');
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Signup
if (signupButton) {
  signupButton.addEventListener('click', signup);
}

async function signup() {
  const email = emailInput.value;
  const password = passwordInput.value;
  if (!validateForm(email, password)) {
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    showErrorMessage('Sign up successful!', '#28a745');
    const user = userCredential.user;
    await setDoc(doc(db, 'users', user.uid), {
      signupDate: serverTimestamp(),
      email: email
    });
  } catch (error) {
    showErrorMessage(error.message, '#ff0000');
  }
}

// Google Sign-In
if (googleContinueButton) {
  googleContinueButton.addEventListener('click', googleSignIn);
}

async function googleSignIn() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    showErrorMessage('Google sign-in successful!', '#28a745');
    setTimeout(() => {
      showErrorMessage('Redirecting to Home...', '#28a745');
      // Redirect to home page after showing the message
      window.location.href = 'index.html';
    }, 3000);
    const user = result.user;
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: serverTimestamp(),
      email: user.email
    }, { merge: true });
  } catch (error) {
    showErrorMessage(error.message, '#ff0000');
  }
}

// Hiding .html Extension
document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.endsWith(".html")) {
      link.dataset.originalHref = href;
      link.setAttribute("href", href.slice(0, -5));
      link.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = link.dataset.originalHref;
      });
    }
  });
});