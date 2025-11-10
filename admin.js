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

  querySnapshot.forEach((documento) => {
    const ag = documento.data();
    if (!ag.data) return;
    ag.id = documento.id;
    agendamentos.push(ag);
  });

  agendamentos.sort((a, b) => new Date(a.data) - new Date(b.data));

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
        <div class="dropdown">
          <button class="dropbtn">⚙️ Ações</button>
          <div class="dropdown-content">
            <a href="#" class="editarAtendimento" data-id="${ag.id}">✏️ Editar Atendimento</a>
            <a href="#" class="confirmarWhats" 
               data-tel="${ag.telefone}" 
               data-nome="${ag.nome}" 
               data-data="${ag.data}" 
               data-periodo="${ag.periodo}" 
               data-horario="${ag.horario}" 
               data-procedimento="${ag.procedimento}" 
               data-valor="${(ag.valor - (ag.desconto || 0)).toFixed(2)}">💬 Confirmar Agendamento</a>
          </div>
        </div>
      </td>
    `;
    tabelaAgendamentos.appendChild(tr);

    // --- Dropdown responsivo (abre e fecha no clique) ---
document.querySelectorAll(".dropbtn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const dropdown = btn.nextElementSibling;
    const isVisible = dropdown.style.display === "block";

    // Fecha todos antes de abrir outro
    document.querySelectorAll(".dropdown-content").forEach(dc => dc.style.display = "none");

    dropdown.style.display = isVisible ? "none" : "block";
  });
});

// Fecha o menu se clicar fora
window.addEventListener("click", () => {
  document.querySelectorAll(".dropdown-content").forEach(dc => dc.style.display = "none");
});
  });

  totalAgendamentos.textContent = `Total de agendamentos: ${contador}`;
  valorTotal.textContent = `Valor total: R$ ${total.toFixed(2)}`;

  let resumoHTML = "<h4>Formas de Pagamento:</h4><ul>";
  for (const [forma, valor] of Object.entries(pagamentos))
    resumoHTML += `<li>${forma}: R$ ${valor.toFixed(2)}</li>`;
  resumoHTML += "</ul>";
  pagamentosResumo.innerHTML = resumoHTML;

  // --- Botão de Editar Atendimento ---
  document.querySelectorAll(".editarAtendimento").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const querySnapshot = await getDocs(collection(db, "agendamentos"));
      let atendimento = null;

      querySnapshot.forEach((docSnap) => {
        if (docSnap.id === id) atendimento = { id: docSnap.id, ...docSnap.data() };
      });

      if (!atendimento) return alert("Atendimento não encontrado.");

      // Modal de edição
      const modalEdit = document.createElement("div");
      modalEdit.className = "modal";
      modalEdit.style.display = "flex";
      modalEdit.innerHTML = `
        <div class="modal-content">
          <span class="close" id="fecharEditModal" style="cursor:pointer;">&times;</span>
          <h2>✏️ Editar Atendimento</h2>

          <label>Nome:</label>
          <input type="text" id="editNome" value="${atendimento.nome || ""}" />

          <label>Telefone:</label>
          <input type="tel" id="editTelefone" value="${atendimento.telefone || ""}" />

          <label>Data:</label>
          <input type="date" id="editData" value="${atendimento.data || ""}" />

          <label>Período:</label>
          <select id="editPeriodo">
            <option ${atendimento.periodo === "Manhã" ? "selected" : ""}>Manhã</option>
            <option ${atendimento.periodo === "Tarde" ? "selected" : ""}>Tarde</option>
            <option ${atendimento.periodo === "Noite" ? "selected" : ""}>Noite</option>
          </select>

          <label>Horário:</label>
          <input type="time" id="editHorario" value="${atendimento.horario || ""}" />

          <label>Procedimento:</label>
          <input type="text" id="editProcedimento" value="${atendimento.procedimento || ""}" />

          <label>Forma de Pagamento:</label>
          <select id="editPagamento">
            <option ${atendimento.formaPagamento === "PIX" ? "selected" : ""}>PIX</option>
            <option ${atendimento.formaPagamento === "Dinheiro" ? "selected" : ""}>Dinheiro</option>
            <option ${atendimento.formaPagamento === "Cartão de Crédito" ? "selected" : ""}>Cartão de Crédito</option>
            <option ${atendimento.formaPagamento === "Cartão de Débito" ? "selected" : ""}>Cartão de Débito</option>
          </select>

          <label>Valor (R$):</label>
          <input type="number" id="editValor" value="${atendimento.valor || 0}" />

          <label>Desconto (R$):</label>
          <input type="number" id="editDesconto" value="${atendimento.desconto || 0}" />

          <label>Observações:</label>
          <textarea id="editObs">${atendimento.observacoes || ""}</textarea>

          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:12px;">
            <button id="deletarAtendimento" class="btnPerigo">🗑️ Excluir</button>
            <button id="salvarEdit" class="btnPrimario">💾 Salvar Alterações</button>
          </div>
        </div>
      `;
      document.body.appendChild(modalEdit);

      // Fechar modal
      document.getElementById("fecharEditModal").onclick = () => modalEdit.remove();
      modalEdit.addEventListener("click", (ev) => { if (ev.target === modalEdit) modalEdit.remove(); });

      // Salvar alterações
      document.getElementById("salvarEdit").addEventListener("click", async () => {
        const nome = document.getElementById("editNome").value.trim();
        const telefone = document.getElementById("editTelefone").value.trim();
        const data = document.getElementById("editData").value;
        const periodo = document.getElementById("editPeriodo").value;
        const horario = document.getElementById("editHorario").value;
        const procedimento = document.getElementById("editProcedimento").value.trim();
        const formaPagamento = document.getElementById("editPagamento").value;
        const valor = parseFloat(document.getElementById("editValor").value || 0);
        const desconto = parseFloat(document.getElementById("editDesconto").value || 0);
        const observacoes = document.getElementById("editObs").value.trim();

        if (!nome || !data || !procedimento) {
          alert("Preencha os campos obrigatórios!");
          return;
        }

        await updateDoc(doc(db, "agendamentos", id), {
          nome,
          telefone,
          data,
          periodo,
          horario,
          procedimento,
          formaPagamento,
          valor,
          desconto,
          observacoes
        });

        alert("✅ Atendimento atualizado com sucesso!");
        modalEdit.remove();
        carregarAgendamentos();
      });

      // Excluir atendimento
      document.getElementById("deletarAtendimento").addEventListener("click", async () => {
        if (!confirm("Tem certeza que deseja excluir este atendimento?")) return;
        await deleteDoc(doc(db, "agendamentos", id));
        alert("🗑️ Atendimento excluído!");
        modalEdit.remove();
        carregarAgendamentos();
      });
    });
  });

// --- Confirmar Agendamento (WhatsApp) ---
document.querySelectorAll(".confirmarWhats").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const nome = btn.dataset.nome || "Maravilhosa";
    const tel = (btn.dataset.tel || "").replace(/\D/g, "");
    const data = btn.dataset.data ? btn.dataset.data.split("-").reverse().join("/") : "-";
    const periodo = btn.dataset.periodo || "-";
    const horario = btn.dataset.horario || "-";
    const procedimento = btn.dataset.procedimento || "-";
    const valor = btn.dataset.valor || "0,00";

    const localizacao = "https://maps.app.goo.gl/xxxxxxxxx"; // 🔗 substitua pelo link real

    const mensagemBruta = `
