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
  "👋 Olá, MARAVILHOSA! ✨💖\nSeja muito bem-vinda(o) ao autoatendimento da Ana Luiza Fernandes Makeup!\nPara começarmos, qual é o seu nome? 😊",
  "Perfeito! Agora, poderia me informar seu número de telefone com DDD? 📞",
  "Que prazer falar com você! 💕 Qual é o seu Instagram? (se preferir não informar, digite 'pular')",
  "Escolha a data:",
  "Qual período prefere? (Manhã, Tarde, Noite)",
  "Quais procedimentos deseja?",
  "Qual a forma de pagamento? (PIX, Dinheiro, Cartão de Crédito, Cartão de Débito)"
];

let inactivityTimer;
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    botMessage("⏳ Notei que você ficou um tempinho sem responder, então reiniciei nosso atendimento. Vamos começar de novo? 😊");
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
    "Maquiagem Express": 105,
    "Brow Lamination": 120,
    "Brow Lamination + Henna": 135,
    "Baby Liss": 60,
    "Rabo Clássico": 80,
    "Semipreso Romântico": 90,
    "Semipreso com Tranças": 100,
    "Coque Express": 120,
    "Lash Lift": 120,
    "Design Personalizado": 35,
    "Design Personalizado + Tintura": 45,
    "Design Personalizado + Henna": 45,
    "Depilação de Buço": 15
  };

  let total = 0;

  const procedimentos = procedimentosTexto
    .split(",")
    .map(p =>
      p.replace(/^[^\p{L}\d]+/u, "")
       .split(" - ")[0]
       .trim()
    );

  for (const nome in mapaPrecos) {
    if (procedimentos.includes(nome)) {
      total += mapaPrecos[nome];
    }
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
    botMessage("🎉 Prontinho! Recebi todas as suas informações. Te chamo no WhatsApp para confirmar tudo certinho. Até já! 💕");
  }
}

// --- Períodos ---
function showPeriods() {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';
  botMessage("Ótimo! 😊 Qual período do dia fica melhor para você?");
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
  botMessage(`Perfeito! Agora escolha o horário (${period}): 🕒`);
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
  if (question === questions[6]) {
    botMessage("Quase lá! 💳 Qual será a forma de pagamento?");
  } else {
    botMessage(question);
  }
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
  botMessage('Agora vamos marcar a data! 📅 Escolha o mês e o dia:');
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
  botMessage("💄 Agora me conta, quais procedimentos você gostaria de fazer? (pode escolher mais de um)");
  const procedures = [
    "💄 Maquiagem Social - R$ 135,00",
    "⚡ Maquiagem Express - R$ 105,00",
    "🌿 Brow Lamination - R$ 120,00",
    "🌿 Brow Lamination + Henna - R$ 135,00",
    "✨ Baby Liss - R$ 60,00",
    "🌸 Semipreso Romântico - R$ 90,00",
    "🌺 Semipreso com Tranças - R$ 100,00",
    "👑 Coque Express - R$ 120,00",
    "🎀 Rabo Clássico - R$ 80,00",
    "👁️ Lash Lift - R$ 120,00",
    "✏️ Design Personalizado - R$ 35,00",
    "🎨 Design Personalizado + Tintura - R$ 45,00",
    "🌙 Depilação de Buço - R$ 15,00"
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

function formatarTelefone(tel) {
  if (!tel) return "";

  // Remove tudo que não for número
  const numeros = tel.replace(/\D/g, "");

  // Remove o código do país (55), se existir
  const telefone = numeros.startsWith("55")
    ? numeros.slice(2)
    : numeros;

  // Deve ficar com DDD + número
  if (telefone.length < 10 || telefone.length > 11) {
    return tel; // ou return "";
  }

  const ddd = telefone.slice(0, 2);
  const numero = telefone.slice(2);

  if (numero.length === 9) {
    return `(${ddd}) ${numero.slice(0, 5)}-${numero.slice(5)}`;
  } else {
    return `(${ddd}) ${numero.slice(0, 4)}-${numero.slice(4)}`;
  }
}

async function sendToWhatsAppAndFirestore() {
const mensagem = 
  `Oi Ana! 💕 Tudo bem?\n` +
  `Acabei de fazer meu agendamento pelo autoatendimento do site e ficaria super feliz em confirmar com você! ✨\n\n` +
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

    // Remove tudo que não for número
    const numeros = input.replace(/\D/g, "");

    // Remove o código do país (55), se existir
    const telefone = numeros.startsWith("55")
      ? numeros.slice(2)
      : numeros;

    // Aceita DDD + número (10 ou 11 dígitos)
    if (telefone.length !== 10 && telefone.length !== 11) {
      botMessage(
        "⚠️ Número inválido!\n\nVocê pode digitar:\n" +
        "• (46) 99999-9999\n" +
        "• 46 99999-9999\n" +
        "• 46999999999\n" +
        "• +55 46 99999-9999"
      );
      return;
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