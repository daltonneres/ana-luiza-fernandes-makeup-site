// --- Firebase --- //
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
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
const auth = getAuth(app);

// --- Elementos --- //
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

// --- Login com Firebase Auth --- //
btnLogin.addEventListener("click", async () => {
  const email = usuarioInput.value.trim();
  const senha = senhaInput.value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    erroLogin.style.display = "none";
  } catch (error) {
    console.error("Erro no login:", error);
    erroLogin.style.display = "block";
  }
});

// --- Logout --- //
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
});

// --- Observa o estado do login --- //
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginContainer.style.display = "none";
    adminContainer.style.display = "block";
    carregarAgendamentos();
  } else {
    adminContainer.style.display = "none";
    loginContainer.style.display = "flex";
    usuarioInput.value = "";
    senhaInput.value = "";
  }
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
      <td>
        <button class="btnEditar" data-id="${documento.id}" style="background:#3498db; color:white; border:none; border-radius:6px; padding:5px 10px; cursor:pointer;">Editar</button>
        <button class="btnExcluir" data-id="${documento.id}" style="background:#e74c3c; color:white; border:none; border-radius:6px; padding:5px 10px; cursor:pointer;">Excluir</button>
      </td>
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

  // --- Botões de edição individual ---
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

  // --- Botões de exclusão individual ---
  document.querySelectorAll(".btnExcluir").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const confirmar = confirm("Deseja realmente excluir este atendimento?");
      if (!confirmar) return;

      try {
        await deleteDoc(doc(db, "agendamentos", id));
        alert("🗑️ Atendimento excluído com sucesso!");
        carregarAgendamentos();
      } catch (erro) {
        alert("❌ Erro ao excluir: " + erro.message);
      }
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
