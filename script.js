// --- Vídeo em fullscreen ---
const video = document.getElementById("video-thumb");
const fullscreenBtn = document.getElementById("fullscreen-btn");

if (video && fullscreenBtn) {
  fullscreenBtn.addEventListener("click", () => {
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.msRequestFullscreen) video.msRequestFullscreen();
  });
}

// --- Bot de Atendimento ---
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

let step = 0;
const answers = {};

const questions = [
  "👋 Olá, MARAVILHOSA! ✨💖\nSeja bem-vinda(o) ao autoatendimento da Ana Luiza Fernandes Makeup!\nPor favor, me diga seu nome para começarmos:",
  "Perfeito! Agora, poderia me informar seu número de telefone com DDD? 📞",
  "Prazer em falar com você! Qual seu Instagram? (opcional, digite 'pular')",
  "Escolha a data:",
  "Qual período prefere? (Manhã, Tarde, Noite)",
  "Quais procedimentos deseja?",
  "Qual a forma de pagamento? (PIX, Dinheiro, Cartão de Crédito, Cartão de Débito)"
];

let inactivityTimer;
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    botMessage("⚠️ Atendimento encerrado por inatividade. Voltando ao início...");
    chatMessages.innerHTML = "";
    step = 0;
    for (let key in answers) delete answers[key];
    userInput.value = '';
    userInput.style.display = 'block';
    sendBtn.style.display = 'block';
    askNext();
  }, 30000);
}

function botMessage(text) {
  const div = document.createElement('div');
  div.className = 'message bot';
  div.innerText = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function userMessage(text) {
  const div = document.createElement('div');
  div.className = 'message user';
  div.innerText = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Firebase Firestore ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// --- Calcular valor ---
function calcularValor(procedimentosTexto) {
  const mapaPrecos = {
    "Maquiagem Social": 135,
    "Brow Lamination": 120,
    "Maquiagem Express": 105,
    "Baby Liss": 60,
    "Semipreso Romântico": 90,
    "Coque Express": 120,
    "Brow Lamination + Henna": 135,
    "Rabo Clássico": 80,
    "Semipreso com Tranças": 100,
    "Lash Lift": 120,
    "Design Personalizado": 35,
    "Design Personalizado + Tintura": 45,
    "Depilação de Buço": 15
  };

  let total = 0;
  for (const nome in mapaPrecos) {
    if (procedimentosTexto.includes(nome)) total += mapaPrecos[nome];
  }
  return total;
}

// --- Fluxo ---
function askNext() {
  if (step < questions.length) {
    const question = questions[step];
    if (question === "Qual período prefere? (Manhã, Tarde, Noite)") showPeriods();
    else if (question === "Quais procedimentos deseja?") showProcedures();
    else if (question === "Escolha a data:") showCalendar();
    else if (question === "Qual a forma de pagamento? (PIX, Dinheiro, Cartão de Crédito, Cartão de Débito)") showOptions(question);
    else botMessage(question);
  } else {
    sendToWhatsAppAndFirestore();
    botMessage("🎉 Obrigada por preencher todas as informações! Voltaremos em breve.");
  }
}

// --- Períodos ---
function showPeriods() {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';
  botMessage("Qual período prefere?");
  const periods = ["Manhã", "Tarde", "Noite"];
  const optionsDiv = document.createElement('div');
  optionsDiv.id = 'optionsDiv';
  chatMessages.appendChild(optionsDiv);

  periods.forEach(period => {
    const btn = document.createElement('button');
    btn.className = "chat-option-btn";
    btn.innerText = period;
    btn.onclick = () => {
      answers["Qual período prefere? (Manhã, Tarde, Noite)"] = period;
      userMessage(period);
      optionsDiv.remove();
      showPeriodHours(period);
      resetInactivityTimer();
    };
    optionsDiv.appendChild(btn);
  });
}

function showPeriodHours(period) {
  botMessage(`Escolha o horário (${period}):`);
  const optionsDiv = document.createElement('div');
  optionsDiv.id = 'optionsDiv';
  chatMessages.appendChild(optionsDiv);

  let start, end;
  if (period === "Manhã") { start = 5; end = 11; }
  if (period === "Tarde") { start = 12; end = 17; }
  if (period === "Noite") { start = 18; end = 20; }

  for (let h = start; h <= end; h++) {
    const hour = `${String(h).padStart(2,'0')}:00`;
    const btn = document.createElement('button');
    btn.className = "chat-option-btn";
    btn.innerText = hour;
    btn.onclick = () => {
      answers["Escolha o horário"] = hour;
      userMessage(hour);
      optionsDiv.remove();
      step++;
      askNext();
      resetInactivityTimer();
    };
    optionsDiv.appendChild(btn);
  }
}

// --- Opções ---
function showOptions(question) {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';
  botMessage(question);
  const optionsDiv = document.createElement('div');
  optionsDiv.id = 'optionsDiv';
  chatMessages.appendChild(optionsDiv);

  const options = ["PIX", "Dinheiro", "Cartão de Crédito", "Cartão de Débito"];
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = "chat-option-btn";
    btn.innerText = opt;
    btn.onclick = () => {
      answers[question] = opt;
      userMessage(opt);
      optionsDiv.remove();
      step++;
      askNext();
      resetInactivityTimer();
    };
    optionsDiv.appendChild(btn);
  });
}

