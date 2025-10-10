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
  "👋 Olá, MARAVILHOSA! ✨💖\nSeja bem-vinda(o) ao autoatendimento da Ana Luiza Fernandes Makeup!\nPor favor, me diga seu nome para começarmos a te atender com todo carinho:",
  "Prazer em falar com você! Qual seu Instagram? (opcional, digite 'pular')",
  "Qual período prefere? (Manhã, Tarde, Noite)",
  "Quais procedimentos deseja?",
  "Escolha a data:",
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

// --- Função para enviar os dados à Google Planilha via POST ---
function sendToGoogleSheets() {
  const valorProcedimentos = answers[questions[3]]
    .split(',')
    .map(p => {
      const match = p.match(/\d+,\d+|\d+/);
      return match ? parseFloat(match[0].replace(',', '.')) : 0;
    })
    .reduce((acc, val) => acc + val, 0);

  const payload = {
    nome: answers[questions[0]],
    instagram: answers[questions[1]],
    periodo: answers["Qual período prefere? (Manhã, Tarde, Noite)"],
    horario: answers["Escolha o horário"],
    procedimentos: answers[questions[3]],
    data: answers[questions[4]],
    pagamento: answers[questions[5]],
    valor: valorProcedimentos.toFixed(2)
  };

fetch("https://script.google.com/macros/s/SEU_DEPLOY_ID/exec", {
  method: "POST",
  body: JSON.stringify({
    nome: answers[questions[0]],
    instagram: answers[questions[1]],
    periodo: answers["Qual período prefere? (Manhã, Tarde, Noite)"],
    horario: answers["Escolha o horário"],
    procedimentos: answers[questions[3]],
    data: answers[questions[4]],
    pagamento: answers[questions[5]],
    valor: valorProcedimentos.toFixed(2)
  }),
  headers: {
    "Content-Type": "application/json"
  }
})
.then(res => res.json())
.then(res => console.log("Planilha:", res))
.catch(err => console.error("Erro ao enviar para a planilha:", err));
}

// --- Fluxo principal ---
function askNext() {
  if (step < questions.length) {
    const question = questions[step];

    if (question === "Qual período prefere? (Manhã, Tarde, Noite)") showPeriods();
    else if (question === "Quais procedimentos deseja?") showProcedures();
    else if (question === "Escolha a data:") showCalendar();
    else if (question.includes("pagamento")) showOptions(question);
    else botMessage(question);
  } else {
    sendToGoogleSheets(); // envia para a planilha
    sendToWhatsApp();     // envia para WhatsApp
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

// --- Mostrar opções ---
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

// --- Mostrar calendário ---
function showCalendar() {
  userInput.style.display = 'none';
  sendBtn.style.display = 'none';
  botMessage('Escolha um dia do mês:');
  const calendarDiv = document.createElement('div');
  calendarDiv.id = 'calendarDiv';
  chatMessages.appendChild(calendarDiv);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i <= lastDay; i++) {
    const btn = document.createElement('button');
    btn.className = "chat-option-btn";
    btn.innerText = i;
    btn.style.margin = '3px';
    btn.onclick = () => {
      answers["Escolha a data:"] = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
      userMessage(answers["Escolha a data:"]);
      calendarDiv.remove();
      step++;
      askNext();
      resetInactivityTimer();
    };
    calendarDiv.appendChild(btn);
  }
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

// --- Envia para WhatsApp ---
function sendToWhatsApp() {
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
  askNext();
  resetInactivityTimer();
});
