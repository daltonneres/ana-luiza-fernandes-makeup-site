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
const btnExportar = document.getElementById("btnExportar");
const btnApagarMes = document.getElementById("btnApagarMes");
const btnNovoAtendimento = document.getElementById("btnNovoAtendimento");

// --- Login --- //
btnLogin.addEventListener("click", async () => {
  const email = usuarioInput.value.trim();
  const senha = senhaInput.value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    erroLogin.style.display = "none";
  } catch {
    erroLogin.style.display = "block";
  }
});

// --- Logout --- //
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
});

// --- Observa login --- //
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginContainer.style.display = "none";
    adminContainer.style.display = "block";
    criarFiltros();
    carregarAgendamentos();
  } else {
    adminContainer.style.display = "none";
    loginContainer.style.display = "flex";
    usuarioInput.value = "";
    senhaInput.value = "";
  }
});

// --- Criar filtros de mês e dia --- //
function criarFiltros() {
  if (document.getElementById("filtrosContainer")) return;
  const filtrosContainer = document.createElement("div");
  filtrosContainer.id = "filtrosContainer";
  filtrosContainer.style.display = "flex";
  filtrosContainer.style.justifyContent = "center";
  filtrosContainer.style.alignItems = "center";
  filtrosContainer.style.gap = "10px";
  filtrosContainer.style.marginBottom = "15px";

  const selectMes = document.createElement("select");
  selectMes.id = "filtroMes";
  selectMes.style.padding = "6px";
  selectMes.style.borderRadius = "6px";

  const meses = [
    { nome: "Todos os Meses", mes: "todos" },
    { nome: "Novembro 2025", mes: "2025-11" },
    { nome: "Dezembro 2025", mes: "2025-12" },
    { nome: "Janeiro 2026", mes: "2026-01" },
    { nome: "Fevereiro 2026", mes: "2026-02" },
  ];

  meses.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.mes;
    opt.textContent = m.nome;
    selectMes.appendChild(opt);
  });

  const inputDia = document.createElement("input");
  inputDia.type = "date";
  inputDia.id = "filtroDia";
  inputDia.style.padding = "6px";
  inputDia.style.borderRadius = "6px";

  const btnFiltrar = document.createElement("button");
  btnFiltrar.textContent = "🔍 Filtrar";
  btnFiltrar.className = "btnSecundario";
  btnFiltrar.onclick = carregarAgendamentos;

  filtrosContainer.append(selectMes, inputDia, btnFiltrar);
  adminContainer.insertBefore(filtrosContainer, adminContainer.querySelector("h1"));
}

