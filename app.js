const STORAGE_KEY = 'partitura-viva-v1';
const labels = { misturado: 'Misturado', claveSol: 'Clave de sol', claveFa: 'Clave de fá', ritmos: 'Figuras rítmicas', compassos: 'Compassos', expressao: 'Expressão', cabecas: 'Cabeças de nota', ouvido: 'Ouvido musical', completar: 'Complete o compasso' };
const topics = ['claveSol', 'claveFa', 'ritmos', 'compassos', 'expressao', 'cabecas', 'ouvido', 'completar'];
const noteLetters = ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'];
const noteMidiByName = { 'Dó':60, 'Ré':62, 'Mi':64, 'Fá':65, 'Sol':67, 'Lá':69, 'Si':71 };
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
const beatLabel = value => ({ 4: '4 tempos', 2: '2 tempos', 1: '1 tempo', 0.5: '½ tempo', 0.25: '¼ tempo', 0.125: '⅛ tempo' })[value] || `${value} tempos`;
const meters = [
  { symbol: '2/4', top: 2, bottom: 4, pulse: 'semínima', grouping: '2 tempos de semínima', simple: true },
  { symbol: '3/4', top: 3, bottom: 4, pulse: 'semínima', grouping: '3 tempos de semínima', simple: true },
  { symbol: '4/4', top: 4, bottom: 4, pulse: 'semínima', grouping: '4 tempos de semínima', simple: true },
  { symbol: '2/2', top: 2, bottom: 2, pulse: 'mínima', grouping: '2 tempos de mínima', simple: true },
  { symbol: '6/8', top: 6, bottom: 8, pulse: 'semínima pontuada', grouping: '2 pulsos de semínima pontuada, cada um dividido em 3 colcheias', simple: false }
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
let activeNoteAudio = null;

function freshData() { return { points: 0, correct: 0, streak: 0, best: 0, byMode: {} }; }
function loadData() {
  try { return { ...freshData(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return freshData(); }
}
function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); updateProgress(); }
function rand(max) { return Math.floor(Math.random() * max); }
function pick(array) { return array[rand(array.length)]; }
function shuffle(array) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index--) {
    const swapWith = rand(index + 1);
    [result[index], result[swapWith]] = [result[swapWith], result[index]];
  }
  return result;
}
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
  const clefY = clef === 'sol' ? 106 : 95;
  const stemUp = step < 4;
  const stemX = xNote + (stemUp ? 9 : -9);
  const stemEnd = y + (stemUp ? -44 : 44);
  return `<svg class="staff-svg" viewBox="0 0 440 135" role="img" aria-label="Pentagrama na clave de ${clef === 'sol' ? 'sol' : 'fá'}, com uma nota para identificar"><g>${lines}${ledgers}</g><text x="15" y="${clefY}" font-size="61" font-family="Segoe UI Symbol,serif">${clefGlyph}</text><text x="84" y="18" font-size="9" letter-spacing="1.4">CLAVE DE ${clef.toUpperCase()}</text><ellipse class="note-head" cx="${xNote}" cy="${y}" rx="10" ry="6.5" transform="rotate(-18 ${xNote} ${y})"/><line class="stem" x1="${stemX}" y1="${y}" x2="${stemX}" y2="${stemEnd}"/></svg>`;
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
  const dot = figure.dotted ? '<circle cx="111" cy="65" r="4" fill="#413c5d"/>' : '';
  return `<svg viewBox="0 0 160 100" width="160" height="100" aria-label="Figura de ${esc(figure.name)}">${head}${stem}${dot}</svg>`;
}

function restSvg(figure) {
  const restGlyphs = { 1: '\u{1D13D}', 0.5: '\u{1D13E}', 0.25: '\u{1D13F}', 0.125: '\u{1D140}' };
  let symbol;
  if (figure.value === 4) {
    // Whole-measure rest: hangs from the fourth staff line.
    symbol = '<rect x="68" y="35" width="24" height="9" rx="1"/>';
  } else if (figure.value === 2) {
    // Half rest: sits on top of the third staff line.
    symbol = '<rect x="68" y="41" width="24" height="9" rx="1"/>';
  } else {
    const glyph = restGlyphs[figure.value];
    symbol = `<text class="rest-glyph" x="80" y="82" text-anchor="middle">${glyph}</text>`;
  }
  const staff = [20, 35, 50, 65, 80].map(y => `<line x1="30" y1="${y}" x2="130" y2="${y}"/>`).join('');
  return `<svg class="rest-symbol" viewBox="0 0 160 100" role="img" aria-label="Pausa de ${esc(figure.name)}"><g class="rest-staff">${staff}</g>${symbol}</svg>`;
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
  return `<div class="rhythm-visual-grid">${figures.map(figure => `<div class="rhythm-tile"><b>${figure.name}</b><span>${beatLabel(figure.value)}</span><div class="rhythm-symbol-pair"><div>${figureSvg(figure)}<small>Som</small></div><div>${restSvg(figure)}<small>Silêncio</small></div></div></div>`).join('')}</div><div class="visual-note"><b>Som e silêncio</b><span>A pausa tem o mesmo valor de duração da figura correspondente, mas representa silêncio.</span></div>`;
}

