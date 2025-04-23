import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
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

const params = new URLSearchParams(location.search);
const personajeId = params.get("id");

let currentUser = null;
let partidaId = null;
let creadorPersonaje = null;

const crearBtn = document.getElementById("crearItem");
const nameInput = document.getElementById("itemName");
const descInput = document.getElementById("itemDesc");
const imageInput = document.getElementById("itemImage");
const listaItems = document.getElementById("listaItems");
const titulo = document.querySelector("h1");
const formCrearItem = document.getElementById("formCrearItem");

// Navbar superior con botón volver
const nav = document.createElement("nav");
nav.style.position = "fixed";
nav.style.top = "0";
nav.style.left = "0";
nav.style.width = "100%";
nav.style.background = "#333";
nav.style.color = "white";
nav.style.padding = "10px";
nav.style.zIndex = "1000";
nav.innerHTML = `<button style="font-size:16px;" onclick="history.back()">← Volver</button>`;
document.body.prepend(nav);

document.body.style.paddingTop = "60px"; // para no solaparse con el navbar

onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;

    const pjDoc = await getDoc(doc(db, "personajes", personajeId));
    if (!pjDoc.exists()) return alert("Personaje no existe");
    const pjData = pjDoc.data();
    partidaId = pjData.partidaId;
    creadorPersonaje = pjData.creadorUid;

    titulo.textContent = `Ítems de ${pjData.nombre}`;

    // Solo mostrar el formulario si es el creador del personaje
    if (currentUser.uid !== creadorPersonaje) {
      formCrearItem.style.display = "none";
    }

    cargarItems();
  } else {
    alert("Debes iniciar sesión");
    location.href = "index.html";
  }
});


// Resto del código sin cambios relevantes (ya actualizado previamente)


crearBtn.onclick = async () => {
  const name = nameInput.value;
  const desc = descInput.value;
  const file = imageInput.files[0];
  if (!name || !desc || !file) return alert("Faltan datos");

  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData
  });
  const data = await res.json();
  const imageUrl = data.data.url;

  await addDoc(collection(db, "items"), {
    name,
    desc,
    imageUrl,
    personajeId,
    creadorEmail: currentUser.email, // mostrar correo del creador
    propietarioUid: currentUser.uid   // para control de propiedad actual
  });

  nameInput.value = "";
  descInput.value = "";
  imageInput.value = "";
  cargarItems();
};

async function cargarItems() {
  listaItems.innerHTML = "";
  const q = query(collection(db, "items"), where("personajeId", "==", personajeId));
  const snap = await getDocs(q);
  snap.forEach(async docData => {
    const item = docData.data();
    const div = document.createElement("div");
    div.classList.add("item");
    div.style.position = "relative";
    div.innerHTML = `
      <h3 contenteditable="false">${item.name}</h3>
      <p contenteditable="false">${item.desc}</p>
      <img src="${item.imageUrl}">
      <small><b>Creador:</b> ${item.creadorEmail}</small><br>
    `;

    if (item.propietarioUid === currentUser.uid) {
      const eliminarBtn = document.createElement("button");
      eliminarBtn.textContent = "🗑️";
      eliminarBtn.style.position = "absolute";
      eliminarBtn.style.top = "5px";
      eliminarBtn.style.right = "5px";
      eliminarBtn.onclick = async () => {
        const confirm1 = confirm("ESTÁS A PUNTO DE BORRAR UN ÍTEM");
        if (!confirm1) return;
        const confirm2 = confirm("¿Seguro?");
        if (!confirm2) return;
        await deleteDoc(doc(db, "items", docData.id));
        cargarItems();
      };
      div.appendChild(eliminarBtn);

      const editarBtn = document.createElement("button");
      editarBtn.textContent = "Editar";
      editarBtn.onclick = () => {
        const h3 = div.querySelector("h3");
        const p = div.querySelector("p");
        if (editarBtn.textContent === "Editar") {
          h3.contentEditable = true;
          p.contentEditable = true;
          editarBtn.textContent = "Guardar";
        } else {
          h3.contentEditable = false;
          p.contentEditable = false;
          updateDoc(doc(db, "items", docData.id), {
            name: h3.textContent,
            desc: p.textContent
          });
          editarBtn.textContent = "Editar";
        }
      };
      div.appendChild(editarBtn);

      const transferToggle = document.createElement("button");
      transferToggle.textContent = "Transferir ítem";
      const transferDiv = document.createElement("div");
      transferDiv.style.display = "none";

      transferToggle.onclick = async () => {
        transferDiv.innerHTML = "";
        const select = document.createElement("select");
        const personajes = await getPersonajesDePartida(partidaId);
        personajes.forEach(p => {
          if (p.id !== personajeId) {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = p.nombre;
            select.appendChild(option);
          }
        });

        const btnTransfer = document.createElement("button");
        btnTransfer.textContent = "Confirmar transferencia";
        btnTransfer.onclick = async () => {
          const nuevoId = select.value;
          const nuevoPj = await getDoc(doc(db, "personajes", nuevoId));
          const nuevoUid = nuevoPj.data().creadorUid;
          await updateDoc(doc(db, "items", docData.id), {
            personajeId: nuevoId,
            propietarioUid: nuevoUid
          });
          alert("Ítem transferido");
          cargarItems();
        };

        transferDiv.appendChild(select);
        transferDiv.appendChild(btnTransfer);
        transferDiv.style.display = "block";
      };

      div.appendChild(transferToggle);
      div.appendChild(transferDiv);
    }

    listaItems.appendChild(div);
  });
}

async function getPersonajesDePartida(partidaId) {
  const q = query(collection(db, "personajes"), where("partidaId", "==", partidaId));
  const snap = await getDocs(q);
  const personajes = [];
  snap.forEach(doc => {
    personajes.push({ id: doc.id, ...doc.data() });
  });
  return personajes;
}
