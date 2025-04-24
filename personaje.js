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

const topBar = document.createElement("div");
topBar.style.background = "#333"; // lo tienes
topBar.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)"; // agrega esto para que se vea flotante

topBar.innerHTML = `
  <button style="font-size:16px;" onclick="history.back()">← Volver</button>
  <div id="extraBtns"></div> <!-- aquí puedes agregar más botones después -->
`;

document.body.prepend(topBar);
document.body.style.paddingTop = "60px"; // ajuste para que no tape contenido

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



function convertir(origen, destino) {
  const getValor = id => parseFloat(document.getElementById("valor-" + id)?.value) || 0;
  const setValor = (id, val) => document.getElementById("valor-" + id).value = Math.floor(val);

  const conversion = {
    cp: { sp: 0.1 },
    sp: { cp: 10, ep: 0.2 },
    ep: { sp: 5, gp: 0.5 },
    gp: { ep: 2, pp: 0.1 },
    pp: { gp: 10 }
  };

  const factor = conversion[origen]?.[destino];
  if (!factor) return;

  let cantidad = getValor(origen);
  let destinoActual = getValor(destino);
  let convertido = 0;

  if (factor < 1) {
    // Moneda más valiosa (ej. 10 gp → 1 pp)
    convertido = Math.floor(cantidad * factor);
    if (convertido >= 1) {
      const consumido = Math.floor(convertido / factor);
      setValor(destino, destinoActual + convertido);
      setValor(origen, cantidad - consumido);
    }
  } else {
    // Moneda menos valiosa (ej. 1 pp → 10 gp)
    convertido = Math.floor(cantidad * factor);
    if (convertido >= 1) {
      setValor(destino, destinoActual + convertido);
      setValor(origen, 0);
    }
  }
}
window.convertir = convertir;


//MONEDAS GUARDADAS

async function guardarMonedasEnFirebase(personajeId) {
  const monedas = {
    cp: parseInt(document.getElementById("valor-cp").value) || 0,
    sp: parseInt(document.getElementById("valor-sp").value) || 0,
    ep: parseInt(document.getElementById("valor-ep").value) || 0,
    gp: parseInt(document.getElementById("valor-gp").value) || 0,
    pp: parseInt(document.getElementById("valor-pp").value) || 0,
  };

  await updateDoc(doc(db, "personajes", personajeId), { monedas });
  alert("💾 Monedas guardadas");
}

//TRASNFERENCIA DE MONEDAS

async function transferirMonedas(origenId, destinoId, tipo, cantidad) {
  const origenRef = doc(db, "personajes", origenId);
  const destinoRef = doc(db, "personajes", destinoId);

  const origenSnap = await getDoc(origenRef);
  const destinoSnap = await getDoc(destinoRef);

  const origenData = origenSnap.data();
  const destinoData = destinoSnap.data();

  if ((origenData.monedas?.[tipo] || 0) < cantidad) {
    alert("No tienes suficiente " + tipo.toUpperCase());
    return;
  }

  // Transferir monedas
  const nuevasOrigen = { ...origenData.monedas };
  const nuevasDestino = { ...destinoData.monedas || {} };

  nuevasOrigen[tipo] -= cantidad;
  nuevasDestino[tipo] = (nuevasDestino[tipo] || 0) + cantidad;

  await updateDoc(origenRef, { monedas: nuevasOrigen });
  await updateDoc(destinoRef, {
    monedas: nuevasDestino,
    historial: [
      {
        fecha: new Date(),
        deNombre: origenData.nombre,
        deImagen: origenData.imagenUrl || "",
        tipo,
        cantidad
      },
      ...(destinoData.historial || []).slice(0, 2) // máximo 3
    ]
  });

  alert("Transferencia exitosa");
}

//HISTORIAL DE TRANSFERENCIAS

function mostrarHistorial(historial = []) {
  const contenedor = document.getElementById("historialTransferencias");
  contenedor.innerHTML = "";

  historial.slice(0, 3).forEach(entry => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.marginBottom = "5px";
    div.innerHTML = `
      <img src="${entry.deImagen}" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 6px;">
      <span><strong>${entry.deNombre}</strong> te envió ${entry.cantidad} ${entry.tipo.toUpperCase()}</span>
    `;
    contenedor.appendChild(div);
  });



async function cargarDestinosTransferencia() {
  const select = document.getElementById("personajeDestino");
  const personajes = await getPersonajesDePartida(partidaId);
  personajes.forEach(p => {
    if (p.id !== personajeId) {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.nombre;
      select.appendChild(option);
    }
  });
}
window.cargarDestinosTransferencia = cargarDestinosTransferencia;

async function cargarDestinosTransferencia() {
  const select = document.getElementById("personajeDestino");
  const personajes = await getPersonajesDePartida(partidaId);
  personajes.forEach(p => {
    if (p.id !== personajeId) {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.nombre;
      select.appendChild(option);
    }
  });
}
window.cargarDestinosTransferencia = cargarDestinosTransferencia;

// Llamar al cargar
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    const pjDoc = await getDoc(doc(db, "personajes", personajeId));
    if (!pjDoc.exists()) return alert("Personaje no existe");
    const pjData = pjDoc.data();
    partidaId = pjData.partidaId;
    creadorPersonaje = pjData.creadorUid;
    titulo.textContent = `Ítems de ${pjData.nombre}`;
    if (currentUser.uid !== creadorPersonaje) formCrearItem.style.display = "none";
    cargarItems();
    cargarDestinosTransferencia(); // 👈 SE AÑADE AQUÍ
    mostrarHistorial(pjData.historial || []);
    activarAutoGuardadoMonedas();
  } else {
    alert("Debes iniciar sesión");
    location.href = "index.html";
  }
});

// Ejecutar transferencia
function ejecutarTransferencia() {
  const destinoId = document.getElementById("personajeDestino").value;
  const tipo = document.getElementById("tipoMoneda").value;
  const cantidad = parseInt(document.getElementById("cantidadTransferir").value);

  if (!destinoId || !tipo || !cantidad || cantidad <= 0) {
    alert("Datos incompletos o inválidos.");
    return;
  }

  transferirMonedas(personajeId, destinoId, tipo, cantidad);
}

}


function activarAutoGuardadoMonedas() {
  const campos = ["valor-cp", "valor-sp", "valor-ep", "valor-gp", "valor-pp"];
  campos.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("change", () => guardarMonedasEnFirebase(personajeId));
    }
  });
}