function meterLessonVisual() {
  const examples = [
    { symbol: '2/4', title: '2 tempos', text: '2 semínimas, uma para cada tempo.', beats: 2, figure: '♩' },
    { symbol: '3/4', title: '3 tempos', text: '3 semínimas, uma para cada tempo.', beats: 3, figure: '♩' },
    { symbol: '4/4', title: '4 tempos', text: '4 semínimas, uma para cada tempo.', beats: 4, figure: '♩' },
    { symbol: '6/8', title: '2 pulsos compostos', text: '2 semínimas pontuadas, uma para cada pulso composto.', beats: 2, figure: '♩.' }
  ];
  return `<div class="meter-visual-grid">${examples.map(meter => `<div class="meter-visual-card"><div class="meter-large"><span>${meter.symbol.split('/')[0]}</span><small>${meter.symbol.split('/')[1]}</small></div><div class="meter-labels"><b>${meter.title}</b><span>${meter.text}</span></div><div class="meter-subdivision-row">${Array.from({ length: meter.beats }, () => `<div class="meter-beat-group"><i>${meter.figure}</i></div>`).join('')}</div></div>`).join('')}</div><div class="visual-note"><b>Figuras do pulso</b><span>Nos compassos simples, cada caixa mostra uma semínima. No 6/8, cada caixa mostra uma semínima pontuada, que representa um pulso composto.</span></div>`;
}

function expressionLessonVisual() {
  return `<div class="dynamic-visual"><div class="dynamic-label"><b>p</b><span>suave</span></div><div class="dynamic-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="dynamic-label"><b>f</b><span>forte</span></div><div class="dynamic-arrow">cresc. aumenta aos poucos <span>→</span></div></div><div class="articulation-grid"><div><b class="art-symbol">·</b><strong>Staccato</strong><span>curto</span></div><div><b class="art-symbol">—</b><strong>Tenuto</strong><span>sustentado</span></div><div><b class="art-symbol">&gt;</b><strong>Acento</strong><span>destacado</span></div><div><b class="art-symbol">⌒</b><strong>Legato</strong><span>ligado</span></div></div>`;
}

function headsLessonVisual() {
  return `<div class="head-visual-grid"><div class="head-visual-tile">${figureSvg(figures[0])}<b>Semibreve</b><span>cabeça vazia<br>sem haste</span></div><div class="head-visual-tile">${figureSvg(figures[1])}<b>Mínima</b><span>cabeça vazia<br>com haste</span></div><div class="head-visual-tile">${figureSvg(figures[2])}<b>Semínima</b><span>cabeça preenchida<br>com haste</span></div><div class="head-visual-tile">${figureSvg(figures[3])}<b>Colcheia</b><span>cabeça preenchida<br>com bandeirola</span></div></div><div class="visual-note"><b>Posição e formato</b><span>A posição vertical mostra a nota. A cabeça, a haste e as bandeirolas ajudam a mostrar quanto ela dura.</span></div>`;
}

function rhythmQuestion() {
  const figure = pick(figures);
  const asksRest = Math.random() < .5;
  const distractors = figures.filter(f => f.value !== figure.value).map(f => beatLabel(f.value));
  const answer = beatLabel(figure.value);
  const visual = asksRest ? restSvg(figure) : figureSvg(figure);
  return { mode: 'ritmos', title: `Qual é o valor ${asksRest ? `da pausa de ${figure.name.toLowerCase()}` : `da ${figure.name.toLowerCase()}`}?`, sub: 'Considere a semínima como 1 tempo, em um compasso simples.', visual: `<div class="notation-box">${visual}<div class="symbol-caption">${asksRest ? `Pausa de ${figure.name.toLowerCase()}` : figure.name}</div></div>`, choices: shuffle(unique([answer, ...shuffle(distractors).slice(0, 3)])), answer, explain: `A ${asksRest ? `pausa de ${figure.name.toLowerCase()}` : figure.name} dura ${answer}. Pausas representam silêncio; cada figura seguinte vale metade da anterior.` };
}

