import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
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
const imgbbApiKey = "e7186e33106d5b82ebcc518e2bf11103";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const urlParams = new URLSearchParams(window.location.search);
const partidaId = urlParams.get("id");

const crearBtn = document.getElementById("crearPersonaje");
const nombreInput = document.getElementById("nombrePersonaje");
const fotoInput = document.getElementById("fotoPersonaje");
const listaDiv = document.getElementById("listaPersonajes");

// Navbar superior con botón volver
const topBar = document.createElement("div");
topBar.style.background = "#333"; // lo tienes
topBar.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)"; // agrega esto para que se vea flotante



document.body.style.paddingTop = "60px"; // para no solaparse con el navbar

let currentUser = null;

onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    cargarPersonajes();
  } else {
    alert("Debes iniciar sesión");
    window.location.href = "index.html";
  }
});

crearBtn.onclick = async () => {
  const nombre = nombreInput.value;
  const archivo = fotoInput.files[0];
  if (!nombre || !archivo) return alert("Falta información");

  const formData = new FormData();
  formData.append("image", archivo);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  const imagenUrl = data.data.url;

  await addDoc(collection(db, "personajes"), {
    nombre,
    imagenUrl,
    partidaId,
    creadorUid: currentUser.uid
  });

  nombreInput.value = "";
  fotoInput.value = "";
  cargarPersonajes();
};

async function cargarPersonajes() {
  listaDiv.innerHTML = "";
  const q = query(collection(db, "personajes"), where("partidaId", "==", partidaId));
  const snap = await getDocs(q);
  snap.forEach(doc => {
    const p = doc.data();
    const div = document.createElement("div");
    div.className = "personaje";
    div.innerHTML = `
      <img src="${p.imagenUrl}">
      <strong>${p.nombre}</strong><br>
      <button onclick="location.href='personaje.html?id=${doc.id}'">Ver ítems</button>
    `;
    listaDiv.appendChild(div);
  });
}
