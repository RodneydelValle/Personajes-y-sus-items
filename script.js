import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbmRcCeN9lMMjjbXwcHUC5OpDXB1w6vLw",
  authDomain: "rol-items.firebaseapp.com",
  projectId: "rol-items",
  storageBucket: "rol-items.firebasestorage.app",
  messagingSenderId: "479280055836",
  appId: "1:479280055836:web:4c6797b5d154f94e0201d9"
};

const ADMIN_EMAIL = "thozero@gmail.com";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const registerBtn = document.getElementById("registerBtn");
const googleBtn = document.getElementById("googleBtn");
const crearPartida = document.getElementById("crearPartida");
const adminPanel = document.getElementById("adminPanel");
const listaPartidas = document.getElementById("listaPartidas");
const userInfo = document.getElementById("userInfo");

let currentUser = null;

loginBtn.onclick = () => {
  signInWithEmailAndPassword(auth, email.value, password.value)
    .catch(err => alert("Error: " + err.message));
};

registerBtn.onclick = () => {
  createUserWithEmailAndPassword(auth, email.value, password.value)
    .catch(err => alert("Error: " + err.message));
};

googleBtn.onclick = () => {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .catch(err => alert("Error con Google: " + err.message));
};

logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    registerBtn.style.display = "none";
    googleBtn.style.display = "none";

    userInfo.style.display = "block";
    userInfo.textContent = `👋 Bienvenido, ${user.email}`;

    if (user.email === ADMIN_EMAIL) {
      adminPanel.style.display = "block";
    }

    loadPartidas();
  } else {
    currentUser = null;
    adminPanel.style.display = "none";
    listaPartidas.innerHTML = "";
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    registerBtn.style.display = "inline";
    googleBtn.style.display = "inline";
    userInfo.style.display = "none";
    userInfo.textContent = "";
  }
});

crearPartida.onclick = async () => {
  const nombre = document.getElementById("partidaName").value;
  if (!nombre) return alert("Nombre requerido");

  await addDoc(collection(db, "partidas"), {
    nombre,
    creador: currentUser.uid,
    timestamp: new Date()
  });

  alert("Partida creada");
  loadPartidas();
};

async function loadPartidas() {
  listaPartidas.innerHTML = "";
  const partidasSnap = await getDocs(collection(db, "partidas"));
  partidasSnap.forEach(doc => {
    const p = doc.data();
    const div = document.createElement("div");
    div.classList.add("partida");
    div.innerHTML = `
      <strong>${p.nombre}</strong><br>
      <button onclick="location.href='partida.html?id=${doc.id}'">Ver Personajes</button>
    `;
    listaPartidas.appendChild(div);
  });
}