// --- Calendário ---
function showCalendar() {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';
  botMessage('Escolha o mês e o dia:');
  const container = document.createElement('div');
  container.id = 'calendarContainer';
  chatMessages.appendChild(container);

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  // --- MESES ATUALIZADOS (NOVEMBRO REMOVIDO + MARÇO E ABRIL INCLUÍDOS) ---
let monthsAvailable = [
  { name: "Dezembro 2025", month: 11, year: 2025 },
  { name: "Janeiro 2026", month: 0, year: 2026 },
  { name: "Fevereiro 2026", month: 1, year: 2026 },
  { name: "Março 2026", month: 2, year: 2026 },
  { name: "Abril 2026", month: 3, year: 2026 },
  { name: "Maio 2026", month: 4, year: 2026 },
  { name: "Junho 2026", month: 5, year: 2026 },
  { name: "Julho 2026", month: 6, year: 2026 },
  { name: "Agosto 2026", month: 7, year: 2026 },
  { name: "Setembro 2026", month: 8, year: 2026 },
  { name: "Outubro 2026", month: 9, year: 2026 }
];

  // --- Remove meses passados automaticamente ---
  monthsAvailable = monthsAvailable.filter(m => {
    return (
      m.year > currentYear ||
      (m.year === currentYear && m.month >= currentMonth)
    );
  });

  const monthSelect = document.createElement('select');
  monthsAvailable.forEach(opt => {
    const option = document.createElement('option');
    option.value = JSON.stringify({ year: opt.year, month: opt.month });
    option.textContent = opt.name;
    monthSelect.appendChild(option);
  });
  container.appendChild(monthSelect);

  const daysDiv = document.createElement('div');
  daysDiv.id = 'calendarDays';
  daysDiv.style.marginTop = '10px';
  container.appendChild(daysDiv);

  function renderDays(year, month) {
    daysDiv.innerHTML = "";
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= lastDay; i++) {
      const btn = document.createElement('button');
      btn.className = "chat-option-btn";
      btn.innerText = i;

      // --- BLOQUEIO AUTOMÁTICO DE DIAS PASSADOS ---
      const isPastDay =
        year === currentYear &&
        month === currentMonth &&
        i < currentDay; // O dia de hoje fica disponível

      if (isPastDay) {
        btn.disabled = true;
        btn.style.opacity = "0.4";
        btn.style.cursor = "not-allowed";
      } else {
        btn.onclick = () => {
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
          answers["Escolha a data:"] = dateString;
          userMessage(dateString);
          container.remove();
          step++;
          askNext();
          resetInactivityTimer();
        };
      }

      daysDiv.appendChild(btn);
    }
  }

  // Exibir automaticamente o primeiro mês válido
  const firstMonth = JSON.parse(monthSelect.value);
  renderDays(firstMonth.year, firstMonth.month);

  // Troca de mês
  monthSelect.addEventListener("change", (e) => {
    const { year, month } = JSON.parse(e.target.value);
    renderDays(year, month);
  });
}

// --- Procedimentos ---
function showProcedures() {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';
  botMessage("Quais procedimentos deseja?");
  const procedures = [
    "Maquiagem Social - R$ 135,00",
    "Brow Lamination - R$ 120,00",
    "Maquiagem Express - R$ 105,00",
    "Baby Liss - R$ 60,00",
    "Semipreso Romântico - R$ 90,00",
    "Coque Express - R$ 120,00",
    "Brow Lamination + Henna - R$ 135,00",
    "Rabo Clássico - R$ 80,00",
    "Semipreso com Tranças - R$ 100,00",
    "Lash Lift - R$ 120,00",
    "Design Personalizado - R$ 35,00",
    "Design Personalizado + Tintura - R$ 45,00",
    "Depilação de Buço - R$ 15,00"
  ];

  const selected = [];
  const optionsDiv = document.createElement('div');
  chatMessages.appendChild(optionsDiv);

  procedures.forEach(proc => {
    const btn = document.createElement('button');
    btn.className = "chat-option-btn";
    btn.innerText = proc;
    btn.onclick = () => {
      if (!selected.includes(proc)) {
        selected.push(proc);
        btn.style.backgroundColor = "#00bcd4";
      } else {
        selected.splice(selected.indexOf(proc), 1);
        btn.style.backgroundColor = "#00e5ff";
      }
      resetInactivityTimer();
    };
    optionsDiv.appendChild(btn);
  });

  const doneBtn = document.createElement('button');
  doneBtn.className = "chat-option-btn";
  doneBtn.innerText = "Concluir";
  doneBtn.style.backgroundColor = "#556b2f";
  doneBtn.style.color = "white";
  doneBtn.onclick = () => {
    if (selected.length === 0) return;
    answers["Quais procedimentos deseja?"] = selected.join(", ");
    userMessage(selected.join(", "));
    optionsDiv.remove();
    step++;
    askNext();
    resetInactivityTimer();
  };
  optionsDiv.appendChild(doneBtn);
}

