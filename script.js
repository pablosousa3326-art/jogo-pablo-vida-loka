// script.js - lógica do jogo (em português)
// Lista das funções com uma "estrutura" em texto (pode editar/acompanhar)
const BANK = [
  { name: "Álcool", structure: "CH₃–CH₂–OH (ex: Etanol)" },
  { name: "Ácido carboxílico", structure: "R–COOH (ex: CH₃COOH - Ácido acético)" },
  { name: "Aldeído", structure: "R–CHO (ex: CH₃CHO - etanal)" },
  { name: "Cetona", structure: "R–CO–R' (ex: CH₃–CO–CH₃ - propanona)" },
  { name: "Éter", structure: "R–O–R' (ex: CH₃–O–CH₃ - éter dimetílico)" },
  { name: "Éster", structure: "R–COO–R' (ex: CH₃COOCH₃ - acetato de metila)" },
  { name: "Amina", structure: "R–NH₂ / R–NH–R' (ex: metilamina)" },
  { name: "Amida", structure: "R–CONH₂ (ex: etanamida)" },
  { name: "Haleto orgânico", structure: "R–X (X = Cl, Br, I; ex: CH₃Cl)" },
  { name: "Alcano (hidrocarboneto saturado)", structure: "CnH(2n+2) (ex: CH₃–CH₃ - etano)" }
];

// mensagens aleatórias
const POS_MSG = ["Boa! Acertou, futuro químico!", "Mandou bem!", "Acertou! Continua assim!"];
const NEG_MSG = ["Quase lá, tenta de novo!", "Não foi dessa vez — mas tu aprende!", "Errou — mas bora revisar!"];

let questions = [];      // embaralhadas
let currentIndex = 0;
let missed = [];         // itens errados para revisar
let inReviewMissed = false; // se estamos jogando a fase dos erros

// elementos DOM
const startBtn = document.getElementById("startBtn");
const retryMissedBtn = document.getElementById("retryMissedBtn");
const structureEl = document.getElementById("structure");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const currentEl = document.getElementById("current");
const totalEl = document.getElementById("total");
const summaryEl = document.getElementById("summary");

// util: embaralha array (Fisher-Yates)
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// cria perguntas a partir do banco (pode escolher menos itens se desejar)
function prepareGame(useList){
  questions = shuffle(useList.slice());
  currentIndex = 0;
  missed = [];
  inReviewMissed = false;
  renderProgress();
  feedbackEl.textContent = "";
  summaryEl.classList.add("hidden");
  retryMissedBtn.classList.add("hidden");
}

// monta as opções (10 botões com todas as funções)
function renderOptions(correctName){
  optionsEl.innerHTML = "";
  // pegar os nomes e embaralhar
  const names = BANK.map(b=>b.name);
  const shuffled = shuffle(names);
  // garantir que o correto esteja entre as opções
  if(!shuffled.includes(correctName)){
    shuffled[Math.floor(Math.random()*shuffled.length)] = correctName;
  }
  // limitar a 10 (já são 10)
  shuffled.forEach(name=>{
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = name;
    btn.onclick = ()=>handleAnswer(btn, name, correctName);
    optionsEl.appendChild(btn);
  });
}

// mostra a pergunta atual
function renderQuestion(){
  if(currentIndex >= questions.length){
    endRound();
    return;
  }
  const q = questions[currentIndex];
  structureEl.innerHTML = q.structure;
  renderOptions(q.name);
  renderProgress();
}

// atualiza progresso
function renderProgress(){
  currentEl.textContent = Math.min(currentIndex+1, questions.length);
  totalEl.textContent = questions.length;
}

// toca som (Web Audio API) - notas simples
function playTone(freq, duration=0.12, type='sine'){
  try{
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.06;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(()=>{ o.stop(); ctx.close(); }, duration*1000);
  }catch(e){
    // som pode falhar em alguns navegadores sem interação
  }
}

