const STORAGE_KEY = 'partitura-viva-v1';
const labels = { misturado: 'Misturado', claveSol: 'Clave de sol', claveFa: 'Clave de fá', ritmos: 'Figuras rítmicas', compassos: 'Compassos', expressao: 'Expressão', cabecas: 'Cabeças de nota' };
const topics = ['claveSol', 'claveFa', 'ritmos', 'compassos', 'expressao', 'cabecas'];
const noteLetters = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'];
const letterBase = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const clefBase = { sol: { letter: 'E', octave: 4 }, fa: { letter: 'G', octave: 2 } };
const figures = [
  { name: 'Semibreve', value: 4, open: true, stem: false, flags: 0 },
  { name: 'Mínima', value: 2, open: true, stem: true, flags: 0 },
  { name: 'Semínima', value: 1, open: false, stem: true, flags: 0 },
  { name: 'Colcheia', value: 0.5, open: false, stem: true, flags: 1 },
  { name: 'Semicolcheia', value: 0.25, open: false, stem: true, flags: 2 },
  { name: 'Fusa', value: 0.125, open: false, stem: true, flags: 3 }
];
const meters = [
  { symbol: '2/4', top: 2, bottom: 4, pulse: 'semínima', grouping: '2 tempos de semínima' },
  { symbol: '3/4', top: 3, bottom: 4, pulse: 'semínima', grouping: '3 tempos de semínima' },
  { symbol: '4/4', top: 4, bottom: 4, pulse: 'semínima', grouping: '4 tempos de semínima' },
  { symbol: '2/2', top: 2, bottom: 2, pulse: 'mínima', grouping: '2 tempos de mínima' },
  { symbol: '6/8', top: 6, bottom: 8, pulse: 'colcheia', grouping: '6 colcheias, geralmente agrupadas em 2 grupos de 3' }
];
const expressions = [
  { symbol: 'p', name: 'Piano', meaning: 'Toque suave, com pouca intensidade.' },
  { symbol: 'f', name: 'Forte', meaning: 'Toque forte, com bastante intensidade.' },
  { symbol: 'mp', name: 'Mezzo-piano', meaning: 'Toque moderadamente suave.' },
  { symbol: 'mf', name: 'Mezzo-forte', meaning: 'Toque moderadamente forte.' },
  { symbol: 'pp', name: 'Pianissimo', meaning: 'Toque muito suave.' },
  { symbol: 'ff', name: 'Fortissimo', meaning: 'Toque muito forte.' },
  { symbol: 'cresc.', name: 'Crescendo', meaning: 'Aumente a intensidade aos poucos.' },
  { symbol: 'dim.', name: 'Diminuendo', meaning: 'Diminua a intensidade aos poucos.' },
  { symbol: '·', name: 'Staccato', meaning: 'Toque curto e separado das notas vizinhas.' },
  { symbol: '—', name: 'Tenuto', meaning: 'Sustente a nota por todo o seu valor.' },
  { symbol: '>', name: 'Acento', meaning: 'Destaque a nota com mais ênfase.' },
  { symbol: '⌒', name: 'Ligadura de expressão', meaning: 'Ligue as notas com suavidade, sem interromper o som.' },
  { symbol: '𝄐', name: 'Fermata', meaning: 'Prolongue a nota ou pausa, a critério musical.' }
];

let data = loadData();
let currentMode = 'misturado';
let currentQuestion = null;
let selectedAnswer = null;
let answered = false;
let questionNumber = 0;
let soundOn = false;