Olá ${nome} 😍✨

Passando aqui para te lembrar que o seu agendamento aqui no *Espaço Ana Luiza Makeup* é no dia *${data}*, no período *${periodo}*, às *${horario}*.

Os procedimentos realizados serão: *${procedimento}*.
O valor total ficou em *R$ ${valor}*.

Também segue em anexo a localização do nosso espaço:
${localizacao}

Esperamos você aqui! Beijos 😘✨💖
`;

    const mensagemCodificada = encodeURIComponent(mensagemBruta);

    if (!tel) {
      alert("❌ Número de telefone não informado!");
      return;
    }

    const link = `https://wa.me/55${tel}?text=${mensagemCodificada}`;
    window.open(link, "_blank");
  });
});


  // --- Checkbox de conclusão ---
  document.querySelectorAll(".chkConcluir").forEach((chk) => {
    chk.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const concluido = e.target.checked;
      await updateDoc(doc(db, "agendamentos", id), { concluido });
      if (concluido) alert("💖 Mais um atendimento concluído! Parabéns, Ana! 🎉✨");
    });
  });
}

// --- Apagar todos --- //
btnApagarTudo.addEventListener("click", async () => {
  if (!confirm("Tem certeza que deseja apagar todos os agendamentos?")) return;
  const querySnapshot = await getDocs(collection(db, "agendamentos"));
  for (const docSnap of querySnapshot.docs)
    await deleteDoc(doc(db, "agendamentos", docSnap.id));
  alert("Todos foram apagados!");
  carregarAgendamentos();
});

// --- Novo Atendimento Manual --- //
btnNovoAtendimento.addEventListener("click", () => {
  document.getElementById("modalNovo").style.display = "flex";
});

const btnSalvarManual = document.getElementById("salvarManual");
const btnFecharModal = document.getElementById("fecharModal");
btnFecharModal.addEventListener("click", () => {
  document.getElementById("modalNovo").style.display = "none";
});

btnSalvarManual.addEventListener("click", async () => {
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
    nome,
    telefone,
    data,
    periodo,
    horario,
    procedimento,
    formaPagamento,
    valor,
    desconto,
    observacoes: obs,
    concluido: false
  });

  alert("✅ Atendimento adicionado!");
  document.getElementById("modalNovo").style.display = "none";
  document.querySelectorAll("#modalNovo input, #modalNovo textarea").forEach(el => el.value = "");
  carregarAgendamentos();
});

document.addEventListener("DOMContentLoaded", () => {
  loginContainer.style.display = "flex";
});