// --- Carregar agendamentos --- //
async function carregarAgendamentos() {
  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  tabelaAgendamentos.innerHTML = "";

  const filtroMes = document.getElementById("filtroMes")?.value || "todos";
  const filtroDia = document.getElementById("filtroDia")?.value || "";

  let agendamentos = [];
  querySnapshot.forEach((docSnap) => {
    const ag = docSnap.data();
    if (!ag.data) return;
    ag.id = docSnap.id;
    agendamentos.push(ag);
  });

const ordemPeriodo = {
  "Manhã": 1,
  "Tarde": 2,
  "Noite": 3
};

agendamentos.sort((a, b) => {
  // 1️⃣ Ordena pela data
  const dataA = new Date(a.data);
  const dataB = new Date(b.data);
  if (dataA.getTime() !== dataB.getTime()) {
    return dataA - dataB;
  }

  // 2️⃣ Se for o mesmo dia, ordena pelo período
  const periodoA = ordemPeriodo[a.periodo] || 99;
  const periodoB = ordemPeriodo[b.periodo] || 99;
  if (periodoA !== periodoB) {
    return periodoA - periodoB;
  }

  // 3️⃣ Se ainda empatar, ordena pelo horário
  return (a.horario || "").localeCompare(b.horario || "");
});

  let total = 0;
  let pagamentos = {};
  let contador = 0;

  agendamentos.forEach((ag) => {
    const dataBase = ag.data.slice(0, 7);
    if (filtroMes !== "todos" && dataBase !== filtroMes) return;
    if (filtroDia && ag.data !== filtroDia) return;

    const valor = Number(ag.valor || 0);
    const desconto = Number(ag.desconto || 0);
    const valorFinal = Math.max(valor - desconto, 0);
    const concluido = ag.concluido === true;

    contador++;
    total += valorFinal;
    if (ag.formaPagamento)
      pagamentos[ag.formaPagamento] = (pagamentos[ag.formaPagamento] || 0) + valorFinal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${ag.nome || "-"}</td>
      <td>${ag.telefone || "-"}</td>
      <td>${ag.data ? ag.data.split("-").reverse().join("/") : "-"}</td>
      <td>${ag.periodo || "-"}</td>
      <td>${ag.horario || "-"}</td>
      <td>${ag.procedimento || "-"}</td>
      <td>${ag.formaPagamento || "-"}</td>
      <td>R$ ${valor.toFixed(2)}</td>
      <td>${desconto > 0 ? "Sim (R$ " + desconto.toFixed(2) + ")" : "Não"}</td>
      <td><strong>R$ ${valorFinal.toFixed(2)}</strong></td>
      <td><input type="checkbox" class="chkConcluir" data-id="${ag.id}" ${concluido ? "checked" : ""}></td>
      <td>
        <button class="btnAcoes"
          data-id="${ag.id}"
          data-tel="${ag.telefone}"
          data-nome="${ag.nome}"
          data-data="${ag.data}"
          data-periodo="${ag.periodo}"
          data-horario="${ag.horario}"
          data-procedimento="${ag.procedimento}"
          data-valor="${(ag.valor - (ag.desconto || 0)).toFixed(2)}">
          ⚙️ Ações
        </button>
      </td>
    `;
    tabelaAgendamentos.appendChild(tr);
  });

  totalAgendamentos.textContent = `Total de agendamentos: ${contador}`;
  valorTotal.textContent = `Valor total: R$ ${total.toFixed(2)}`;

  let resumoHTML = "<h4>Formas de Pagamento:</h4><ul>";
  for (const [forma, valor] of Object.entries(pagamentos))
    resumoHTML += `<li>${forma}: R$ ${valor.toFixed(2)}</li>`;
  resumoHTML += "</ul>";
  pagamentosResumo.innerHTML = resumoHTML;

  document.querySelectorAll(".chkConcluir").forEach((chk) => {
    chk.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const concluido = e.target.checked;
      await updateDoc(doc(db, "agendamentos", id), { concluido });
      if (concluido) alert("💖 Mais um atendimento concluído! Parabéns, Ana! 🎉✨");
    });
  });
}

// --- Modal de Ações --- //
const modalAcoes = document.getElementById("modalAcoes");
const fecharAcoes = document.getElementById("fecharAcoes");
const btnFecharModalAcoes = document.getElementById("acaoFechar");

let agendamentoSelecionado = null;

// Abrir modal
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("btnAcoes")) {
    const btn = e.target;
    agendamentoSelecionado = { 
      id: btn.dataset.id,
      nome: btn.dataset.nome,
      telefone: btn.dataset.tel,
      data: btn.dataset.data,
      periodo: btn.dataset.periodo,
      horario: btn.dataset.horario,
      procedimento: btn.dataset.procedimento,
      valor: btn.dataset.valor
    };
    modalAcoes.style.display = "flex";
  }
});

// Fechar modal
fecharAcoes.onclick = () => modalAcoes.style.display = "none";
btnFecharModalAcoes.onclick = () => modalAcoes.style.display = "none";
window.onclick = (e) => { if (e.target === modalAcoes) modalAcoes.style.display = "none"; };

// --- Editar --- //
document.getElementById("acaoEditar").onclick = async () => {
  modalAcoes.style.display = "none";
  const docSnap = await getDocs(collection(db, "agendamentos"));
  const ag = docSnap.docs.find(d => d.id === agendamentoSelecionado.id)?.data();
  if (!ag) return alert("Erro ao carregar o atendimento!");

  document.getElementById("modalNovo").style.display = "flex";
  document.getElementById("nomeManual").value = ag.nome || "";
  document.getElementById("telefoneManual").value = ag.telefone || "";
  document.getElementById("dataManual").value = ag.data || "";
  document.getElementById("periodoManual").value = ag.periodo || "Manhã";
  document.getElementById("horaManual").value = ag.horario || "";
  document.getElementById("procedimentoManual").value = ag.procedimento || "";
  document.getElementById("pagamentoManual").value = ag.formaPagamento || "PIX";
  document.getElementById("valorManual").value = ag.valor || "";
  document.getElementById("descontoManual").value = ag.desconto || "";
  document.getElementById("obsManual").value = ag.observacoes || "";

  const btnSalvar = document.getElementById("salvarManual");
  btnSalvar.textContent = "💾 Salvar Alterações";
  btnSalvar.onclick = async () => {
    const nome = document.getElementById("nomeManual").value.trim();
    const telefone = document.getElementById("telefoneManual").value.trim();
    const data = document.getElementById("dataManual").value;
    const periodo = document.getElementById("periodoManual").value;
    const horario = document.getElementById("horaManual").value;
    const procedimento = document.getElementById("procedimentoManual").value.trim();
    const formaPagamento = document.getElementById("pagamentoManual").value;
    const valor = parseFloat(document.getElementById("valorManual").value || 0);
    const desconto = parseFloat(document.getElementById("descontoManual").value || 0);
    const obs = document.getElementById("obsManual").value.trim();

    await updateDoc(doc(db, "agendamentos", agendamentoSelecionado.id), {
      nome, telefone, data, periodo, horario, procedimento, formaPagamento, valor, desconto, observacoes: obs
    });

    alert("✅ Atendimento atualizado!");
    document.getElementById("modalNovo").style.display = "none";
    carregarAgendamentos();
    btnSalvar.textContent = "💾 Salvar Atendimento";
    btnSalvar.onclick = salvarNovoAtendimento;
  };
};

// --- WhatsApp --- //
document.getElementById("acaoWhats").onclick = () => {
  modalAcoes.style.display = "none";
  const nome = agendamentoSelecionado.nome || "Maravilhosa";
  const tel = (agendamentoSelecionado.telefone || "").replace(/\D/g, "");
  const data = agendamentoSelecionado.data
    ? agendamentoSelecionado.data.split("-").reverse().join("/")
    : "-";

  const msg = `
Olá ${nome} 😍✨

Seu atendimento está confirmado para *${data}*, período *${agendamentoSelecionado.periodo}*, às *${agendamentoSelecionado.horario}*.
Procedimento: *${agendamentoSelecionado.procedimento}*.
Valor: *R$ ${agendamentoSelecionado.valor}* 💖

📍 Local: *Espaço Ana Luiza Makeup*  
Salto Do Lontra-PR
🗺️ https://maps.app.goo.gl/n74UzXbv88cw8Mbq5?g_st=ipc

Te esperamos com muito carinho! 💄✨
`;

  if (!tel) return alert("Telefone não informado!");
  const link = `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
};

// --- Excluir --- //
document.getElementById("acaoExcluir").onclick = async () => {
  if (!confirm("Tem certeza que deseja excluir este atendimento?")) return;
  await deleteDoc(doc(db, "agendamentos", agendamentoSelecionado.id));
  alert("🗑️ Atendimento excluído!");
  modalAcoes.style.display = "none";
  carregarAgendamentos();
};

// --- Apagar todos DESATIVADO por segurança --- //
/*
btnApagarTudo.addEventListener("click", async () => {
  if (!confirm("Tem certeza que deseja apagar todos os agendamentos?")) return;
  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  for (const docSnap of querySnapshot.docs)
    await deleteDoc(doc(db, "agendamentos", docSnap.id));
  alert("Todos foram apagados!");
  carregarAgendamentos();
});
*/

// --- Novo Atendimento --- //
btnNovoAtendimento.addEventListener("click", () => {
  document.getElementById("modalNovo").style.display = "flex";
});

const btnFecharModal = document.getElementById("fecharModal");
btnFecharModal.addEventListener("click", () => {
  document.getElementById("modalNovo").style.display = "none";
});

async function salvarNovoAtendimento() {
  const nome = document.getElementById("nomeManual").value.trim();
  const telefone = document.getElementById("telefoneManual")?.value.trim() || "";
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

  await addDoc(collection(db, "agendamentos"), {
    nome, telefone, data, periodo, horario, procedimento,
    formaPagamento, valor, desconto, observacoes: obs, concluido: false
  });

  alert("✅ Atendimento adicionado!");
  document.getElementById("modalNovo").style.display = "none";
  document.querySelectorAll("#modalNovo input, #modalNovo textarea").forEach(el => el.value = "");
  carregarAgendamentos();
}
document.getElementById("salvarManual").onclick = salvarNovoAtendimento;

document.addEventListener("DOMContentLoaded", () => {
  loginContainer.style.display = "flex";
});

async function exportarPDF(mes) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  let linhas = [];
  let total = 0;

  querySnapshot.forEach(docSnap => {
    const ag = docSnap.data();
    if (ag.data?.startsWith(mes)) {
      const valorFinal = Math.max(
        Number(ag.valor || 0) - Number(ag.desconto || 0),
        0
      );

      total += valorFinal;

      linhas.push([
        ag.nome || "-",
        ag.telefone || "-",
        ag.data.split("-").reverse().join("/"),
        ag.procedimento || "-",
        ag.formaPagamento || "-",
        `R$ ${valorFinal.toFixed(2)}`
      ]);
    }
  });

  if (!linhas.length) {
    alert("Nenhum dado encontrado para este mês.");
    return false;
  }

  pdf.text(`Relatório de Agendamentos - ${mes}`, 14, 15);

  pdf.autoTable({
    startY: 25,
    head: [["Nome", "Telefone", "Data", "Procedimento", "Pagamento", "Valor"]],
    body: linhas,
    styles: { fontSize: 9 }
  });

  const y = pdf.lastAutoTable.finalY || 40;
  pdf.text(`Total do mês: R$ ${total.toFixed(2)}`, 14, y + 10);

  pdf.save(`agendamentos-${mes}.pdf`);
  return true;
}

async function apagarPorMes(mes) {
  const querySnapshot = await getDocs(collection(db, "agendamentos"));

  for (const docSnap of querySnapshot.docs) {
    const ag = docSnap.data();
    if (ag.data?.startsWith(mes)) {
      await deleteDoc(doc(db, "agendamentos", docSnap.id));
    }
  }

  alert(`Agendamentos de ${mes} apagados com sucesso.`);
}


let pdfExportado = false;

btnExportar.onclick = async () => {
  const mes = document.getElementById("filtroMes").value;
  if (mes === "todos") return alert("Selecione um mês.");
  pdfExportado = await exportarPDF(mes);
};

btnApagarMes.onclick = async () => {
  if (!pdfExportado) {
    alert("⚠️ Exporte o PDF antes de apagar.");
    return;
  }

  const mes = document.getElementById("filtroMes").value;
  if (!confirm(`Tem certeza que deseja apagar os dados de ${mes}?`)) return;

  await apagarPorMes(mes);
  pdfExportado = false;
  carregarAgendamentos();
};

const btnEsqueci = document.getElementById("btnEsqueciSenha");
const modalSenha = document.getElementById("modalSenha");
const fecharSenha = document.getElementById("fecharSenha");
const enviarSenha = document.getElementById("enviarSenha");

btnEsqueci.onclick = () => modalSenha.style.display = "flex";
fecharSenha.onclick = () => modalSenha.style.display = "none";

enviarSenha.onclick = () => {
  const email = document.getElementById("emailRecuperacao").value;
  const senha = document.getElementById("novaSenha").value;

  if (!email || !senha) {
    alert("Preencha todos os campos.");
    return;
  }

  const mensagem = `
🔐 *Solicitação de Alteração de Senha*

📧 Email: ${email}
🔑 Nova senha: ${senha}

Solicitação enviada pelo Painel Administrativo.
  `;

  const whatsapp = `https://wa.me/5546999711937?text=${encodeURIComponent(mensagem)}`;
  window.open(whatsapp, "_blank");

  modalSenha.style.display = "none";
};