(() => {
  const theory = window.MusicHarmony;
  if (!theory) return;
  const handNames = { 1:'Polegar', 2:'Indicador', 3:'Médio', 4:'Anelar', 5:'Mínimo' };
  const noteNames = { C:'Dó', D:'Ré', E:'Mi', F:'Fá', G:'Sol', A:'Lá', B:'Si' };
  const romMaj = ['I','ii','iii','IV','V','vi','vii°'];
  const romMin = { natural:['i','ii°','III','iv','v','VI','VII'], harmonic:['i','ii°','III+','iv','V','VI','vii°'], melodic:['i','ii','III+','IV','V','vi°','vii°'] };
  const instrumentState = {
    teclado: { mode:'major', index:0, kind:'natural', hand:'right', selectedChord:null, completed:0, question:0, points:0, gameOpen:false },
    violao: { mode:'major', index:0, kind:'natural', completed:0, question:0, points:0, gameOpen:false }
  };
  try { const saved = JSON.parse(localStorage.getItem('musica-em-jogo-instrument-progress') || '{}'); for (const kind of Object.keys(instrumentState)) { instrumentState[kind].points = saved[kind]?.points || 0; instrumentState[kind].question = saved[kind]?.questions || 0; instrumentState[kind].completed = saved[kind]?.completed || 0; } } catch { /* Progresso local opcional. */ }
  const saveInstrumentProgress = () => { try { const current = JSON.parse(localStorage.getItem('musica-em-jogo-instrument-progress') || '{}'); for (const kind of Object.keys(instrumentState)) current[kind] = { points:instrumentState[kind].points, questions:instrumentState[kind].question, completed:instrumentState[kind].completed }; localStorage.setItem('musica-em-jogo-instrument-progress', JSON.stringify(current)); } catch { /* O curso continua funcionando sem armazenamento local. */ } };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const modeRoot = (state) => theory.roots[state.mode][state.index];
  const scale = state => theory.getScale(state.mode, state.index, state.kind);
  const chord = (state, index) => theory.getChord(scale(state), index);
  const roman = (state, index) => state.mode === 'major' ? romMaj[index] : romMin[state.kind][index];
  const chordType = notes => theory.getQuality(notes).type;
  const chordTitle = notes => `${theory.getChordName(notes)} (${notes.join(' · ')})`;

  const noteAudio = async (note, octave = 4) => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      const ctx = new Audio(); await ctx.resume();
      const osc = ctx.createOscillator(), gain = ctx.createGain(), midi = 12 * (octave + 1) + theory.getNoteMidi(note);
      osc.type = 'triangle'; osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      gain.gain.setValueAtTime(.0001, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.12, ctx.currentTime + .03); gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .55);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .58); osc.onended = () => ctx.close().catch(() => {});
    } catch { /* O conteúdo do curso continua acessível sem áudio. */ }
  };
  const chordAudio = async notes => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      const ctx = new Audio(); await ctx.resume();
      notes.forEach(note=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.value=440*Math.pow(2,(12*5+theory.getNoteMidi(note)-69)/12);gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.075,ctx.currentTime+.035);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.8);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.82)});
      setTimeout(()=>ctx.close().catch(()=>{}),950);
    } catch { /* Áudio demonstrativo opcional. */ }
  };

  const selector = state => `<div class="instrument-key-select"><div class="instrument-key-row"><b>Tons maiores</b><div>${theory.roots.major.map((item, i) => `<button class="instrument-key-chip ${state.mode === 'major' && state.index === i ? 'selected' : ''}" data-instrument-key="major:${i}" aria-pressed="${state.mode === 'major' && state.index === i}">${item.root}</button>`).join('')}</div></div><div class="instrument-key-row"><b>Tons menores</b><div>${theory.roots.minor.map((item, i) => `<button class="instrument-key-chip ${state.mode === 'minor' && state.index === i ? 'selected' : ''}" data-instrument-key="minor:${i}" aria-pressed="${state.mode === 'minor' && state.index === i}">${item.root}m</button>`).join('')}</div></div></div>`;
  const scaleTypeTabs = state => state.mode === 'major' ? '' : `<div class="instrument-scale-tabs">${[['natural','Menor natural'],['harmonic','Menor harmônica'],['melodic','Menor melódica']].map(([kind,label]) => `<button class="${state.kind === kind ? 'selected' : ''}" data-instrument-scale="${kind}">${label}</button>`).join('')}</div>`;
  const fieldRows = (state, guitar = false) => scale(state).map((_, index) => {
    const notes = chord(state, index), name = theory.getChordName(notes), fingering = guitar ? guitarDiagram(notes) : '';
    return `<article class="instrument-field-card ${guitar ? 'guitar-field-card' : ''}"><div class="instrument-field-title"><span>${roman(state,index)}</span><b>${name || '?'}</b><small>${chordType(notes)}</small></div><p class="instrument-chord-notes">${notes.join(' · ')}</p>${guitar ? fingering : `<div class="piano-fingering"><span>Mão direita</span><b>1 · 3 · 5</b><span>Mão esquerda</span><b>5 · 3 · 1</b></div><button class="text-button instrument-show-chord ${state.selectedChord === index ? 'selected' : ''}" data-show-chord="${index}" aria-pressed="${state.selectedChord === index}">Mostrar no teclado</button><button class="text-button instrument-listen" data-play-chord="${index}">Ouvir o acorde</button>`}</article>`;
  }).join('');
  const lessonNav = (type, title, labels) => `<div class="local-module-nav instrument-local-nav"><button data-instrument-home>← Instrumentos</button>${labels.map(([target,label]) => `<a href="#${type}-${target}" class="${target === 'curso' ? 'selected' : ''}">${label}</a>`).join('')}</div>`;
  const keyboard = (state) => {
    const notes = [...theory.roots.major[0].notes,...theory.roots.major[0].notes,'C'];
    const right = [1,2,3,1,2,3,4,1,2,3,1,2,3,4,5], left = [5,4,3,2,1,3,2,1,4,3,2,1,3,2,1], digits = state.hand === 'right' ? right : left;
    const octave = index => index < 7 ? 4 : index < 14 ? 5 : 6;
    const selectedNotes = state.selectedChord === null ? [] : chord(state,state.selectedChord);
    const chordTones = new Set(selectedNotes.map(theory.getNoteMidi)), rootTone = selectedNotes.length ? theory.getNoteMidi(selectedNotes[0]) : -1;
    const keyClass = note => chordTones.has(theory.getNoteMidi(note)) ? (theory.getNoteMidi(note) === rootTone ? ' piano-chord-key piano-chord-root' : ' piano-chord-key') : '';
    const white = notes.map((note, i) => `<button class="piano-white-key${keyClass(note)}" data-play-note="${note}" data-play-octave="${octave(i)}" aria-label="Tocar ${noteNames[note[0]]}${note.slice(1)}${octave(i)}${chordTones.has(theory.getNoteMidi(note)) ? ', nota do acorde' : ''}">${state.selectedChord === null ? `<span>${digits[i]}</span>` : ''}<small>${noteNames[note[0]]}${note.slice(1)}</small></button>`).join('');
    const blackNotes = [[0,'C#',4],[1,'D#',4],[3,'F#',4],[4,'G#',4],[5,'A#',4],[7,'C#',5],[8,'D#',5],[10,'F#',5],[11,'G#',5],[12,'A#',5]];
    const blackKeys = blackNotes.map(([position,note,noteOctave]) => `<button class="piano-black-key${keyClass(note)}" style="left:${((position + 1) / 15) * 100}%" data-play-note="${note}" data-play-octave="${noteOctave}" aria-label="Tocar ${noteNames[note[0]]}${note.slice(1)}${noteOctave}${chordTones.has(theory.getNoteMidi(note)) ? ', nota do acorde' : ''}"></button>`).join('');
    const label = selectedNotes.length ? `Acorde ${theory.getChordName(selectedNotes)} · notas destacadas` : 'escala de Dó maior · duas oitavas';
    return `<div class="keyboard-wrap"><div class="piano-keyboard">${white}${blackKeys}</div><div class="piano-octave-label"><span>${label}</span><span>toque uma tecla para ouvir</span></div></div>`;
  };

  const guitarTuning = [4,9,2,7,11,4]; // E A D G B E, da mais grave à mais aguda
  const guitarStrings = ['E','A','D','G','B','e'];
  function guitarVoicing(notes) {
    const chordTones = new Set(notes.map(theory.getNoteMidi)), root = theory.getNoteMidi(notes[0]);
    const openMajor = {
      0:{frets:[-1,3,2,0,1,0], fingers:[0,3,2,0,1,0]},
      2:{frets:[-1,-1,0,2,3,2], fingers:[0,0,0,2,3,1]},
      4:{frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0]},
      5:{frets:[-1,-1,3,2,1,1], fingers:[0,0,3,2,1,1], barres:[{fret:1,start:4,end:5,finger:1}]},
      7:{frets:[3,2,0,0,0,3], fingers:[3,2,0,0,0,4]},
      9:{frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0]}
    };
    const openMinor = {
      2:{frets:[-1,-1,0,2,3,1], fingers:[0,0,0,2,3,1]},
      4:{frets:[0,2,2,0,0,0], fingers:[0,2,3,0,0,0]},
      9:{frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0]}
    };
    const makeShape = (frets, fingers, barres=[]) => { const positive=frets.filter(fret=>fret>0); return {frets:[...frets],fingerByString:[...fingers],barres:barres.map(barre=>({...barre})),base:positive.length?Math.min(...positive):1}; };
    const valid = shape => {
      if (!shape || shape.frets.some(fret=>fret>15)) return false;
      const sounded = shape.frets.map((fret,string)=>fret<0?null:(guitarTuning[string]+fret)%12).filter(note=>note!==null);
      return sounded.length>=4 && sounded[0]===root && sounded.every(note=>chordTones.has(note)) && [...chordTones].every(note=>sounded.includes(note));
    };
    const quality = theory.getQuality(notes).type;
    if (quality === 'maior' && openMajor[root] && valid(makeShape(openMajor[root].frets,openMajor[root].fingers,openMajor[root].barres))) return makeShape(openMajor[root].frets,openMajor[root].fingers,openMajor[root].barres);
    if (quality === 'menor' && openMinor[root] && valid(makeShape(openMinor[root].frets,openMinor[root].fingers,openMinor[root].barres))) return makeShape(openMinor[root].frets,openMinor[root].fingers,openMinor[root].barres);
    const candidates=[];
    if (quality==='maior' || quality==='menor') {
      const eFret=(root-guitarTuning[0]+12)%12, aFret=(root-guitarTuning[1]+12)%12;
      const eMinor=quality==='menor';
      const eFrets=eMinor?[eFret,eFret+2,eFret+2,eFret,eFret,eFret]:[eFret,eFret+2,eFret+2,eFret+1,eFret,eFret];
      const eFingers=eMinor?[1,3,4,1,1,1]:[1,3,4,2,1,1];
      const eBarres=eFret>0?[{fret:eFret,start:0,end:5,finger:1}]:[];
      const aFrets=eMinor?[-1,aFret,aFret+2,aFret+2,aFret+1,aFret]:[-1,aFret,aFret+2,aFret+2,aFret+2,aFret];
      const aFingers=eMinor?[0,1,3,4,2,1]:[0,1,3,3,3,1];
      const aBarres=aFret>0?(eMinor?[{fret:aFret,start:1,end:5,finger:1}]:[{fret:aFret,start:1,end:5,finger:1},{fret:aFret+2,start:2,end:4,finger:3}]):[];
      candidates.push(makeShape(eFrets,eFingers,eBarres),makeShape(aFrets,aFingers,aBarres));
    } else if (quality==='diminuto') {
      const aFret=(root-guitarTuning[1]+12)%12;
      candidates.push(makeShape([-1,aFret,aFret+1,aFret+2,aFret+1,-1],[0,1,2,4,3,0]));
      // Um segundo desenho com tônica na 6ª corda evita levar certas formas até a 11ª casa.
      const eFret=(root-guitarTuning[0]+12)%12, aThird=(root+3-guitarTuning[1]+12)%12, dFifth=(root+6-guitarTuning[2]+12)%12;
      const fixed=[eFret,aThird,dFifth];
      if (fixed.every(fret=>fret<=12)) {
        const frets=[eFret,aThird,dFifth,-1,chordTones.has(guitarTuning[4]%12)?0:-1,chordTones.has(guitarTuning[5]%12)?0:-1];
        const positive=frets.map((fret,string)=>({fret,string})).filter(item=>item.fret>0);
        if (positive.length<=4 && Math.max(...positive.map(item=>item.fret))-Math.min(...positive.map(item=>item.fret))<=3) {
          const fingers=[0,0,0,0,0,0];positive.sort((a,b)=>a.fret-b.fret||b.string-a.string).forEach((item,index)=>fingers[item.string]=index+1);
          candidates.push(makeShape(frets,fingers));
        }
      }
    } else if (quality==='aumentado') {
      const eFret=(root-guitarTuning[0]+12)%12, frets=[eFret,eFret+3,eFret+2,eFret+1,eFret+1,eFret];
      const fingers=eFret===0?[0,3,2,1,1,0]:[1,4,3,2,2,1];
      const barres=eFret===0?[{fret:1,start:3,end:4,finger:1}]:[{fret:eFret,start:0,end:5,finger:1},{fret:eFret+1,start:3,end:4,finger:2}];
      candidates.push(makeShape(frets,fingers,barres));
    }
    const matching=candidates.filter(valid).sort((a,b)=>{
      const score=shape=>shape.frets.reduce((sum,fret)=>sum+(fret<0?12:fret),0)+Math.max(...shape.frets)-Math.min(...shape.frets);
      return score(a)-score(b);
    });
    return matching[0]||null;
  }
  function guitarDiagram(notes) {
    const shape = guitarVoicing(notes);
    if (!shape) return `<p class="instrument-hint">Não foi encontrada uma posição simples para este acorde.</p>`;
    const fretCount = Math.max(4, ...shape.frets.filter(f=>f>=shape.base).map(f=>f-shape.base+1));
    const visibleRows = shape.base - 1 + fretCount;
    const markers = shape.frets.map((fret, string) => {
      const finger = fret > 0 ? shape.fingerByString[string] || 1 : 0;
      return `<div class="guitar-string-column"><span class="guitar-string-name">${guitarStrings[string]}</span><span class="guitar-open-marker">${fret < 0 ? '×' : fret === 0 ? '○' : ''}</span>${Array.from({length:visibleRows},(_,row) => { const cellFret=row+1, barred=shape.barres.some(barre=>barre.fret===cellFret&&string>=barre.start&&string<=barre.end); return `<span class="guitar-fret-cell ${cellFret<shape.base?'guitar-empty-fret':''}">${fret===cellFret&&!barred?`<i title="Dedo ${finger}">${finger}</i>`:''}</span>`; }).join('')}</div>`;
    }).join('');
    const barreMarks=shape.barres.map(barre=>`<span class="guitar-barre" data-fret="${barre.fret}" data-start="${barre.start}" data-end="${barre.end}" style="left:${barre.start/6*100}%;width:${(barre.end-barre.start+1)/6*100}%;top:${50.5+(barre.fret-1)*25}px;--barre-top-mobile:${50.5+(barre.fret-1)*22}px" aria-label="Pestana na casa ${barre.fret}, dedo ${barre.finger}">${barre.finger}</span>`).join('');
    return `<div class="guitar-diagram" aria-label="Diagrama de ${theory.getChordName(notes)}, casas 1 a ${shape.base+fretCount-1}"><div class="guitar-string-grid" style="--guitar-fret-count:${visibleRows}">${markers}${barreMarks}</div><small><b>${shape.base > 1 ? `Casas 1–${shape.base-1} vazias · posição na casa ${shape.base}` : `Posição aberta · casas 1–${fretCount}`}</b> · cordas da mais grave à mais aguda${shape.barres.length ? ' · pestana desenhada' : ''}</small></div>`;
  }

  const practiceTasks = {
    teclado: [
      'Aqueça a mão direita: toque Dó–Ré–Mi–Fá–Sol–Fá–Mi–Ré–Dó usando 1–2–3–1–2–3–4–5 na subida. Mantenha o pulso solto.',
      'Treine a mão esquerda na escala de Dó: suba e desça uma oitava com 5–4–3–2–1–3–2–1. Passe o polegar sem girar o punho.',
      'Toque a escala de Dó maior por duas oitavas com a direita: 1–2–3–1–2–3–4–1–2–3–1–2–3–4–5. Depois desça devagar.',
      'Faça duas oitavas com a esquerda: 5–4–3–2–1–3–2–1–4–3–2–1–3–2–1. Conte em voz alta e mantenha todas as notas no mesmo volume.',
      'Escolha uma tonalidade no campo harmônico. Toque a escala subindo e descendo em semínimas, primeiro a 60 bpm e depois aumente só se estiver confortável.',
      'Monte a tríade do primeiro grau: toque tônica, terça e quinta juntas. Depois toque as três notas separadas e volte à tônica.',
      'Pratique as inversões do acorde I: posição fundamental, primeira inversão e segunda inversão. Mude de posição com o menor movimento possível.',
      'Toque I–V–vi–IV no tom escolhido. Faça um acorde por compasso em 4/4 e conte quatro pulsações antes de trocar.',
      'Toque o arpejo 1–3–5–3 em cada grau do campo harmônico. Use a mão direita e depois repita com a esquerda.',
      'Escolha duas notas vizinhas da escala e alterne entre elas em colcheias, sem acelerar. Depois aplique o mesmo pulso à escala inteira.'
    ],
    violao: [
      'Afine e memorize as cordas soltas da 6ª à 1ª: Mi, Lá, Ré, Sol, Si, Mi. Toque uma por vez e diga o nome antes de tocar.',
      'Faça o exercício cromático 1–2–3–4 nas quatro primeiras casas, uma corda por vez. Use um dedo por casa e mantenha os dedos perto das cordas.',
      'Escolha um acorde do campo harmônico. Monte a posição e toque cada corda separadamente; corrija qualquer corda abafada ou nota estranha.',
      'Alterne entre os acordes I e IV do tom escolhido. Faça a troca no tempo, primeiro a 50 bpm, levantando os dedos só o necessário.',
      'Toque I–V–vi–IV com batidas para baixo. Conte quatro tempos por acorde e mantenha o movimento do braço regular.',
      'Repita a sequência I–V–vi–IV com o padrão baixo–baixo/cima–cima/baixo/cima. Comece sem trocar os acordes até dominar o ritmo.',
      'Faça dedilhado p–i–m–a: polegar na corda do baixo, indicador, médio e anelar nas três cordas agudas. Repita em cada acorde do tom.',
      'Toque a escala maior do tom escolhido em uma corda, nomeando as notas. Localize a tônica e volte até ela sem acelerar.',
      'Pratique os acordes do campo em pares: I–ii, iii–IV, V–vi e vii°–I. Toque devagar e deixe cada acorde soar limpo antes da troca.',
      'Escolha um acorde e toque tônica–terça–quinta como arpejo. Depois toque as notas em ordem inversa e resolva na tônica.'
    ]
  };

  function courseMarkup(kind) {
    const state = instrumentState[kind], isKeyboard = kind === 'teclado', app = document.querySelector(isKeyboard ? '#instrumentKeyboard' : '#instrumentGuitar');
    if (!app) return;
    app.closest('.view')?.classList.toggle('instrument-playing', state.gameOpen);
    const name = isKeyboard ? 'Teclado' : 'Violão', root = modeRoot(state), notes = scale(state);
    const field = fieldRows(state, !isKeyboard);
    const fingeringLegend = isKeyboard
      ? `<div class="finger-legend">${Object.entries(handNames).map(([num,name])=>`<span><b>${num}</b>${name}</span>`).join('')}</div>`
      : `<div class="finger-legend guitar-finger-legend"><span><b>1–4</b>Indicador, médio, anelar e mínimo na mão esquerda</span><span><b>p i m a</b>Polegar, indicador, médio e anelar na mão direita</span></div>`;
    const course = isKeyboard
      ? `<section class="instrument-section" id="teclado-curso"><div class="instrument-section-head"><span>01</span><div><p class="eyebrow">MINI CURSO</p><h2>Comece pelas mãos</h2><p>A numeração é a mesma nas duas mãos: 1 é o polegar e 5 é o mínimo.</p></div></div>${fingeringLegend}<div class="instrument-lesson-grid"><article><b>Posição confortável</b><p>Sente-se no centro do teclado, deixe ombros e punhos soltos e mantenha os dedos naturalmente curvos. Evite esticar ou apertar a mão.</p></article><article><b>Passagem do polegar</b><p>Em escalas, o polegar passa por baixo da mão com um movimento tranquilo. Não torça o punho nem force a abertura entre os dedos.</p></article><article><b>Primeiras cinco notas</b><p>Na posição de Dó: direita 1–2–3–4–5; esquerda 5–4–3–2–1. Toque devagar e com som uniforme.</p></article></div></section>`
      : `<section class="instrument-section" id="violao-curso"><div class="instrument-section-head"><span>01</span><div><p class="eyebrow">MINI CURSO</p><h2>Conheça o braço e as mãos</h2><p>O desenho mostra as cordas da mais grave à mais aguda; a casa 1 fica junto à pestana.</p></div></div>${fingeringLegend}<div class="instrument-lesson-grid"><article><b>Mão que faz os acordes</b><p>Os dedos são 1 indicador, 2 médio, 3 anelar e 4 mínimo. Use a ponta dos dedos, mantenha-os curvos e pressione perto do traste, sem encostar nele.</p></article><article><b>Mão que toca as cordas</b><p>No dedilhado clássico: p polegar, i indicador, m médio e a anelar. Para começar com palheta, segure-a de forma confortável e faça movimentos pequenos.</p></article><article><b>Postura sem força excessiva</b><p>Deixe o polegar apoiar atrás do braço e o punho relativamente alinhado. Se sentir dor, pare, relaxe e retome com menos pressão.</p></article></div></section>`;
    const exerciseCount = practiceTasks[kind].length, exercise = practiceTasks[kind][state.completed % exerciseCount];
    const scaleSection = isKeyboard ? `<section class="instrument-section" id="teclado-digitacoes"><div class="instrument-section-head"><span>02</span><div><p class="eyebrow">ESCALA E DIGITAÇÃO</p><h2>Escala de Dó maior · duas oitavas</h2><p>Treine a passagem do polegar com cada mão e toque as teclas para ouvir as notas.</p></div></div><div class="instrument-hand-tabs"><button class="${state.hand === 'right' ? 'selected' : ''}" data-keyboard-hand="right">Mão direita</button><button class="${state.hand === 'left' ? 'selected' : ''}" data-keyboard-hand="left">Mão esquerda</button></div>${keyboard(state)}<p class="instrument-hint">Duas oitavas: direita 1–2–3–1–2–3–4–1–2–3–1–2–3–4–5; esquerda 5–4–3–2–1–3–2–1–4–3–2–1–3–2–1. Digitações variam conforme a tonalidade.</p></section>` : `<section class="instrument-section" id="violao-digitacoes"><div class="instrument-section-head"><span>02</span><div><p class="eyebrow">CORDAS E PRIMEIRAS POSIÇÕES</p><h2>Afinação e desenho de acorde</h2><p>As cordas soltas, da 6ª à 1ª, são Mi · Lá · Ré · Sol · Si · Mi.</p></div></div><div class="guitar-tuning">${['6ª Mi','5ª Lá','4ª Ré','3ª Sol','2ª Si','1ª Mi'].map((s,i)=>`<span><b>${6-i}</b>${s.split(' ')[1]}</span>`).join('')}</div><p class="instrument-hint">Cada diagrama segue a leitura dos gráficos de acordes: cordas da mais grave à mais aguda, × para corda abafada, ○ para corda solta e número para o dedo.</p></section>`;
    const fieldTitle = isKeyboard ? 'Campo harmônico no teclado' : 'Campo harmônico no violão';
    const fieldSection = `<section class="instrument-section" id="${kind}-campo"><div class="instrument-section-head"><span>03</span><div><p class="eyebrow">ACORDES DO TOM</p><h2>${fieldTitle}</h2><p>Escolha o tom. Toque cada acorde na posição fundamental e pratique a sequência dos graus.</p></div></div>${selector(state)}${scaleTypeTabs(state)}<div class="instrument-field-grid">${field}</div><div class="instrument-note"><b>Comece simples:</b> toque um acorde por compasso. Depois experimente I–V–vi–IV, respeitando as notas e as digitações indicadas.</div></section>`;
    const exerciseSection = `<section class="instrument-section" id="${kind}-exercicios"><div class="instrument-section-head"><span>04</span><div><p class="eyebrow">PRÁTICA NO INSTRUMENTO</p><h2>Exercício guiado</h2><p>Alterne entre ${exerciseCount} práticas de técnica, escalas, acordes e ritmo.</p></div></div><article class="instrument-exercise"><span>EXERCÍCIO ${(state.completed % exerciseCount) + 1} DE ${exerciseCount}</span><p>${exercise}</p><button class="button primary" data-instrument-task>Concluí este exercício <span>✓</span></button><small>Concluídos nesta sessão: <b id="instrumentCompleted">${state.completed}</b></small></article></section>`;
    const gameSection = `<section class="instrument-section instrument-game-section" id="${kind}-jogo"><div class="instrument-section-head"><span>✦</span><div><p class="eyebrow">JOGO MISTURADO · ${name.toUpperCase()}</p><h2>Desafio de ${name.toLowerCase()}</h2><p>As perguntas aleatórias misturam digitação, escalas e acordes.</p></div></div><div class="instrument-quiz"><div class="instrument-quiz-top">QUESTÃO <b id="instrumentQuestionNum">${state.question + 1}</b><span>✦ <b id="instrumentPoints">${state.points}</b> pontos</span></div><div id="instrumentQuestion" class="instrument-question"></div><div id="instrumentChoices" class="instrument-choices"></div><p id="instrumentFeedback" class="instrument-feedback" aria-live="polite"></p><button class="button primary" data-instrument-next disabled>Próxima questão <span>→</span></button></div></section>`;
    if (state.gameOpen) { app.innerHTML = `<div class="local-module-nav instrument-local-nav"><button data-instrument-back-course>← Voltar ao curso</button></div><div class="instrument-game-screen"><p class="eyebrow">PRÁTICA NO INSTRUMENTO</p><h1>Jogo de ${name.toLowerCase()}</h1><p>Uma rodada exclusiva com perguntas aleatórias sobre o conteúdo do curso.</p>${gameSection}</div>`; setInstrumentQuestion(kind); return; }
    app.innerHTML = `<div class="local-module-nav instrument-local-nav"><button data-instrument-home>← Caminhos</button><a href="#${kind}-curso">Mini curso</a><a href="#${isKeyboard ? 'teclado-digitacoes' : 'violao-digitacoes'}">Digitações</a><a href="#${kind}-campo">Campo harmônico</a><a href="#${kind}-exercicios">Exercícios</a><button data-instrument-open-game>Jogar</button></div>${course}${scaleSection}${fieldSection}${exerciseSection}<section class="instrument-section game-launch"><div><p class="eyebrow">PRÁTICA NO INSTRUMENTO</p><h2>Teste o que aprendeu</h2><p>Questões aleatórias de digitação, escalas e acordes.</p></div><button class="button primary" data-instrument-open-game>Jogar <span>→</span></button></section>`;
  }

  function setInstrumentQuestion(kind) {
    const state = instrumentState[kind], app = document.querySelector(kind === 'teclado' ? '#instrumentKeyboard' : '#instrumentGuitar'), question = app?.querySelector('#instrumentQuestion'), choices = app?.querySelector('#instrumentChoices'), feedback = app?.querySelector('#instrumentFeedback'), next = app?.querySelector('[data-instrument-next]');
    if (!question || !choices || !next) return;
    const isKeyboard = kind === 'teclado', key = modeRoot(state), notes = scale(state);
    let prompt, answer, options;
    if (isKeyboard && Math.random() < .5) {
      const index = Math.floor(Math.random()*15), digits = state.hand === 'right' ? [1,2,3,1,2,3,4,1,2,3,1,2,3,4,5] : [5,4,3,2,1,3,2,1,4,3,2,1,3,2,1], note = [...theory.roots.major[0].notes,...theory.roots.major[0].notes,'C'][index], octave = index < 7 ? 4 : index < 14 ? 5 : 6;
      const noteLabel = `${noteNames[note[0]]}${note.slice(1)}${octave}`;
      prompt = `Na escala de Dó maior com a mão ${state.hand === 'right' ? 'direita' : 'esquerda'}, qual dedo toca ${noteLabel}?`;
      const digit = digits[index];
      answer = String(digit); options = ['1','2','3','4','5'];
    } else if (isKeyboard) {
      const degree = Math.floor(Math.random()*7), tones = chord(state,degree);
      prompt = `No campo harmônico de ${key.root} ${state.mode === 'major' ? 'maior' : 'menor'}, que notas formam ${roman(state,degree)}?`;
      answer = tones.join(' · '); options = [answer,...Array.from({length:3},(_,n)=>chord(state,(degree+n+1)%7).join(' · '))];
    } else if (Math.random() < .5) {
      const string = Math.floor(Math.random()*6), finger = Math.ceil(Math.random()*4);
      prompt = `Na mão que aperta as cordas do violão, que dedo é o número ${finger}?`;
      answer = ['','Indicador','Médio','Anelar','Mínimo'][finger]; options = ['Indicador','Médio','Anelar','Mínimo'];
    } else {
      const degree = Math.floor(Math.random()*7), tones = chord(state,degree);
      prompt = `Qual acorde é o ${roman(state,degree)} no campo de ${key.root} ${state.mode === 'major' ? 'maior' : 'menor'}?`;
      answer = `${theory.getChordName(tones)} · ${tones.join('–')}`; options = [answer,...Array.from({length:3},(_,n)=>{ const t=chord(state,(degree+n+1)%7);return `${theory.getChordName(t)} · ${t.join('–')}`; })];
    }
    options = [...new Set(options)].sort(()=>Math.random()-.5);
    question.textContent = prompt; choices.innerHTML = options.map(option=>`<button data-instrument-answer="${esc(option)}">${esc(option)}</button>`).join('');
    feedback.textContent = 'Escolha uma resposta.'; feedback.className = 'instrument-feedback'; next.disabled = true; next.dataset.answer = answer;
  }

  function bindInstrument(kind) {
    const app = document.querySelector(kind === 'teclado' ? '#instrumentKeyboard' : '#instrumentGuitar');
    app?.addEventListener('click', event => {
      if (event.target.closest('[data-instrument-home]')) { window.dispatchEvent(new CustomEvent('music-go-home')); return; }
      if (event.target.closest('[data-instrument-open-game]')) { instrumentState[kind].gameOpen=true; courseMarkup(kind); window.scrollTo({top:0,behavior:'smooth'}); return; }
      if (event.target.closest('[data-instrument-back-course]')) { instrumentState[kind].gameOpen=false; courseMarkup(kind); window.scrollTo({top:0,behavior:'smooth'}); return; }
      const keyButton = event.target.closest('[data-instrument-key]');
      if (keyButton) { const [mode,index] = keyButton.dataset.instrumentKey.split(':'); instrumentState[kind].mode = mode; instrumentState[kind].index = Number(index); instrumentState[kind].kind = 'natural'; if(kind==='teclado')instrumentState[kind].selectedChord=null; courseMarkup(kind); return; }
      const scaleButton = event.target.closest('[data-instrument-scale]');
      if (scaleButton) { instrumentState[kind].kind = scaleButton.dataset.instrumentScale; courseMarkup(kind); return; }
      const handButton = event.target.closest('[data-keyboard-hand]');
      if (handButton) { instrumentState.teclado.hand = handButton.dataset.keyboardHand; courseMarkup('teclado'); return; }
      const noteButton = event.target.closest('[data-play-note]');
      if (noteButton) { noteAudio(noteButton.dataset.playNote, Number(noteButton.dataset.playOctave || 4)); return; }
      const showChord = event.target.closest('[data-show-chord]');
      if (showChord) { instrumentState.teclado.selectedChord=Number(showChord.dataset.showChord); courseMarkup('teclado'); document.querySelector('#teclado-digitacoes')?.scrollIntoView({behavior:'smooth',block:'center'}); return; }
      const chordButton = event.target.closest('[data-play-chord]');
      if (chordButton) { chordAudio(chord(stateFor(kind),Number(chordButton.dataset.playChord))); return; }
      if (event.target.closest('[data-instrument-task]')) { instrumentState[kind].completed++; courseMarkup(kind); document.querySelector(`#${kind}-exercicios`)?.scrollIntoView({behavior:'smooth',block:'start'}); return; }
      const answerButton = event.target.closest('[data-instrument-answer]');
      if (answerButton) {
        const next = app.querySelector('[data-instrument-next]'), feedback = app.querySelector('#instrumentFeedback');
        if (!next || !next.disabled) return;
        const correct = answerButton.dataset.instrumentAnswer === next.dataset.answer;
        app.querySelectorAll('[data-instrument-answer]').forEach(button=>{button.disabled=true;if(button.dataset.instrumentAnswer===next.dataset.answer)button.classList.add('correct')});
        if(!correct)answerButton.classList.add('incorrect');else{instrumentState[kind].points++;app.querySelector('#instrumentPoints').textContent=instrumentState[kind].points;} instrumentState[kind].question++; saveInstrumentProgress();
        feedback.textContent=correct?'Correto! Boa execução.':'Quase! Confira a resposta destacada e tente na próxima.';feedback.classList.add(correct?'is-correct':'is-incorrect');next.disabled=false;return;
      }
      if (event.target.closest('[data-instrument-next]')) { courseMarkup(kind); document.querySelector(`#${kind}-jogo`)?.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
    courseMarkup(kind);
  }
  const stateFor = kind => instrumentState[kind];
  bindInstrument('teclado'); bindInstrument('violao');
})();
