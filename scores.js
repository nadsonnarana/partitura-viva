const scoreSongs = [
  { title:'Ode à alegria', origin:'Ludwig van Beethoven · tema da Nona Sinfonia', bars:'E4 E4 F4 G4|G4 F4 E4 D4|C4 C4 D4 E4|E4. D4/ D4-|E4 E4 F4 G4|G4 F4 E4 D4|C4 C4 D4 E4|D4. C4/ C4-' },
  { title:'Brilha, brilha estrelinha', origin:'Canção tradicional', bars:'C4 C4 G4 G4|A4 A4 G4-|F4 F4 E4 E4|D4 D4 C4-|G4 G4 F4 F4|E4 E4 D4-|G4 G4 F4 F4|E4 E4 D4-|C4 C4 G4 G4|A4 A4 G4-|F4 F4 E4 E4|D4 D4 C4-' },
  { title:'Frère Jacques', origin:'Canção tradicional francesa', bars:'C4 D4 E4 C4|C4 D4 E4 C4|E4 F4 G4-|E4 F4 G4-|G4/ A4/ G4/ F4/ E4 C4|G4/ A4/ G4/ F4/ E4 C4|C4 G3 C4-|C4 G3 C4-' },
  { title:'Hot Cross Buns', origin:'Canção infantil tradicional inglesa', bars:'E4 D4 C4-|E4 D4 C4-|C4/ C4/ C4/ C4/ D4/ D4/ D4/ D4/|E4 D4 C4-' },
  { title:'Mary Had a Little Lamb', origin:'Canção infantil tradicional', bars:'E4 D4 C4 D4|E4 E4 E4-|D4 D4 D4-|E4 G4 G4-|E4 D4 C4 D4|E4 E4 E4 E4|D4 D4 E4 D4|C4---' }
].map((song, i) => ({...song, id:`s${i}`, bars:song.bars.split('|').map(bar=>bar.trim().split(/\s+/).map(token=>{
  const [, letter, octave, dotted, rest] = token.match(/^([A-G])([0-9])([.]?)([-/]*)$/) || [];
  const beats = rest.includes('-') ? (rest.length >= 3 ? 4 : 2) : rest.includes('/') ? .5 : dotted ? 1.5 : 1;
  return {letter, octave:Number(octave), beats};
}))}));