function meterQuestion() {
  const meter = pick(meters);
  const answer = meter.grouping;
  const other = shuffle(meters.filter(m => m.symbol !== meter.symbol).map(m => m.grouping)).slice(0, 3);
  const explanation = meter.simple
    ? `Em ${meter.symbol}, ${answer}. O número de baixo indica a figura que recebe um tempo.`
    : 'Em 6/8 há seis colcheias agrupadas em dois grupos de 3 + 3. Cada grupo forma um pulso de semínima pontuada.';
  const visualText = meter.symbol === '6/8'
    ? '2 pulsos de semínima pontuada; cada pulso se divide em 3 colcheias.'
    : `${meter.top} tempos de ${meter.pulse}.`;
  return { mode: 'compassos', title: `Como contar o compasso ${meter.symbol}?`, sub: 'Observe quantos pulsos há e em quantas partes cada pulso se divide.', visual: `<div class="meter-card"><div class="meter-mark">${meter.top}<small>${meter.bottom}</small></div><div class="meter-explain">${visualText}</div></div>`, choices: shuffle([answer, ...other]), answer, explain: explanation };
}

function audioPitchQuestion() {
  const pitch = pick([
    { note: 'C', name: 'Dó', midi: 60 }, { note: 'D', name: 'Ré', midi: 62 },
    { note: 'E', name: 'Mi', midi: 64 }, { note: 'F', name: 'Fá', midi: 65 },
    { note: 'G', name: 'Sol', midi: 67 }, { note: 'A', name: 'Lá', midi: 69 },
    { note: 'B', name: 'Si', midi: 71 }
  ]);
  const choices = shuffle(unique([pitch.name, ...shuffle(['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'].filter(name => name !== pitch.name)).slice(0, 3)]));
  return { mode: 'ouvido', title: 'Que nota você ouviu?', sub: 'Ouça a pergunta e clique nas opções para comparar o som de cada nota antes de confirmar.', visual: `<div class="ear-game"><span aria-hidden="true">♫</span><button type="button" class="button primary" data-play-midi="${pitch.midi}">▶ Ouvir a nota da pergunta</button><small>Clique em uma opção para ouvir essa nota; você pode comparar várias antes de conferir.</small></div>`, choices, answer: pitch.name, explain: `A nota tocada foi ${pitch.name} (${pitch.note}4).` };
}

const completionOptions = [
  { units: 1, label: '1 colcheia' }, { units: 2, label: '1 semínima' },
  { units: 3, label: '1 semínima pontuada' }, { units: 4, label: '1 mínima' }
];
function completeMeasureQuestion() {
  const meter = pick(meters.filter(item => ['2/4', '3/4', '4/4', '6/8'].includes(item.symbol)));
  const groupSize = meter.bottom === 8 ? 3 : 2;
  const units = meter.top * (8 / meter.bottom);
  const answer = pick(completionOptions.filter(item => item.units < units));
  const filledUnits = units - answer.units;
  const cells = Array.from({ length: filledUnits }, (_, index) => `<span class="measure-unit filled ${index > 0 && index % groupSize === 0 ? 'group-start' : ''}" aria-label="colcheia preenchida">♪</span>`).join('');
  const blank = `<span class="measure-missing" style="grid-column:span ${answer.units}" aria-label="espaço que falta">?</span>`;
  const choices = shuffle(completionOptions.map(item => item.label));
  const beatText = meter.bottom === 8 ? '2 pulsos compostos, cada um dividido em 3 colcheias' : `${meter.top} tempos de semínima`;
  return { mode: 'completar', title: `Complete o compasso ${meter.symbol}`, sub: `O compasso tem ${beatText}. Cada quadrinho representa uma colcheia.`, visual: `<div class="measure-game"><div class="measure-time">${meter.top}<small>${meter.bottom}</small></div><div class="measure-bar" style="--unit-count:${units}">${cells}${blank}</div><div class="measure-key"><span>♪ Parte já preenchida</span><span>? Figura que falta</span></div></div>`, choices, answer: answer.label, explain: `O compasso ${meter.symbol} tem ${units} colcheias de duração. As notas já ocupam ${filledUnits}; faltam ${answer.units}, equivalentes a ${answer.label.toLowerCase()}.` };
}