// --- Enviar para WhatsApp + Firestore ---
function formatarTelefone(tel) {
  // Entrada: 46 999999999
  const [ddd, numero] = tel.split(" ");

  if (numero.length === 9) {
    // Formato 99999-9999
    return `(${ddd}) ${numero.slice(0,5)}-${numero.slice(5)}`;
  } else {
    // Formato 9999-9999
    return `(${ddd}) ${numero.slice(0,4)}-${numero.slice(4)}`;
  }
}

async function sendToWhatsAppAndFirestore() {
const mensagem = 
  `Olá Ana! 💕 Tudo bem?\n` +
  `Estou passando aqui pelo seu atendimento automático e gostaria muito de agendar um horário com você! ✨\n\n` +
  `Aqui estão minhas informações:\n` +
  `👤 Nome: ${answers[questions[0]]}\n` +
  `📞 Telefone: ${formatarTelefone(answers[questions[1]])}\n` +
  `📸 Instagram: ${answers[questions[2]]}\n` +
  `📅 Data escolhida: ${answers["Escolha a data:"]}\n` +
  `🕒 Período: ${answers["Qual período prefere? (Manhã, Tarde, Noite)"]}\n` +
  `⏰ Horário: ${answers["Escolha o horário"]}\n` +
  `💄 Procedimentos desejados: ${answers["Quais procedimentos deseja?"]}\n` +
  `💳 Forma de pagamento: ${answers[questions[6]]}\n\n` +
  `Fico no aguardo da sua confirmação. Obrigado pelo carinho e atenção! ✨🥰`;

  const telefone = "554699401775";
  window.open(`https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');

  try {
    await addDoc(collection(db, "agendamentos"), {
      nome: answers[questions[0]],
      telefone: formatarTelefone(answers[questions[1]]),
      instagram: answers[questions[2]],
      data: answers["Escolha a data:"],
      periodo: answers["Qual período prefere? (Manhã, Tarde, Noite)"],
      horario: answers["Escolha o horário"],
      procedimento: answers["Quais procedimentos deseja?"],
      formaPagamento: answers["Qual a forma de pagamento? (PIX, Dinheiro, Cartão de Crédito, Cartão de Débito)"],
      valor: calcularValor(answers["Quais procedimentos deseja?"]) || 0
    });

    console.log("✅ Agendamento salvo no Firestore!");

  } catch (e) {
    console.error("❌ Erro ao salvar no Firestore:", e);
  }
}

// --- Input manual ---
sendBtn.addEventListener('click', () => {
  const input = userInput.value.trim();

  if (!input) return;

  // --- VALIDAÇÃO EXCLUSIVA DO TELEFONE ---
  if (questions[step] === "Perfeito! Agora, poderia me informar seu número de telefone com DDD? 📞") {
    const telefoneRegex = /^[0-9]{2} [0-9]{8,9}$/; // 00 000000000

    if (!telefoneRegex.test(input)) {
      botMessage("⚠️ Número inválido!\nSiga o formato: 00 000000000");
      return; // não avança
    }
  }

  userMessage(input);
  answers[questions[step]] = input.toLowerCase() === 'pular' ? 'Não informado' : input;
  userInput.value = '';
  step++;
  askNext();
  resetInactivityTimer();
});

// --- Inicializa ---
document.addEventListener("DOMContentLoaded", () => {
  botMessage(questions[0]);
  resetInactivityTimer();
});

// POP-UP DE AVISO
  document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById("popupAviso");
    const fechar = document.getElementById("fecharPopup");
    const entendi = document.getElementById("entendiPopup");

    // abre popup após 1 segundo
    setTimeout(() => {
      popup.classList.add("active");
    }, 1000);

    function fecharPopup() {
      popup.classList.remove("active");
    }

    fechar.addEventListener("click", fecharPopup);
    entendi.addEventListener("click", fecharPopup);

    // fechar clicando fora
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        fecharPopup();
      }
    });
  });