function freshData() { return { points: 0, correct: 0, streak: 0, best: 0, byMode: {} }; }
function loadData() {
  try { return { ...freshData(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return freshData(); }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); updateProgress(); }
function rand(max) { return Math.floor(Math.random() * max); }
function pick(array) { return array[rand(array.length)]; }
function shuffle(array) { return [...array].sort(() => Math.random() - .5); }
function unique(array) { return [...new Set(array)]; }
function el(selector, root = document) { return root.querySelector(selector); }
function esc(value) { return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function go(view) {
  document.querySelectorAll('.view').forEach(section => section.classList.toggle('active', section.id === `view-${view}`));
  document.querySelectorAll('.nav-link').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  if (view === 'progresso') updateProgress();
  if (view === 'aprender') renderLessons();
  if (view === 'partituras') renderScores();
  el('#main').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nameAt(clef, step) {
  const base = clefBase[clef];
  const raw = letterBase[base.letter] + step;
  const letterIndex = ((raw % 7) + 7) % 7;
  return noteLetters[letterIndex];
}

function staffSvg(clef, step) {
  const bottom = 104, gap = 12, y = bottom - step * gap / 2, xNote = 255;
  let lines = '';
  for (let i = 0; i < 5; i++) lines += `<line class="staff-line" x1="48" y1="${bottom - i * gap}" x2="406" y2="${bottom - i * gap}"/>`;
  let ledgers = '';
  if (step <= -2) for (let i = -2; i >= step; i -= 2) ledgers += `<line class="ledger" x1="${xNote - 22}" y1="${bottom - i * gap / 2}" x2="${xNote + 22}" y2="${bottom - i * gap / 2}"/>`;
  if (step >= 10) for (let i = 10; i <= step; i += 2) ledgers += `<line class="ledger" x1="${xNote - 22}" y1="${bottom - i * gap / 2}" x2="${xNote + 22}" y2="${bottom - i * gap / 2}"/>`;
  const clefGlyph = clef === 'sol' ? '𝄞' : '𝄢';
  return `<svg class="staff-svg" viewBox="0 0 440 135" role="img" aria-label="Pentagrama na clave de ${clef === 'sol' ? 'sol' : 'fá'}, com uma nota para identificar"><g>${lines}${ledgers}</g><text x="15" y="83" font-size="61" font-family="Segoe UI Symbol,serif">${clefGlyph}</text><text x="84" y="18" font-size="9" letter-spacing="1.4">CLAVE DE ${clef.toUpperCase()}</text><ellipse class="note-head" cx="${xNote}" cy="${y}" rx="10" ry="6.5" transform="rotate(-18 ${xNote} ${y})"/><line class="stem" x1="${xNote + 9}" y1="${y - 1}" x2="${xNote + 9}" y2="${y - 48}"/></svg>`;
}

function figureSvg(figure) {
  const fill = figure.open ? '#fff' : '#413c5d';
  const head = `<ellipse cx="75" cy="70" rx="16" ry="10" fill="${fill}" stroke="#413c5d" stroke-width="3" transform="rotate(-18 75 70)"/>`;
  let stem = '';
  if (figure.stem) {
    stem = '<line x1="90" y1="68" x2="90" y2="12" stroke="#413c5d" stroke-width="3"/>';
    for (let i = 0; i < figure.flags; i++) {
      const yy = 14 + i * 12;
      stem += `<path d="M90 ${yy} Q122 ${yy + 2} 102 ${yy + 19 - i * 2}" fill="none" stroke="#413c5d" stroke-width="3" stroke-linecap="round"/>`;
    }
  }
  return `<svg viewBox="0 0 160 100" width="160" height="100" aria-label="Figura de ${esc(figure.name)}">${head}${stem}</svg>`;
}

function noteQuestion(clef) {
  const step = clef === 'sol' ? rand(13) - 2 : rand(13) - 2;
  const answer = nameAt(clef, step);
  const choices = unique([answer, nameAt(clef, step + 1), nameAt(clef, step - 1), nameAt(clef, step + (rand(2) ? 3 : -3))]);
  const mode = clef === 'sol' ? 'claveSol' : 'claveFa';
  return { mode, title: 'Que nota é esta?', sub: `Leia a nota na clave de ${clef === 'sol' ? 'sol' : 'fá'}.`, visual: staffSvg(clef, step), choices: shuffle(choices), answer, explain: `${answer} está ${step % 2 === 0 ? 'sobre uma linha' : 'em um espaço'} da clave de ${clef === 'sol' ? 'sol' : 'fá'}. Consulte o mapa da pauta na explicação para revisar a posição das notas.` };
}

function teachingStaff(clef, kind) {
  const bottom = 112, gap = 20, xNote = 111;
  let lines = '';
  for (let i = 0; i < 5; i++) lines += `<line class="staff-line" x1="42" y1="${bottom - i * gap}" x2="174" y2="${bottom - i * gap}"/>`;
  let notes = '';
  const steps = kind === 'linhas' ? [0, 2, 4, 6, 8] : [1, 3, 5, 7];
  for (const step of steps) {
    const y = bottom - step * gap / 2;
    const name = nameAt(clef, step);
    notes += `<ellipse class="map-head" cx="${xNote}" cy="${y}" rx="8" ry="5" transform="rotate(-18 ${xNote} ${y})"/><text class="map-name" x="206" y="${y + 5}">${name}</text>`;
  }
  const glyph = clef === 'sol' ? '𝄞' : '𝄢';
  const clefName = clef === 'sol' ? 'sol' : 'fá';
  const kindName = kind === 'linhas' ? 'linhas' : 'espaços';
  return `<div class="staff-map"><div class="map-title">Notas nas ${kindName} <span>Clave de ${clefName}</span></div><svg class="map-svg" viewBox="0 0 280 132" role="img" aria-label="Notas nas ${kindName} da clave de ${clefName}, do grave ao agudo"><g>${lines}</g><text x="3" y="91" font-size="57" font-family="Segoe UI Symbol,serif">${glyph}</text>${notes}</svg><div class="map-order">De baixo para cima: ${steps.map(step => nameAt(clef, step)).join(' · ')}</div></div>`;
}

function rhythmLessonVisual() {
  return `<div class="rhythm-visual-grid">${figures.map(figure => `<div class="rhythm-tile">${figureSvg(figure)}<b>${figure.name}</b><span>${figure.value} ${figure.value === 1 ? 'tempo' : 'tempos'}</span></div>`).join('')}</div><div class="visual-note"><b>As pausas</b><span>Cada figura tem uma pausa de mesma duração. A pausa representa silêncio.</span></div>`;
}

function meterLessonVisual() {
  return `<div class="meter-visual-grid"><div class="meter-visual-card"><div class="meter-large">3<small>4</small></div><div class="meter-labels"><b>3 tempos</b><span>cada tempo vale uma semínima</span></div><div class="beat-row"><i>♩</i><i>♩</i><i>♩</i></div></div><div class="meter-visual-card"><div class="meter-large">6<small>8</small></div><div class="meter-labels"><b>6 colcheias</b><span>agrupadas em 2 pulsos de 3</span></div><div class="eighth-groups"><span>● ● ●</span><em></em><span>● ● ●</span></div></div></div><div class="visual-note"><b>Como lembrar</b><span>Número de cima: quantas unidades. Número de baixo: qual figura representa uma unidade.</span></div>`;
}

function expressionLessonVisual() {
  return `<div class="dynamic-visual"><div class="dynamic-label"><b>p</b><span>suave</span></div><div class="dynamic-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="dynamic-label"><b>f</b><span>forte</span></div><div class="dynamic-arrow">cresc. aumenta aos poucos <span>→</span></div></div><div class="articulation-grid"><div><b class="art-symbol">·</b><strong>Staccato</strong><span>curto</span></div><div><b class="art-symbol">—</b><strong>Tenuto</strong><span>sustentado</span></div><div><b class="art-symbol">&gt;</b><strong>Acento</strong><span>destacado</span></div><div><b class="art-symbol">⌒</b><strong>Legato</strong><span>ligado</span></div></div>`;
}

function headsLessonVisual() {
  return `<div class="head-visual-grid"><div class="head-visual-tile">${figureSvg(figures[0])}<b>Semibreve</b><span>cabeça vazia<br>sem haste</span></div><div class="head-visual-tile">${figureSvg(figures[1])}<b>Mínima</b><span>cabeça vazia<br>com haste</span></div><div class="head-visual-tile">${figureSvg(figures[2])}<b>Semínima</b><span>cabeça preenchida<br>com haste</span></div><div class="head-visual-tile">${figureSvg(figures[3])}<b>Colcheia</b><span>cabeça preenchida<br>com bandeirola</span></div></div><div class="visual-note"><b>Posição e formato</b><span>A posição vertical mostra a nota. A cabeça, a haste e as bandeirolas ajudam a mostrar quanto ela dura.</span></div>`;
}

function rhythmQuestion() {
  const figure = pick(figures);
  const distractors = figures.filter(f => f.value !== figure.value).map(f => `${f.value} ${f.value === 1 ? 'tempo' : 'tempos'}`);
  const answer = `${figure.value} ${figure.value === 1 ? 'tempo' : 'tempos'}`;
  return { mode: 'ritmos', title: `Qual é o valor da ${figure.name.toLowerCase()}?`, sub: 'Considere a semínima como 1 tempo, em um compasso simples.', visual: `<div class="notation-box">${figureSvg(figure)}<div class="symbol-caption">${figure.name}</div></div>`, choices: shuffle(unique([answer, ...shuffle(distractors).slice(0, 3)])), answer, explain: `${figure.name} vale ${answer}. Cada figura seguinte vale metade da anterior: semibreve, mínima, semínima, colcheia, semicolcheia e fusa.` };
}

function meterQuestion() {
  const meter = pick(meters);
  const answer = meter.grouping;
  const other = shuffle(meters.filter(m => m.symbol !== meter.symbol).map(m => m.grouping)).slice(0, 3);
  return { mode: 'compassos', title: `Como contar o compasso ${meter.symbol}?`, sub: 'O número de cima conta as unidades; o de baixo indica a figura de referência.', visual: `<div class="meter-card"><div class="meter-mark">${meter.top}<small>${meter.bottom}</small></div><div class="meter-explain">${meter.bottom === 4 ? 'A unidade é a semínima.' : meter.bottom === 2 ? 'A unidade é a mínima.' : 'A unidade indicada é a colcheia.'}</div></div>`, choices: shuffle([answer, ...other]), answer, explain: meter.symbol === '6/8' ? 'Em 6/8 há seis unidades de colcheia; elas costumam se agrupar como 3 + 3, formando dois pulsos compostos.' : `Em ${meter.symbol}, ${answer}. O número de baixo 4 representa semínimas; o número 2 representa mínimas.` };
}

function expressionQuestion() {
  const item = pick(expressions);
  const answer = item.name;
  const distractors = shuffle(expressions.filter(x => x.name !== item.name).map(x => x.name)).slice(0, 3);
  return { mode: 'expressao', title: 'O que este sinal pede ao músico?', sub: 'Reconheça a indicação e imagine como ela muda o som.', visual: `<div class="notation-box"><div class="symbol-display">${esc(item.symbol)}</div><div class="symbol-caption">Sinal musical</div></div>`, choices: shuffle([answer, ...distractors]), answer, explain: `${item.name}: ${item.meaning}` };
}

function headQuestion() {
  const prompts = [
    { symbol: '●', title: 'O que a posição da cabeça da nota no pentagrama indica?', answer: 'A altura da nota', options: ['A altura da nota', 'A intensidade do som', 'A velocidade da música', 'O instrumento que toca'], explain: 'A posição vertical da cabeça no pentagrama indica a altura e o nome da nota. A forma da cabeça, a haste e as bandeirolas ajudam a mostrar sua duração.' },
    { figure: figures[0], title: 'Qual figura tem cabeça vazia e não usa haste?', answer: 'Semibreve', options: ['Semibreve', 'Mínima', 'Semínima', 'Colcheia'], explain: 'A semibreve é desenhada como uma cabeça oval vazia, sem haste. A mínima também tem cabeça vazia, mas usa haste.' },
    { figure: figures[2], title: 'O que diferencia a cabeça da semínima da mínima?', answer: 'A semínima tem cabeça preenchida', options: ['A semínima tem cabeça preenchida', 'A semínima não tem haste', 'A mínima tem bandeirola', 'A mínima tem cabeça preenchida'], explain: 'Na semínima, a cabeça é preenchida e há uma haste. Na mínima, a cabeça é vazia e também há uma haste.' },
    { symbol: '↕', title: 'Se a cabeça da nota sobe uma posição no pentagrama, o que acontece?', answer: 'A nota sobe um grau', options: ['A nota sobe um grau', 'A duração dobra', 'O som fica mais forte', 'O compasso muda'], explain: 'Cada linha ou espaço consecutivo representa o próximo grau da escala. Subir ou descer a cabeça muda a altura, não o volume.' }
  ];
  const item = pick(prompts);
  const visual = item.figure ? `<div class="notation-box">${figureSvg(item.figure)}<div class="symbol-caption">Observe a cabeça, a haste e a bandeirola</div></div>` : `<div class="notation-box"><div class="symbol-display">${item.symbol}</div><div class="symbol-caption">Cabeça de nota no pentagrama</div></div>`;
  return { mode: 'cabecas', title: item.title, sub: 'Observe o símbolo antes de responder.', visual, choices: shuffle(item.options), answer: item.answer, explain: item.explain };
}

function createQuestion() {
  const mode = currentMode === 'misturado' ? pick(topics) : currentMode;
  if (mode === 'claveSol') return noteQuestion('sol');
  if (mode === 'claveFa') return noteQuestion('fa');
  return ({ ritmos: rhythmQuestion, compassos: meterQuestion, expressao: expressionQuestion, cabecas: headQuestion })[mode]();
}

function renderQuestion() {
  currentQuestion = createQuestion(); selectedAnswer = null; answered = false; questionNumber++;
  el('#roundLabel').textContent = `RODADA ${Math.ceil(questionNumber / 10)}`;
  el('#roundPoints').textContent = data.points;
  el('#questionProgress').style.width = `${((questionNumber - 1) % 10 + 1) * 10}%`;
  el('#questionArea').innerHTML = `<div class="question-heading"><h2>${esc(currentQuestion.title)}</h2><p>${esc(currentQuestion.sub)}</p></div>${currentQuestion.visual}`;
  el('#answerArea').innerHTML = `<div class="options-grid">${currentQuestion.choices.map(choice => `<button class="answer-option" data-answer="${esc(choice)}">${esc(choice)}</button>`).join('')}</div>`;
  el('#feedback').hidden = true; el('#feedback').className = 'feedback';
  el('#nextQuestion').disabled = true; el('#nextQuestion').innerHTML = 'Conferir resposta <span>→</span>';
  el('#roundPoints').textContent = data.points;
}

function selectAnswer(button) {
  if (answered) return;
  selectedAnswer = button.dataset.answer;
  document.querySelectorAll('.answer-option').forEach(b => b.classList.toggle('selected', b === button));
  el('#nextQuestion').disabled = false;
}

function checkAnswer() {
  if (!selectedAnswer || answered) return;
  answered = true;
  const correct = selectedAnswer === currentQuestion.answer;
  document.querySelectorAll('.answer-option').forEach(button => {
    button.disabled = true;
    if (button.dataset.answer === currentQuestion.answer) button.classList.add('correct');
    else if (button.dataset.answer === selectedAnswer) button.classList.add('wrong');
  });
  const feedback = el('#feedback');
  feedback.hidden = false; feedback.className = `feedback ${correct ? 'good' : 'bad'}`;
  feedback.innerHTML = `<b>${correct ? 'Muito bem! +10 pontos' : 'Quase! Vamos guardar a ideia.'}</b> ${esc(currentQuestion.explain)}`;
  const topic = data.byMode[currentQuestion.mode] || { attempts: 0, correct: 0 };
  topic.attempts++; if (correct) topic.correct++;
  data.byMode[currentQuestion.mode] = topic;
  if (correct) { data.correct++; data.points += 10; data.streak++; data.best = Math.max(data.best, data.streak); playChime(); }
  else data.streak = 0;
  saveData(); el('#nextQuestion').disabled = false; el('#nextQuestion').innerHTML = 'Próxima pergunta <span>→</span>'; el('#roundPoints').textContent = data.points;
}

function updateProgress() {
  el('#homePoints').textContent = data.points; el('#homeStreak').textContent = data.streak;
  el('#totalPoints').textContent = data.points; el('#totalCorrect').textContent = data.correct; el('#bestStreak').textContent = data.best;
  const list = el('#topicProgressList');
  if (!list) return;
  list.innerHTML = topics.map(mode => {
    const stats = data.byMode[mode] || { attempts: 0, correct: 0 };
    const percent = stats.attempts ? Math.round(stats.correct / stats.attempts * 100) : 0;
    return `<div class="topic-row"><span>${labels[mode]}</span><div class="topic-bar"><i style="width:${percent}%"></i></div><b>${stats.correct}/${stats.attempts}</b></div>`;
  }).join('');
}

const lessons = [
  { icon: '𝄞', tag: 'CLAVE DE SOL', title: 'Notas na clave de sol', text: 'A clave de sol marca a nota Sol na segunda linha a partir de baixo. Depois, cada linha ou espaço vizinho avança uma nota: Dó, Ré, Mi, Fá, Sol, Lá, Si.', visuals: [teachingStaff('sol', 'linhas'), teachingStaff('sol', 'espacos')] },
  { icon: '𝄢', tag: 'CLAVE DE FÁ', title: 'Notas na clave de fá', text: 'A clave de fá marca a nota Fá na quarta linha a partir de baixo. Conte as posições vizinhas para encontrar as outras notas, seguindo a ordem: Dó, Ré, Mi, Fá, Sol, Lá, Si.', visuals: [teachingStaff('fa', 'linhas'), teachingStaff('fa', 'espacos')] },
  { icon: '♩ ♪', tag: 'DURAÇÃO', title: 'Figuras rítmicas e pausas', text: 'As figuras mostram quanto tempo um som dura. Nesta referência, a semínima vale um tempo e cada figura seguinte vale metade da anterior. A pausa correspondente representa silêncio.', visual: rhythmLessonVisual() },
  { icon: '3/4', tag: 'PULSO', title: 'Como ler os compassos', text: 'O número de cima diz quantas unidades há no compasso. O de baixo mostra qual figura representa uma unidade. Observe como o mesmo princípio organiza compassos simples e compostos.', visual: meterLessonVisual() },
  { icon: 'p  f', tag: 'EXPRESSÃO', title: 'Dinâmicas e articulações', text: 'As dinâmicas mostram a intensidade. As articulações orientam como iniciar, sustentar, destacar ou ligar as notas.', visual: expressionLessonVisual() },
  { icon: '●', tag: 'FORMA E POSIÇÃO', title: 'A cabeça da nota', text: 'A posição vertical da cabeça mostra qual nota tocar. O preenchimento, a haste e as bandeirolas ajudam a indicar quanto tempo ela dura.', visual: headsLessonVisual() }
];

function renderLessons() {
  const cards = lessons.map(lesson => `<article class="lesson-card ${lesson.visuals ? 'clef-lesson' : ''}"><p class="eyebrow">${lesson.tag}</p><div class="lesson-symbols">${lesson.icon}</div><h2>${lesson.title}</h2><p>${lesson.text}</p>${lesson.visual ? `<div class="lesson-visual">${lesson.visual}</div>` : ''}${lesson.visuals ? `<div class="clef-maps">${lesson.visuals.join('')}</div>` : ''}${lesson.example ? `<div class="example">${lesson.example}</div>` : ''}</article>`).join('');
  const games = [
    ['claveSol', 'Clave de sol', 'Identifique as notas da clave de sol.'],
    ['claveFa', 'Clave de fá', 'Identifique as notas da clave de fá.'],
    ['ritmos', 'Figuras rítmicas', 'Pratique os valores das figuras.'],
    ['compassos', 'Compassos', 'Leia pulsos e agrupamentos.'],
    ['expressao', 'Expressão musical', 'Reconheça dinâmicas e articulações.'],
    ['cabecas', 'Cabeças de nota', 'Relacione posição e formato.']
  ];
  el('#lessonGrid').innerHTML = `<section class="learning-block"><div class="learning-heading"><span class="step-number">1</span><div><p class="eyebrow">LEIA ANTES DE JOGAR</p><h2>Entenda cada parte da partitura</h2><p>Comece pelas claves e percorra todas as explicações. Os jogos ficam logo abaixo.</p></div></div><div class="lesson-grid">${cards}</div></section><section class="games-block"><div class="learning-heading"><span class="step-number game-step">2</span><div><p class="eyebrow">AGORA, PRATIQUE</p><h2>Escolha um jogo</h2><p>Depois de ler as explicações, escolha um assunto ou misture todos.</p></div></div><div class="game-launch-grid">${games.map(([mode, title, text]) => `<button class="game-launch" data-mode="${mode}"><span>${mode === 'claveSol' ? '𝄞' : mode === 'claveFa' ? '𝄢' : mode === 'ritmos' ? '♩' : mode === 'compassos' ? '4/4' : mode === 'expressao' ? 'ƒ' : '●'}</span><b>${title}</b><small>${text}</small><i>Começar →</i></button>`).join('')}</div><button class="button primary mixed-game" data-mode="misturado">Jogar um pouco de tudo <span>→</span></button></section>`;
}

function startMode(mode) {
  currentMode = labels[mode] ? mode : 'misturado';
  document.querySelectorAll('.mode-button').forEach(button => button.classList.toggle('selected', button.dataset.mode === currentMode));
  go('treinar'); renderQuestion();
}

function playChime() {
  if (!soundOn) return;
  try { const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = 660; gain.gain.setValueAtTime(.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(.08, context.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .19); oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .2); oscillator.onended = () => context.close(); }
  catch { /* Áudio opcional; o exercício continua funcionando sem ele. */ }
}

document.addEventListener('click', event => {
  const goButton = event.target.closest('[data-go]');
  if (goButton) { go(goButton.dataset.go); if (goButton.dataset.go === 'treinar') renderQuestion(); return; }
  const modeButton = event.target.closest('[data-mode]');
  if (modeButton) { startMode(modeButton.dataset.mode); return; }
  const answerButton = event.target.closest('.answer-option');
  if (answerButton) { selectAnswer(answerButton); return; }
  const nav = event.target.closest('[data-view]');
  if (nav) { go(nav.dataset.view); return; }
});

el('#nextQuestion').addEventListener('click', () => answered ? renderQuestion() : checkAnswer());
el('#skipQuestion').addEventListener('click', renderQuestion);
el('#soundToggle').addEventListener('click', event => { soundOn = !soundOn; event.currentTarget.textContent = soundOn ? '♫' : '♪'; event.currentTarget.title = soundOn ? 'Som ligado' : 'Som desligado'; event.currentTarget.setAttribute('aria-pressed', String(soundOn)); });
el('#resetProgress').addEventListener('click', () => { if (!confirm('Quer mesmo apagar todos os pontos e o histórico deste navegador?')) return; data = freshData(); saveData(); });

renderLessons(); updateProgress(); renderQuestion();

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