async function playQuestionNote(midi) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    if (activeNoteAudio) { await activeNoteAudio.close().catch(() => {}); activeNoteAudio = null; }
    const context = new AudioContextClass(); activeNoteAudio = context; await context.resume();
    const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime;
    oscillator.type = 'sine'; oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.16, now + 0.035); gain.gain.setValueAtTime(0.16, now + 0.48); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);
    oscillator.connect(gain); gain.connect(context.destination); oscillator.onended = () => { if (activeNoteAudio === context) { activeNoteAudio = null; context.close().catch(() => {}); } };
    oscillator.start(now); oscillator.stop(now + 0.7);
  } catch { activeNoteAudio = null; }
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
  return ({ ritmos: rhythmQuestion, compassos: meterQuestion, expressao: expressionQuestion, cabecas: headQuestion, ouvido: audioPitchQuestion, completar: completeMeasureQuestion })[mode]();
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
  if (currentQuestion?.mode === 'ouvido' && noteMidiByName[selectedAnswer]) playQuestionNote(noteMidiByName[selectedAnswer]);
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
  const courseList = el('#courseProgressList');
  if (courseList) {
    let instruments = {}, harmony = {};
    try { instruments = JSON.parse(localStorage.getItem('musica-em-jogo-instrument-progress') || '{}'); } catch { instruments = {}; }
    try { harmony = JSON.parse(localStorage.getItem('musica-em-jogo-harmony-progress') || '{}'); } catch { harmony = {}; }
    const scores = [
      { name: 'Partitura', detail: 'Respostas corretas', value: data.correct, total: Object.values(data.byMode).reduce((sum, item) => sum + (item.attempts || 0), 0) },
      { name: 'Harmonia musical', detail: 'Pontos no jogo', value: harmony.points || 0, total: harmony.questions || 0 },
      { name: 'Teclado', detail: 'Pontos no jogo', value: instruments.teclado?.points || 0, total: instruments.teclado?.questions || 0 },
      { name: 'Violão', detail: 'Pontos no jogo', value: instruments.violao?.points || 0, total: instruments.violao?.questions || 0 }
    ];
    courseList.innerHTML = scores.map(item => `<article class="course-progress-card"><span>${item.name}</span><b>${item.value}</b><small>${item.detail} · ${item.total} questões</small></article>`).join('');
  }
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
  el('#lessonGrid').innerHTML = `<section class="learning-block"><div class="learning-heading"><span class="step-number">1</span><div><p class="eyebrow">LEIA ANTES DE JOGAR</p><h2>Entenda cada parte da música</h2><p>Explore as explicações e depois pratique em rodadas que misturam os assuntos.</p></div></div><div class="lesson-grid">${cards}</div></section><section class="games-block"><div class="learning-heading"><span class="step-number game-step">2</span><div><p class="eyebrow">AGORA, PRATIQUE</p><h2>Jogo misturado</h2><p>As perguntas alternam entre notas, ritmo, compassos e ouvido musical automaticamente.</p></div></div><button class="button primary mixed-game" data-mode="misturado">Começar a praticar <span>→</span></button></section>`;
}

function startMode() {
  currentMode = 'misturado';
  questionNumber = 0;
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
  if (modeButton) { startMode(); return; }
  const playMidiButton = event.target.closest('[data-play-midi]');
  if (playMidiButton) { playQuestionNote(Number(playMidiButton.dataset.playMidi)); return; }
  const answerButton = event.target.closest('.answer-option');
  if (answerButton) { selectAnswer(answerButton); return; }
  const nav = event.target.closest('[data-view]');
  if (nav) { go(nav.dataset.view); return; }
});

el('#nextQuestion').addEventListener('click', () => answered ? renderQuestion() : checkAnswer());
el('#skipQuestion').addEventListener('click', renderQuestion);
el('#soundToggle').addEventListener('click', event => { soundOn = !soundOn; event.currentTarget.textContent = soundOn ? '♫' : '♪'; event.currentTarget.title = soundOn ? 'Som ligado' : 'Som desligado'; event.currentTarget.setAttribute('aria-pressed', String(soundOn)); });
el('#resetProgress').addEventListener('click', () => { if (!confirm('Quer mesmo apagar todos os pontos e o histórico deste navegador?')) return; data = freshData(); localStorage.removeItem('musica-em-jogo-instrument-progress'); localStorage.removeItem('musica-em-jogo-harmony-progress'); saveData(); window.location.reload(); });

window.addEventListener('music-go-home', () => go('inicio'));
renderLessons(); updateProgress(); renderQuestion();

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
