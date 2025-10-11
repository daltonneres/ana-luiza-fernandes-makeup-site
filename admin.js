// --- Firebase Firestore ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlZAZjT8ZOWPf40Tf4lowdXcWxO179e1I",
  authDomain: "ana-makeup-bot.firebaseapp.com",
  projectId: "ana-makeup-bot",
  storageBucket: "ana-makeup-bot.firebasestorage.app",
  messagingSenderId: "448009074377",
  appId: "1:448009074377:web:fe1f01d20f35be123f7f18"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Elementos ---
const loginContainer = document.getElementById("loginContainer");
const adminContainer = document.getElementById("adminContainer");
const usuarioInput = document.getElementById("usuario");
const senhaInput = document.getElementById("senha");
const btnLogin = document.getElementById("btnLogin");
const erroLogin = document.getElementById("erroLogin");
const btnLogout = document.getElementById("btnLogout");
const tabelaAgendamentos = document.getElementById("tabelaAgendamentos");
const totalAgendamentos = document.getElementById("totalAgendamentos");
const valorTotal = document.getElementById("valorTotal");
const pagamentosResumo = document.getElementById("pagamentosResumo");

// Novo botão de apagar todos
const btnApagarTudo = document.getElementById("btnApagarTudo");

// --- Login ---
const usuarioCorreto = "ana";
const senhaCorreta = "AnaMakeup2025";

btnLogin.addEventListener("click", () => {
  const usuario = usuarioInput.value.trim();
  const senha = senhaInput.value.trim();

  if (usuario === usuarioCorreto && senha === senhaCorreta) {
    loginContainer.style.display = "none";
    adminContainer.style.display = "block";
    carregarAgendamentos();
  } else {
    erroLogin.style.display = "block";
  }
});

btnLogout.addEventListener("click", () => {
  adminContainer.style.display = "none";
  loginContainer.style.display = "flex";
  usuarioInput.value = "";
  senhaInput.value = "";
});

// --- Carregar agendamentos do Firestore ---
async function carregarAgendamentos() {
  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  tabelaAgendamentos.innerHTML = "";

  let total = 0;
  let pagamentos = {};

  querySnapshot.forEach((doc) => {
    const ag = doc.data();
    const valor = Number(ag.valor || 0);
    total += valor;

    if (ag.formaPagamento) {
      pagamentos[ag.formaPagamento] = (pagamentos[ag.formaPagamento] || 0) + valor;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ag.nome || "-"}</td>
      <td>${ag.data || "-"}</td>
      <td>${ag.horario || "-"}</td>
      <td>${ag.procedimento || "-"}</td>
      <td>${ag.formaPagamento || "-"}</td>
      <td>${valor.toFixed(2)}</td>
    `;
    tabelaAgendamentos.appendChild(tr);
  });

  totalAgendamentos.textContent = `Total de agendamentos: ${querySnapshot.size}`;
  valorTotal.textContent = `Valor total: R$ ${total.toFixed(2)}`;

  let resumoHTML = "<h4>Formas de Pagamento:</h4><ul>";
  for (const [forma, valor] of Object.entries(pagamentos)) {
    resumoHTML += `<li>${forma}: R$ ${valor.toFixed(2)}</li>`;
  }
  resumoHTML += "</ul>";
  pagamentosResumo.innerHTML = resumoHTML;
}

// --- Apagar todos agendamentos ---
async function apagarTodosAgendamentos() {
  const confirmacao = confirm("Tem certeza que deseja apagar todos os agendamentos? Essa ação não pode ser desfeita!");
  if (!confirmacao) return;

  const querySnapshot = await getDocs(collection(db, "agendamentos"));

  for (const document of querySnapshot.docs) {
    await deleteDoc(doc(db, "agendamentos", document.id));
  }

  carregarAgendamentos();
  alert("Todos os agendamentos foram apagados!");
}

btnApagarTudo.addEventListener("click", apagarTodosAgendamentos);

// --- Exibir tela de login ao carregar ---
document.addEventListener("DOMContentLoaded", () => {
  loginContainer.style.display = "flex";
});
