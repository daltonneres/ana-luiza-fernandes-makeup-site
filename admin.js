// --- Firebase Firestore ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const btnApagarTudo = document.getElementById("btnApagarTudo");
const btnNovoAtendimento = document.getElementById("btnNovoAtendimento");

// --- Login ---
const usuarioCorreto = "AnaLuiza-Makeup";
const senhaCorreta = "AnaLuiza-Makeup-2025-SaltodoLontra";

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

// --- Carregar agendamentos ---
async function carregarAgendamentos() {
  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  tabelaAgendamentos.innerHTML = "";

  let total = 0;
  let pagamentos = {};

  querySnapshot.forEach((documento) => {
    const ag = documento.data();
    const valor = Number(ag.valor || 0);
    const desconto = Number(ag.desconto || 0);
    const valorFinal = Math.max(valor - desconto, 0);

    total += valorFinal;

    if (ag.formaPagamento) {
      pagamentos[ag.formaPagamento] =
        (pagamentos[ag.formaPagamento] || 0) + valorFinal;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ag.nome || "-"}</td>
      <td>${ag.data || "-"}</td>
      <td>${ag.periodo || "-"}</td>
      <td>${ag.horario || "-"}</td>
      <td>${ag.procedimento || "-"}</td>
      <td>${ag.formaPagamento || "-"}</td>
      <td>R$ ${valor.toFixed(2)}</td>
      <td>${desconto > 0 ? "Sim (R$ " + desconto.toFixed(2) + ")" : "Não"}</td>
      <td><strong>R$ ${valorFinal.toFixed(2)}</strong></td>
      <td><button class="btnEditar" data-id="${documento.id}">Editar</button></td>
    `;
    tabelaAgendamentos.appendChild(tr);
  });

  // Atualizar resumo
  totalAgendamentos.textContent = `Total de agendamentos: ${querySnapshot.size}`;
  valorTotal.textContent = `Valor total: R$ ${total.toFixed(2)}`;

  let resumoHTML = "<h4>Formas de Pagamento:</h4><ul>";
  for (const [forma, valor] of Object.entries(pagamentos)) {
    resumoHTML += `<li>${forma}: R$ ${valor.toFixed(2)}</li>`;
  }
  resumoHTML += "</ul>";
  pagamentosResumo.innerHTML = resumoHTML;

  // Botões de edição
  document.querySelectorAll(".btnEditar").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const novoValor = parseFloat(prompt("Novo valor (R$):"));
      const desconto = parseFloat(prompt("Desconto (R$):")) || 0;

      if (isNaN(novoValor)) return alert("Valor inválido.");

      await updateDoc(doc(db, "agendamentos", id), {
        valor: novoValor,
        desconto: desconto,
      });

      alert("Atendimento atualizado com sucesso!");
      carregarAgendamentos();
    });
  });
}

// --- Apagar todos agendamentos ---
async function apagarTodosAgendamentos() {
  const confirmacao = confirm(
    "Tem certeza que deseja apagar todos os agendamentos? Essa ação não pode ser desfeita!"
  );
  if (!confirmacao) return;

  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  for (const documento of querySnapshot.docs) {
    await deleteDoc(doc(db, "agendamentos", documento.id));
  }

  carregarAgendamentos();
  alert("Todos os agendamentos foram apagados!");
}

btnApagarTudo.addEventListener("click", apagarTodosAgendamentos);

// --- Novo Atendimento Manual ---
btnNovoAtendimento.addEventListener("click", () => {
  document.getElementById("modalNovo").style.display = "flex";
});

// --- Salvar manualmente no modal ---
const btnSalvarManual = document.getElementById("salvarManual");
const btnFecharModal = document.getElementById("fecharModal");

btnFecharModal.addEventListener("click", () => {
  document.getElementById("modalNovo").style.display = "none";
});

btnSalvarManual.addEventListener("click", async () => {
  const nome = document.getElementById("nomeManual").value.trim();
  const data = document.getElementById("dataManual").value;
  const periodo = document.getElementById("periodoManual").value;
  const horario = document.getElementById("horaManual").value;
  const procedimento = document.getElementById("procedimentoManual").value.trim();
  const formaPagamento = document.getElementById("pagamentoManual").value;
  const valor = parseFloat(document.getElementById("valorManual").value || 0);
  const desconto = parseFloat(document.getElementById("descontoManual").value || 0);
  const obs = document.getElementById("obsManual").value.trim();

  if (!nome || !data || !horario || !procedimento) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  try {
    await addDoc(collection(db, "agendamentos"), {
      nome,
      data,
      periodo,
      horario,
      procedimento,
      formaPagamento,
      valor,
      desconto,
      observacoes: obs,
    });

    alert("✅ Atendimento adicionado com sucesso!");
    document.getElementById("modalNovo").style.display = "none";

    // Limpar campos
    document.querySelectorAll("#modalNovo input, #modalNovo textarea").forEach((el) => el.value = "");

    // Atualiza tabela automaticamente
    carregarAgendamentos();
  } catch (e) {
    alert("❌ Erro ao salvar: " + e.message);
  }
});

// --- Exibir tela de login ---
document.addEventListener("DOMContentLoaded", () => {
  loginContainer.style.display = "flex";
});