// lógica ao responder
function handleAnswer(buttonEl, chosen, correct){
  // desabilitar todos os botões momentaneamente
  const btns = optionsEl.querySelectorAll(".btn");
  btns.forEach(b => b.disabled = true);

  if(chosen === correct){
    // acerto
    buttonEl.classList.add("correct");
    const msg = POS_MSG[Math.floor(Math.random()*POS_MSG.length)];
    feedbackEl.style.background = "linear-gradient(90deg, rgba(16,185,129,0.12), rgba(6,95,70,0.06))";
    feedbackEl.textContent = msg;
    playTone(880,0.12); // ding
    // avançar
    setTimeout(()=>{
      currentIndex++;
      // se for final e tiver erros, mostrar botão para revisar
      renderQuestion();
      // reabilitar
      btns.forEach(b => b.disabled = false);
    }, 900);
  } else {
    // erro
    buttonEl.classList.add("wrong");
    const neg = NEG_MSG[Math.floor(Math.random()*NEG_MSG.length)];
    feedbackEl.style.background = "linear-gradient(90deg, rgba(239,68,68,0.12), rgba(95,21,21,0.06))";
    feedbackEl.innerHTML = `${neg} A resposta certa era: <strong>${correct}</strong>.`;
    playTone(220,0.2,'sawtooth'); // som "ops"
    // marcar para revisão
    missed.push(questions[currentIndex]);
    setTimeout(()=>{
      currentIndex++;
      renderQuestion();
      btns.forEach(b => b.disabled = false);
    }, 1400);
  }
}

// quando rodada acabar
function endRound(){
  // se foi a fase principal e houve erros, permitir revisar
  if(!inReviewMissed && missed.length > 0){
    feedbackEl.style.background = "linear-gradient(90deg, rgba(250,204,21,0.08), rgba(125,70,0,0.03))";
    feedbackEl.innerHTML = `Fim da rodada! Você errou <strong>${missed.length}</strong>. Pode revisar apenas esses.`;
    retryMissedBtn.classList.remove("hidden");
    summaryEl.classList.remove("hidden");
    summaryEl.innerHTML = `<strong>Erros nesta rodada:</strong><br>` + missed.map(m=>`• ${m.name} — ${m.structure}`).join("<br>");
  } else if(!inReviewMissed){
    // sem erros: vitória
    feedbackEl.style.background = "linear-gradient(90deg, rgba(34,197,94,0.12), rgba(22,163,74,0.03))";
    feedbackEl.textContent = "Parabéns! Tu acertou tudo! 🎉";
    summaryEl.classList.remove("hidden");
    summaryEl.innerHTML = `<strong>Ótimo desempenho — sem erros!</strong>`;
  } else {
    // fim da fase de revisão dos erros
    feedbackEl.style.background = "linear-gradient(90deg, rgba(34,197,94,0.12), rgba(22,163,74,0.03))";
    feedbackEl.textContent = "Revisão finalizada — boas memorização!";
    summaryEl.classList.remove("hidden");
    summaryEl.innerHTML = `<strong>Revisão concluída.</strong> Erros revisados: ${questions.length}`;
  }
}

// iniciar jogo padrão (todas as funções)
startBtn.addEventListener("click", ()=>{
  prepareGame(BANK);
  renderQuestion();
});

// revisar apenas os que errou
retryMissedBtn.addEventListener("click", ()=>{
  if(missed.length === 0) return;
  inReviewMissed = true;
  // preparar novo array com os itens errados (remover duplicatas)
  const unique = [];
  const seen = new Set();
  missed.forEach(it=>{
    if(!seen.has(it.name)){
      unique.push(it);
      seen.add(it.name);
    }
  });
  questions = shuffle(unique);
  currentIndex = 0;
  missed = []; // reset enquanto revisa
  retryMissedBtn.classList.add("hidden");
  renderQuestion();
});

// iniciar a página com botão pronto (sem iniciar imediatamente)
(function init(){
  totalEl.textContent = BANK.length;
})();
