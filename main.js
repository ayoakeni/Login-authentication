import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { initializeFirestore, CACHE_SIZE_UNLIMITED, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
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
const userInfo = document.getElementById('userInfo');
const logoutButton = document.getElementById('logoutButton');
const errorAuth = document.getElementById('errorAuth');
const logIn = document.getElementById('logIn');
const logOut = document.getElementById('logOut');
const errBody = document.getElementById('errBody');

// Redirect Functions
let fullPath = window.location.pathname;
// Split the path by '/' and get the last part
let pathParts = fullPath.split('/');
let lastPath = '/' + pathParts[pathParts.length - 1];

function redirectToHomeIfLoggedIn(user) {
  if (user && lastPath === '/login.html') {
    window.location.href = 'index.html';
  }
}

function redirectToLoginIfOnRestrictedArea(user) {
  const allowedPages = ['/login.html', '/signup.html'];
  if (!user && !allowedPages.includes(lastPath)) {
    window.location.href = 'login.html';
  }
}

async function redirectToLoginIfSignedUp(user) {
  if (user && lastPath === '/signup.html') {
    try {
      await signOut(auth);
      setTimeout(() => {
        showErrorMessage('Redirecting to log in...', '#28a745');
        window.location.href = 'login.html';
      }, 3000);
    } catch (error) {
      showErrorMessage('Error signing out. Please try again.', '#ff0000');
    }
  }
}

// Authentication State
onAuthStateChanged(auth, async (user) => {
  redirectToHomeIfLoggedIn(user);
  redirectToLoginIfSignedUp(user);
  redirectToLoginIfOnRestrictedArea(user);

  if (user) {
    console.log('Logged in');
    if (logIn) showLogInMessage('Login successful!', '#28a745');
    await fetchUserData(user.uid); // Fetch and display user data here
  }
});

// Fetching Data
async function fetchUserData(userId) {
  const userDocRef = doc(db, 'users', userId);
  let userDoc;
  try {
    userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const userDataElement = userInfo;
      userDataElement.textContent = `Email: ${userData.email}`;
      if (userData.signupDate) {
        userDataElement.textContent += `, Signup Date: ${new Date(userData.signupDate.seconds * 1000).toLocaleString()}`;
      }
      if (userData.lastLogin) {
        userDataElement.textContent += `, Last Login: ${new Date(userData.lastLogin.seconds * 1000).toLocaleString()}`;
      }
    } else {
      console.log('No such document!');
      userInfo.textContent = 'No user data found.';
      if (logIn) showLogInMessage('Unable to fetch your data.', '#ff0000');
    }
  } catch (error) {
    console.error('Error fetching user document:', error);
    setTimeout(async () => {
      try {
        userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userDataElement = document.getElementById('userData');
          userDataElement.textContent = `Email: ${userData.email}`;
          if (userData.signupDate) {
            userDataElement.textContent += `, Signup Date: ${new Date(userData.signupDate.seconds * 1000).toLocaleString()}`;
          }
          if (userData.lastLogin) {
            userDataElement.textContent += `, Last Login: ${new Date(userData.lastLogin.seconds * 1000).toLocaleString()}`;
          }
        } else {
          console.log('No such document!');
          userInfo.textContent = 'No user data found.';
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
  if (message) {
    message.textContent = text;
    message.style.color = color;
  }
}

function showErrorMessage(text, color) {
  if (errorAuth && errBody) {
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
}

function showLogInMessage(text, color) {
  if (logIn && errBody) {
    logIn.textContent = text;
    logIn.style.color = color;
    errBody.style.display = 'flex';
    setTimeout(() => {
      errBody.style.display = 'none';
    }, 3000);
  }
}

// Event Listeners for Enter Key
const inputs = [emailInput, passwordInput];
inputs.forEach(input => {
  if (input) {
    addEnterKeyListener(input, login);
    input.addEventListener('input', clearValidationMessage);
  }
});

function addEnterKeyListener(input, handler) {
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handler();
    }
  });
}

// Clear Validation Message
function clearValidationMessage() {
  if (message) {
    message.textContent = '';
  }
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
    }, 1000);
    const user = result.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        signupDate: serverTimestamp(),
        email: user.email
      });
    }
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