let scoreSelected = 0, scoreClef = 'sol', scoreNames = true, scoreAudio = null, scoreTimer = null, scoreIsPlaying = false;
const scoreDoReMi = {C:'Dó',D:'Ré',E:'Mi',F:'Fá',G:'Sol',A:'Lá',B:'Si'};
const scoreSemitones = {C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const scoreDiatonic = {C:0,D:1,E:2,F:3,G:4,A:5,B:6};

function renderScores() {
  const root = document.querySelector('#scoreStudio'); if (!root) return;
  const song = scoreSongs[scoreSelected];
  const barW = 145, start = 86, bottom = 111, width = start + song.bars.length * barW + 12;
  const lines = Array.from({length:5},(_,i)=>`<line class="score-line" x1="${start}" y1="${bottom-i*12}" x2="${start+song.bars.length*barW}" y2="${bottom-i*12}"/>`).join('');
  let notes = '';
  song.bars.forEach((bar, bi)=>{
    const bx = start + bi * barW; notes += `<line class="score-barline" x1="${bx}" y1="63" x2="${bx}" y2="${bottom}"/>`;
    const total = bar.reduce((n,x)=>n+x.beats,0); let elapsed = 0;
    bar.forEach(note=>{
      const {letter,octave,beats}=note;
      const baseStep = scoreClef==='sol' ? 30 : 18;
      const writtenOctave = octave;
      const step = writtenOctave*7 + scoreDiatonic[letter] - baseStep;
      const x = bx + 8 + (elapsed + beats/2)/total*(barW-16), y = bottom - step*6;
      const stemUp = y > bottom-24, sx = x + (stemUp?7:-7), sy = y + (stemUp?-40:40);
      const open = beats >= 2;
      let ledger = '';
      if (step <= -2) for (let pos=-2; pos>=step; pos-=2) ledger += `<line class="score-ledger" x1="${x-12}" y1="${bottom-pos*6}" x2="${x+12}" y2="${bottom-pos*6}"/>`;
      if (step >= 10) for (let pos=10; pos<=step; pos+=2) ledger += `<line class="score-ledger" x1="${x-12}" y1="${bottom-pos*6}" x2="${x+12}" y2="${bottom-pos*6}"/>`;
      notes += `<g>${ledger}<ellipse class="score-notehead ${open?'open':''}" cx="${x}" cy="${y}" rx="7" ry="5" transform="rotate(-18 ${x} ${y})"/>${beats<4?`<line class="score-stem" x1="${sx}" y1="${y}" x2="${sx}" y2="${sy}"/>`:''}${beats<=.5?`<path class="score-flag" d="M${sx} ${sy}q12 5 4 14"/>`:''}${scoreNames?`<text class="score-label" x="${x}" y="145">${scoreDoReMi[letter]}</text>`:''}</g>`;
      elapsed += beats;
    });
  });
  notes += `<line class="score-barline final" x1="${start+song.bars.length*barW}" y1="63" x2="${start+song.bars.length*barW}" y2="${bottom}"/>`;
  root.innerHTML = `<div class="score-layout"><aside class="score-picker"><p class="side-title">ESCOLHA UMA MELODIA</p>${scoreSongs.map((s,i)=>`<button class="score-song ${i===scoreSelected?'selected':''}" data-song="${i}"><b>${s.title}</b><small>${s.origin}</small></button>`).join('')}</aside><article class="score-workspace"><header class="score-heading"><p class="eyebrow">PARTITURA ${scoreSelected+1} DE 5</p><h2>${song.title}</h2><p>${song.origin} · compasso 4/4</p></header><div class="score-tools"><div class="clef-switch"><button data-clef="sol" class="${scoreClef==='sol'?'selected':''}">𝄞 Clave de sol</button><button data-clef="fa" class="${scoreClef==='fa'?'selected':''}">𝄢 Clave de fá</button></div><div class="score-actions"><button class="button primary" data-score-play>${scoreIsPlaying?'Ⅱ Pausar':'▶ Ouvir partitura'}</button><button class="button light-button" data-score-stop>■ Parar</button><label class="note-name-toggle"><input type="checkbox" data-score-names ${scoreNames?'checked':''}> Mostrar nomes das notas</label></div></div><div class="score-scroll"><svg class="full-score" viewBox="0 0 ${width} 194" role="img" aria-label="${song.title}, clave de ${scoreClef==='sol'?'sol':'fá'}">${lines}<text class="score-clef" x="17" y="91">${scoreClef==='sol'?'𝄞':'𝄢'}</text><text class="score-meter" x="55" y="87">4<tspan x="55" dy="20">4</tspan></text>${notes}</svg></div><p class="score-hint">Melodia em Dó maior. Na clave de fá, o áudio soa uma oitava abaixo. Use os nomes como apoio e depois tente ler sem eles.</p></article></div>`;
}

function stopScore() { clearTimeout(scoreTimer); scoreIsPlaying=false; if(scoreAudio){scoreAudio.close();scoreAudio=null;} }
function playScore() {
  if (scoreIsPlaying) { stopScore(); renderScores(); return; }
  const song=scoreSongs[scoreSelected]; scoreAudio=new AudioContext(); scoreIsPlaying=true; renderScores(); let offset=0;
  song.bars.flat().forEach(({letter,octave,beats})=>{
    const when=scoreAudio.currentTime+offset, duration=beats*.48, midi=12*(octave+(scoreClef==='fa'?-1:0)+1)+scoreSemitones[letter];
    const osc=scoreAudio.createOscillator(), gain=scoreAudio.createGain(); osc.type='sine'; osc.frequency.value=440*Math.pow(2,(midi-69)/12); gain.gain.setValueAtTime(.0001,when); gain.gain.exponentialRampToValueAtTime(.12,when+.025); gain.gain.setValueAtTime(.12,when+Math.max(.03,duration-.04)); gain.gain.exponentialRampToValueAtTime(.0001,when+duration); osc.connect(gain); gain.connect(scoreAudio.destination); osc.start(when); osc.stop(when+duration+.02); offset+=duration;
  });
  scoreTimer=setTimeout(()=>{stopScore();renderScores();},offset*1000+100);
}
document.addEventListener('click',event=>{
  const song=event.target.closest('[data-song]'); if(song){stopScore();scoreSelected=Number(song.dataset.song);renderScores();return;}
  const clef=event.target.closest('[data-clef]'); if(clef){stopScore();scoreClef=clef.dataset.clef;renderScores();return;}
  if(event.target.closest('[data-score-play]')){playScore();return;}
  if(event.target.closest('[data-score-stop]')){stopScore();renderScores();}
});
document.addEventListener('change',event=>{if(event.target.matches('[data-score-names]')){scoreNames=event.target.checked;renderScores();}});
