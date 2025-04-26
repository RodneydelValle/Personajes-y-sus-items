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

window.addEventListener("DOMContentLoaded", () => {
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

  if (loginBtn)
    loginBtn.onclick = () => {
      signInWithEmailAndPassword(auth, email.value, password.value)
        .catch(err => alert("Error: " + err.message));
    };

  if (registerBtn)
    registerBtn.onclick = () => {
      createUserWithEmailAndPassword(auth, email.value, password.value)
        .catch(err => alert("Error: " + err.message));
    };

  if (googleBtn)
    googleBtn.onclick = () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .catch(err => alert("Error con Google: " + err.message));
    };

  if (logoutBtn)
    logoutBtn.onclick = () => signOut(auth);

  onAuthStateChanged(auth, async user => {
    if (user && user.email) {
      currentUser = user;
      if (loginBtn) loginBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline";
      if (registerBtn) registerBtn.style.display = "none";
      if (googleBtn) googleBtn.style.display = "none";
      if (userInfo) {
        userInfo.style.display = "block";
        userInfo.textContent = `👋 Bienvenido, ${user.email}`;
      }
      if (user.email === ADMIN_EMAIL && adminPanel) {
        adminPanel.style.display = "block";
      }
      if (typeof loadPartidas === 'function') {
        loadPartidas();
      }
    } else {
      currentUser = null;
      if (adminPanel) adminPanel.style.display = "none";
      if (listaPartidas) listaPartidas.innerHTML = "";
      if (loginBtn) loginBtn.style.display = "inline";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "inline";
      if (googleBtn) googleBtn.style.display = "inline";
      if (userInfo) {
        userInfo.style.display = "none";
        userInfo.textContent = "";
      }
    }
  });

  if (crearPartida)
    crearPartida.onclick = async () => {
      const nombre = document.getElementById("partidaName").value;
      if (!nombre) return alert("Nombre requerido");

      await addDoc(collection(db, "partidas"), {
        nombre,
        creador: currentUser.uid,
        timestamp: new Date()
      });

      alert("Partida creada");
      if (typeof loadPartidas === 'function') loadPartidas();
    };
});

async function loadPartidas() {
  const listaPartidas = document.getElementById("listaPartidas");
  if (!listaPartidas) return;
  listaPartidas.innerHTML = "";
  const partidasSnap = await getDocs(collection(getFirestore(), "partidas"));
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