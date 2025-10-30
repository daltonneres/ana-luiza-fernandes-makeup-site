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

// --- Perguntas do fluxo ---
const questions = [
  "👋 Olá, MARAVILHOSA! ✨💖\nSeja bem-vinda(o) ao autoatendimento da Ana Luiza Fernandes Makeup!\nPor favor, me diga seu nome para começarmos a te atender com todo carinho:",
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
  }, 30000); // 30 segundos
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

// --- Função para calcular valor total ---
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

// --- Fluxo principal ---
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

// --- Mostrar períodos e horários ---
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
    btn.style.margin = '3px';
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
  botMessage(`Escolha o horário desejado (${period}):`);
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
    btn.style.margin = '3px';
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

// --- Opções gerais ---
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
    btn.style.margin = '3px';
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

function showCalendar() {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';

  botMessage('Escolha o mês e o dia desejado:');

  const calendarContainer = document.createElement('div');
  calendarContainer.id = 'calendarContainer';
  chatMessages.appendChild(calendarContainer);

  // Meses disponíveis
  const monthsAvailable = [
    { name: "Novembro 2025", month: 10, year: 2025 },
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
  ];

  // Dropdown de meses
  const monthSelect = document.createElement('select');
  monthSelect.className = 'chat-option-select';
  monthsAvailable.forEach(opt => {
    const option = document.createElement('option');
    option.value = JSON.stringify({ year: opt.year, month: opt.month });
    option.textContent = opt.name;
    monthSelect.appendChild(option);
  });
  calendarContainer.appendChild(monthSelect);

  // Div dos dias
  const daysDiv = document.createElement('div');
  daysDiv.id = 'calendarDays';
  daysDiv.style.marginTop = '10px';
  calendarContainer.appendChild(daysDiv);

  // Renderiza os dias
  function renderDays(year, month) {
    daysDiv.innerHTML = '';
    const lastDay = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= lastDay; i++) {
      const btn = document.createElement('button');
      btn.className = 'chat-option-btn';
      btn.innerText = i;
      btn.style.margin = '3px';

      btn.onclick = () => {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        answers["Escolha a data:"] = dateString;
        userMessage(dateString);
        calendarContainer.remove();
        step++;
        askNext();
        resetInactivityTimer();
      };

      daysDiv.appendChild(btn);
    }
  }

  // Mostra inicialmente Novembro/2025
  renderDays(2025, 10);

  // Atualiza conforme o mês escolhido
  monthSelect.addEventListener('change', (e) => {
    const { year, month } = JSON.parse(e.target.value);
    renderDays(year, month);
    resetInactivityTimer();
  });
}

// --- Procedimentos ---
function showProcedures() {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';

  botMessage("Quais procedimentos deseja? (Clique em todos que quiser e depois em 'Concluir')");
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

  const selectedProcedures = [];
  const optionsDiv = document.createElement('div');
  optionsDiv.id = 'optionsDiv';
  chatMessages.appendChild(optionsDiv);

  procedures.forEach(proc => {
    const btn = document.createElement('button');
    btn.className = "chat-option-btn";
    btn.innerText = proc;
    btn.style.margin = '3px';
    btn.onclick = () => {
      if (!selectedProcedures.includes(proc)) {
        selectedProcedures.push(proc);
        btn.style.backgroundColor = "#00bcd4";
      } else {
        selectedProcedures.splice(selectedProcedures.indexOf(proc), 1);
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
  doneBtn.style.margin = '5px';
  doneBtn.onclick = () => {
    if (selectedProcedures.length === 0) return;
    answers[questions[step]] = selectedProcedures.join(", ");
    userMessage(selectedProcedures.join(", "));
    optionsDiv.remove();
    step++;
    askNext();
    resetInactivityTimer();
  };
  optionsDiv.appendChild(doneBtn);
}

// --- Envia para WhatsApp e salva no Firestore ---
async function sendToWhatsAppAndFirestore() {
  const mensagem = `Olá! Gostaria de agendar um horário:\n\n` +
    `Nome: ${answers[questions[0]]}\n` +
    `Instagram: ${answers[questions[1]]}\n` +
    `Período: ${answers["Qual período prefere? (Manhã, Tarde, Noite)"]}\n` +
    `Horário: ${answers["Escolha o horário"]}\n` +
    `Procedimentos: ${answers[questions[3]]}\n` +
    `Data: ${answers[questions[4]]}\n` +
    `Pagamento: ${answers[questions[5]]}`;

  const telefone = "554699401775";
  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');

  // Salva no Firestore
  try {
    await addDoc(collection(db, "agendamentos"), {
      nome: answers[questions[0]],
      horario: answers["Escolha o horário"],
      data: answers[questions[4]],
      procedimento: answers[questions[3]],
      formaPagamento: answers[questions[5]],
      valor: calcularValor(answers[questions[3]])
    });
    console.log("✅ Agendamento salvo no Firestore!");
  } catch (e) {
    console.error("❌ Erro ao salvar no Firestore:", e);
  }
}

// --- Captura input manual ---
sendBtn.addEventListener('click', () => {
  const input = userInput.value.trim();
  if (!input) return;

  userMessage(input);
  answers[questions[step]] = input.toLowerCase() === 'pular' ? 'Não informado' : input;

  userInput.value = '';
  step++;
  askNext();
  resetInactivityTimer();
});

// --- Inicializa ---
document.addEventListener("DOMContentLoaded", () => {
  // Mostrar imediatamente a primeira pergunta
  botMessage(questions[0]);
  resetInactivityTimer();
});

