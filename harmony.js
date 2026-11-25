(() => {
  const roots = {
    major: [
      { root: 'C', notes: ['C','D','E','F','G','A','B'] }, { root: 'Db', notes: ['Db','Eb','F','Gb','Ab','Bb','C'] },
      { root: 'D', notes: ['D','E','F#','G','A','B','C#'] }, { root: 'Eb', notes: ['Eb','F','G','Ab','Bb','C','D'] },
      { root: 'E', notes: ['E','F#','G#','A','B','C#','D#'] }, { root: 'F', notes: ['F','G','A','Bb','C','D','E'] },
      { root: 'F#', notes: ['F#','G#','A#','B','C#','D#','E#'] }, { root: 'G', notes: ['G','A','B','C','D','E','F#'] },
      { root: 'Ab', notes: ['Ab','Bb','C','Db','Eb','F','G'] }, { root: 'A', notes: ['A','B','C#','D','E','F#','G#'] },
      { root: 'Bb', notes: ['Bb','C','D','Eb','F','G','A'] }, { root: 'B', notes: ['B','C#','D#','E','F#','G#','A#'] }
    ],
    minor: [
      { root: 'C', notes: ['C','D','Eb','F','G','Ab','Bb'] }, { root: 'C#', notes: ['C#','D#','E','F#','G#','A','B'] },
      { root: 'D', notes: ['D','E','F','G','A','Bb','C'] }, { root: 'Eb', notes: ['Eb','F','Gb','Ab','Bb','Cb','Db'] },
      { root: 'E', notes: ['E','F#','G','A','B','C','D'] }, { root: 'F', notes: ['F','G','Ab','Bb','C','Db','Eb'] },
      { root: 'F#', notes: ['F#','G#','A','B','C#','D','E'] }, { root: 'G', notes: ['G','A','Bb','C','D','Eb','F'] },
      { root: 'Ab', notes: ['Ab','Bb','Cb','Db','Eb','Fb','Gb'] }, { root: 'A', notes: ['A','B','C','D','E','F','G'] },
      { root: 'Bb', notes: ['Bb','C','Db','Eb','F','Gb','Ab'] }, { root: 'B', notes: ['B','C#','D','E','F#','G','A'] }
    ]
  };
  const natural = { C:0,D:2,E:4,F:5,G:7,A:9,B:11 };
  const noteMidi = note => {
    const letter = note[0], marks = note.slice(1);
    return (natural[letter] + [...marks].reduce((sum, mark) => sum + (mark === '#' ? 1 : mark === 'b' ? -1 : 0), 0) + 12) % 12;
  };
  const spell = (note, amount) => {
    const letter = note[0];
    const old = noteMidi(note), wanted = (old + amount + 12) % 12;
    const diff = (wanted - natural[letter] + 12) % 12;
    return letter + (diff === 0 ? '' : diff === 1 ? '#' : diff === 11 ? 'b' : diff === 2 ? '##' : 'bb');
  };
  const quality = notes => {
    const third = (noteMidi(notes[1]) - noteMidi(notes[0]) + 12) % 12;
    const fifth = (noteMidi(notes[2]) - noteMidi(notes[0]) + 12) % 12;
    if (third === 4 && fifth === 7) return { suffix: '', type: 'maior' };
    if (third === 3 && fifth === 7) return { suffix: 'm', type: 'menor' };
    if (third === 3 && fifth === 6) return { suffix: '°', type: 'diminuto' };
    if (third === 4 && fifth === 8) return { suffix: '+', type: 'aumentado' };
    return { suffix: '?', type: 'acorde' };
  };
  const degrees = ['I','II','III','IV','V','VI','VII'];
  let selectedMode = 'major', selectedIndex = 0, scaleKind = 'natural', selectedPage = 'home', points = 0, questions = 0;
  try { const saved = JSON.parse(localStorage.getItem('musica-em-jogo-harmony-progress') || '{}'); points = saved.points || 0; questions = saved.questions || 0; } catch { /* Progresso local opcional. */ }
  const app = document.querySelector('#harmonyApp');
  const keySet = () => roots[selectedMode][selectedIndex];
  const makeScale = (mode, index, kind = 'natural') => {
    const notes = [...roots[mode][index].notes];
    if (mode === 'minor' && kind === 'harmonic') notes[6] = spell(notes[6], 1);
    if (mode === 'minor' && kind === 'melodic') { notes[5] = spell(notes[5], 1); notes[6] = spell(notes[6], 1); }
    return notes;
  };
  const scaleNotes = kind => makeScale(selectedMode, selectedIndex, kind);
  const chord = (scale, index, seventh = false) => Array.from({ length: seventh ? 4 : 3 }, (_, n) => scale[(index + n * 2) % 7]);
  const chordName = notes => `${notes[0]}${quality(notes).suffix}`;
  window.MusicHarmony = { roots, getScale: makeScale, getChord: (scale, index, seventh = false) => chord(scale, index, seventh), getChordName: chordName, getQuality: quality, getNoteMidi: noteMidi };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]);
  const audio = async sequences => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      const ctx = new Audio(), now = ctx.currentTime;
      await ctx.resume();
      sequences.forEach((notes, step) => notes.forEach((note, voice) => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        const midi = 60 + noteMidi(note) + (voice > 0 ? 12 : 0), start = now + step * .72;
        osc.type = 'triangle'; osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
        gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(.085, start + .035); gain.gain.exponentialRampToValueAtTime(.0001, start + .62);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + .65);
      }));
      setTimeout(() => ctx.close().catch(() => {}), sequences.length * 720 + 900);
    } catch { /* A lição continua disponível mesmo sem áudio no aparelho. */ }
  };
  const render = () => {
    if (!app) return;
    app.closest('.view')?.classList.toggle('harmony-playing', selectedPage === 'game');
    const key = keySet(), scale = scaleNotes(scaleKind);
    const isMinor = selectedMode === 'minor';
    const feelingRomans = isMinor ? { bright: 'III · VI · VII · III', wistful: 'i · VI · III · VII', tension: 'ii° · V⁷ · i' } : { bright: 'I · IV · V · I', wistful: 'vi · IV · I · V', tension: 'ii · V⁷ · I' };
    const scaleName = isMinor ? `${scaleKind === 'natural' ? 'menor natural' : scaleKind === 'harmonic' ? 'menor harmônica' : 'menor melódica ascendente'}` : 'maior';
    const field = scale.map((_, i) => {
      const notes = chord(scale, i), info = quality(notes);
      const minorRomans = scaleKind === 'natural' ? ['i','ii°','III','iv','v','VI','VII'] : scaleKind === 'harmonic' ? ['i','ii°','III+','iv','V','VI','vii°'] : ['i','ii','III+','IV','V','vi°','vii°'];
      const roman = isMinor ? minorRomans[i] : ['I','ii','iii','IV','V','vi','vii°'][i];
      return `<button class="harmony-chord" data-play-chord="${i}" aria-label="Tocar ${roman}, ${chordName(notes)}"><span class="roman">${roman}</span><b>${chordName(notes)}</b><small>${notes.join(' · ')}</small><em>${info.type}</em></button>`;
    }).join('');
    const rootButtons = (mode, label) => `<div class="key-group"><p>${label}</p><div class="key-grid">${roots[mode].map((item, i) => `<button class="key-chip ${mode === selectedMode && i === selectedIndex ? 'selected' : ''}" data-key-mode="${mode}" data-key-index="${i}" aria-pressed="${mode === selectedMode && i === selectedIndex}">${item.root}${mode === 'minor' ? 'm' : ''}</button>`).join('')}</div></div>`;
    const scaleTypes = `<div class="scale-tabs" role="group" aria-label="Tipo de escala">${(isMinor ? [['natural','Menor natural'],['harmonic','Menor harmônica'],['melodic','Menor melódica']] : [['natural','Escala maior']]).map(([kind,label]) => `<button class="scale-tab ${scaleKind === kind ? 'selected' : ''}" data-scale-kind="${kind}" aria-pressed="${scaleKind === kind}">${label}</button>`).join('')}</div>`;
    const minorDescent = isMinor && scaleKind === 'melodic' ? `<p class="scale-note"><b>Na descida:</b> ${key.notes.slice().reverse().join(' · ')} · ${key.root}</p>` : '';
    const localNav = `<nav class="local-module-nav harmony-local-nav" aria-label="Páginas de harmonia"><button class="${selectedPage === 'home' ? 'selected' : ''}" data-harmony-page="home">Visão geral</button><button class="${selectedPage === 'learn' ? 'selected' : ''}" data-harmony-page="learn">Aprender</button><button class="${selectedPage === 'fields' ? 'selected' : ''}" data-harmony-page="fields">Campos harmônicos</button><button class="${selectedPage === 'game' ? 'selected' : ''}" data-harmony-page="game">Jogo misturado</button></nav>`;
    const pageTitle = { learn:'Aprender harmonia', fields:'Campos harmônicos', game:'Jogo misturado' }[selectedPage];
    const innerTitle = pageTitle ? `<div class="harmony-inner-title"><p class="eyebrow">HARMONIA MUSICAL</p><h2>${pageTitle}</h2></div>` : '';
    const scaleContent = `<section class="harmony-section" id="harmony-scales"><div class="harmony-section-head"><span class="harmony-step">1</span><div><p class="eyebrow">COMECE PELAS NOTAS</p><h2>Escalas maiores e menores</h2><p>Escolha qualquer tom. Veja as notas e compare como muda a escala.</p></div></div><div class="key-selector">${rootButtons('major','TONS MAIORES')}${rootButtons('minor','TONS MENORES')}</div><div class="scale-card"><div class="scale-card-head"><div><span class="eyebrow">${isMinor ? 'TOM MENOR' : 'TOM MAIOR'}</span><h3>${key.root} ${scaleName}</h3></div><button class="button light-button" data-play-scale>▶ Ouvir escala</button></div>${scaleTypes}<div class="scale-notes">${scale.map((note, i) => `<span><small>${i + 1}º grau</small><b>${note}</b></span>`).join('')}<span class="octave-note"><small>oitava</small><b>${key.root}</b></span></div><p class="interval-formula"><b>Fórmula de intervalos</b><span>${isMinor ? scaleKind === 'natural' ? 'Tom · semitom · tom · tom · semitom · tom · tom' : scaleKind === 'harmonic' ? 'Tom · semitom · tom · tom · semitom · tom e meio · semitom' : 'Tom · semitom · tom · tom · tom · tom · semitom' : 'Tom · tom · semitom · tom · tom · tom · semitom'}</span></p>${minorDescent}<p class="scale-note">Na menor natural, o 7º grau fica um tom abaixo da tônica. Na harmônica, ele sobe um semitom e cria uma sensível. Na melódica clássica, o 6º e o 7º graus sobem na subida; na descida, normalmente voltam à forma natural.</p></div></section>`;
    const feelingContent = `<section class="harmony-section" id="harmony-feelings"><div class="harmony-section-head"><span class="harmony-step">2</span><div><p class="eyebrow">OUÇA O MOVIMENTO</p><h2>Três caminhos, três impressões</h2><p>Experimente progressões com acordes do tom. Essas sensações são tendências comuns, não regras: andamento, timbre, ritmo e contexto também mudam a escuta.</p></div></div><div class="feeling-grid"><article class="feeling-card feeling-bright"><span>☀</span><h3>Alegria e abertura</h3><p>${feelingRomans.bright}</p><small>Uma saída estável, movimento e volta para casa.</small><button class="button light-button" data-play-feeling="bright">▶ Ouvir</button></article><article class="feeling-card feeling-wistful"><span>☾</span><h3>Saudade e introspecção</h3><p>${feelingRomans.wistful}</p><small>Uma passagem por acordes relativos antes de seguir o caminho harmônico.</small><button class="button light-button" data-play-feeling="wistful">▶ Ouvir</button></article><article class="feeling-card feeling-tension"><span>↗</span><h3>Tensão e expectativa</h3><p>${feelingRomans.tension}</p><small>A dominante cria expectativa; a tônica oferece resolução.</small><button class="button light-button" data-play-feeling="tension">▶ Ouvir</button></article></div><p class="harmony-note">Os rótulos descrevem impressões possíveis. Nenhuma progressão provoca a mesma emoção em todas as pessoas ou culturas.</p></section>`;
    const fieldContent = `<section class="harmony-section" id="harmony-fields"><div class="harmony-section-head"><span class="harmony-step">1</span><div><p class="eyebrow">EMPILHE TERÇAS</p><h2>Campo harmônico do tom</h2><p>As tríades são formadas usando uma nota sim e outra não da escala. Troque o tom ou a forma da escala para comparar os acordes.</p></div></div><div class="key-selector">${rootButtons('major','TONS MAIORES')}${rootButtons('minor','TONS MENORES')}</div>${scaleTypes}<div class="field-toolbar"><div><b>${key.root} ${isMinor ? 'menor' : 'maior'}</b><span>· ${scaleName}</span></div><span>Toque em um acorde para ouvir</span></div><div class="harmony-field">${field}</div>${isMinor ? `<div class="harmony-callout"><b>Por que o campo menor muda?</b><span>A menor natural dá <b>v</b> menor. Ao elevar o 7º grau na menor harmônica, o V vira maior e cria uma sensível que tende a resolver na tônica. A música pode alternar as formas conforme a melodia e a harmonia.</span></div>` : `<div class="harmony-callout"><b>Graus do campo maior</b><span>I maior · ii menor · iii menor · IV maior · V maior · vi menor · vii° diminuto.</span></div>`}</section>`;
    const gameContent = `<section class="harmony-section game-section" id="harmony-games"><div class="harmony-section-head"><span class="harmony-step game-step">1</span><div><p class="eyebrow">PRÁTICA INTERATIVA · HARMONIA</p><h2>Jogo misturado</h2><p>As questões alternam automaticamente entre escalas, formação de acordes e campos harmônicos.</p></div></div><div class="harmony-quiz"><div class="quiz-top"><span>QUESTÃO <b id="harmonyQuestionNum">0</b></span><span>✦ <b id="harmonyPoints">${points}</b> pontos</span></div><div class="quiz-content" id="harmonyQuizContent"><p>Carregando a próxima questão...</p></div><div class="quiz-choices" id="harmonyChoices"></div><div class="quiz-feedback" id="harmonyFeedback" aria-live="polite"></div><div class="quiz-actions"><button class="button light-button" data-new-question>Sortear questão</button><button class="button primary" data-next-harmony disabled>Conferir <span>→</span></button></div></div></section>`;
    const homeContent = `<div class="harmony-paths"><button class="path-card" data-harmony-page="learn"><span>01</span><b>Aprender</b><small>Conheça escalas e experimente progressões que criam diferentes impressões.</small><i>Abrir guia →</i></button><button class="path-card" data-harmony-page="fields"><span>02</span><b>Campos harmônicos</b><small>Consulte os acordes dos 12 tons maiores e dos 12 tons menores.</small><i>Ver campos →</i></button><button class="path-card" data-harmony-page="game"><span>03</span><b>Jogo misturado</b><small>Pratique escalas, formação de acordes e campos sem escolher o assunto.</small><i>Começar →</i></button></div>`;
    app.innerHTML = selectedPage === 'game' ? `<div class="harmony-game-screen">${localNav}<div class="harmony-inner-title"><p class="eyebrow">PRÁTICA INTERATIVA · HARMONIA</p><h2>Jogo misturado</h2><p>Questões aleatórias sobre escalas, acordes e campos harmônicos.</p></div>${gameContent}</div>` : `${localNav}${selectedPage === 'home' ? homeContent : `${innerTitle}${selectedPage === 'learn' ? `${scaleContent}${feelingContent}` : fieldContent}`}`;
    if (selectedPage === 'game') newQuestion();
  };
  const newQuestion = () => {
    const q = document.querySelector('#harmonyQuizContent'), choices = document.querySelector('#harmonyChoices'), next = document.querySelector('[data-next-harmony]');
    if (!q || !choices) return;
    const mode = ['scales','chords','fields'][Math.floor(Math.random() * 3)];
    let prompt, answer, options, hint;
    if (mode === 'scales') {
      const sample = roots.minor[Math.floor(Math.random() * roots.minor.length)];
      const kind = ['natural','harmonic','melodic'][Math.floor(Math.random() * 3)];
      prompt = `Qual é a fórmula da escala ${sample.root} menor ${kind === 'natural' ? 'natural' : kind === 'harmonic' ? 'harmônica' : 'melódica ascendente'}?`;
      answer = kind === 'natural' ? 'T · ST · T · T · ST · T · T' : kind === 'harmonic' ? 'T · ST · T · T · ST · T+ST · ST' : 'T · ST · T · T · T · T · ST';
      hint = 'Compare a posição dos semitons: na menor harmônica, o 7º grau sobe; na melódica ascendente, sobem o 6º e o 7º.';
      options = ['T · ST · T · T · ST · T · T','T · ST · T · T · ST · T+ST · ST','T · ST · T · T · T · T · ST','T · T · ST · T · T · T · ST'];
    } else if (mode === 'chords') {
      const sample = roots.major[Math.floor(Math.random() * roots.major.length)];
      const index = Math.floor(Math.random() * 7), notes = chord(sample.notes, index);
      prompt = `No tom de ${sample.root} maior, quais notas formam o acorde do ${degrees[index]} grau?`;
      answer = notes.join(' – '); hint = 'Comece no grau pedido e empilhe notas alternadas da escala: fundamental, terça e quinta.';
      options = [answer, ...Array.from({length:3}, (_,n) => chord(sample.notes, (index + n + 1) % 7).join(' – '))];
    } else {
      const sample = roots.major[Math.floor(Math.random() * roots.major.length)];
      const index = Math.floor(Math.random() * 7), notes = chord(sample.notes, index), roman = ['I','ii','iii','IV','V','vi','vii°'][index];
      prompt = `Qual é o acorde ${roman} no campo harmônico de ${sample.root} maior?`;
      answer = `${chordName(notes)} (${notes.join(' – ')})`; hint = 'Na escala maior, os acordes seguem a sequência: I, ii, iii, IV, V, vi, vii°.';
      options = [answer, ...Array.from({length:3},(_,n) => { const other = chord(sample.notes, (index+n+1)%7); return `${chordName(other)} (${other.join(' – ')})`; })];
    }
    options = [...new Set(options)].sort(() => Math.random() - .5);
    q.innerHTML = `<p class="quiz-prompt">${esc(prompt)}</p>`; choices.innerHTML = options.map(option => `<button class="quiz-choice" data-harmony-answer="${esc(option)}">${esc(option)}</button>`).join('');
    document.querySelector('#harmonyFeedback').textContent = hint; next.disabled = true; next.dataset.correct = answer;
    document.querySelector('#harmonyQuestionNum').textContent = String(Number(document.querySelector('#harmonyQuestionNum').textContent) + 1);
  };
  const pickChoice = button => {
    const area = document.querySelector('#harmonyChoices'), feedback = document.querySelector('#harmonyFeedback'), next = document.querySelector('[data-next-harmony]');
    if (!area || !next || next.disabled === false) return;
    const correct = button.dataset.harmonyAnswer === next.dataset.correct;
    area.querySelectorAll('.quiz-choice').forEach(item => { item.disabled = true; if (item.dataset.harmonyAnswer === next.dataset.correct) item.classList.add('correct'); });
    if (!correct) button.classList.add('incorrect'); else { points++; document.querySelector('#harmonyPoints').textContent = points; }
    questions++; try { localStorage.setItem('musica-em-jogo-harmony-progress', JSON.stringify({points, questions})); } catch { /* O quiz continua funcionando sem armazenamento local. */ }
    feedback.textContent = correct ? 'Isso! Você encontrou a resposta.' : `Quase. A resposta correta é ${next.dataset.correct}.`;
    feedback.classList.toggle('is-correct', correct); feedback.classList.toggle('is-incorrect', !correct); next.disabled = false;
  };
  app?.addEventListener('click', event => {
    const pageButton = event.target.closest('[data-harmony-page]');
    if (pageButton) { selectedPage = pageButton.dataset.harmonyPage; render(); return; }
    const keyButton = event.target.closest('[data-key-mode]');
    if (keyButton) { selectedMode = keyButton.dataset.keyMode; selectedIndex = Number(keyButton.dataset.keyIndex); scaleKind = 'natural'; render(); return; }
    const scaleButton = event.target.closest('[data-scale-kind]');
    if (scaleButton) { scaleKind = scaleButton.dataset.scaleKind; render(); return; }
    if (event.target.closest('[data-play-scale]')) { audio(scaleNotes(scaleKind).map(note => [note])); return; }
    const chordButton = event.target.closest('[data-play-chord]');
    if (chordButton) { audio([chord(scaleNotes(scaleKind), Number(chordButton.dataset.playChord))]); return; }
    const feeling = event.target.closest('[data-play-feeling]');
    if (feeling) {
      const emotion = feeling.dataset.playFeeling;
      const base = selectedMode === 'major' ? keySet().notes : scaleNotes(emotion === 'tension' ? 'harmonic' : 'natural');
      const minorProgressions = { bright:[2,5,6,2], wistful:[0,5,2,6], tension:[1,4,0] };
      const majorProgressions = { bright:[0,3,4,0], wistful:[5,3,0,4], tension:[1,4,0] };
      const ids = (selectedMode === 'major' ? majorProgressions : minorProgressions)[emotion];
      audio(ids.map((degree, n) => chord(base, degree, emotion === 'tension' && n === 1))); return;
    }
    const answer = event.target.closest('[data-harmony-answer]'); if (answer) { pickChoice(answer); return; }
    if (event.target.closest('[data-next-harmony]')) { newQuestion(); return; }
    if (event.target.closest('[data-new-question]')) { newQuestion(); }
  });
  render();
})();
