# Música em Jogo

Aplicativo gratuito de prática de leitura musical. É um site estático: não exige conta, servidor, banco de dados ou instalação pelos alunos. O progresso fica no armazenamento local do navegador de cada aparelho.

## Conteúdos

- Explicações completas antes dos jogos, com mapas separados para as claves de sol e fá.
- Leitura das notas naturais pelo nome, sem números de oitava nas opções, e linhas suplementares no pentagrama.
- Figuras rítmicas de semibreve a fusa, com referência de valores em tempos.
- Símbolos tradicionais de pausa, colocados sobre a pauta, e exemplos de compassos 2/4, 3/4, 4/4, 2/2 e 6/8. O 6/8 aparece como dois pulsos de semínima pontuada, agrupados em 3 + 3 colcheias.
- Jogos adicionais de percepção auditiva e de completar compassos.
- Dinâmicas e articulações comuns.
- Posição e formato da cabeça da nota.
- Lições curtas, feedback após cada resposta, pontos e sequência de acertos.
- Aba **Partituras** com cinco melodias tradicionais, escrita nas claves de sol e fá, opção de ouvir e controle para mostrar ou ocultar os nomes das notas.
- Módulo **Harmonia musical** com escalas maiores, menores naturais, harmônicas e melódicas, campos harmônicos selecionáveis em 12 tons maiores e 12 menores, exemplos de progressões com áudio e desafios interativos.
- Mini cursos de **Teclado** e **Violão**, com posição das mãos, numeração dos dedos, digitação de escala, diagramas de acordes para os campos harmônicos, exercícios físicos e jogos de revisão.

Na página **Aprender**, primeiro vêm todas as explicações. Só depois aparecem os jogos. As práticas de clave de sol e clave de fá são separadas.

Na aba **Partituras**, selecione uma melodia e alterne a clave. O botão **Ouvir partitura** reproduz a melodia pelo áudio do navegador; **Parar** interrompe a reprodução. A caixa **Mostrar nomes das notas** liga ou desliga as etiquetas. As versões são arranjos didáticos em Dó maior. Na clave de fá, a melodia é escrita e tocada uma oitava abaixo para manter as notas próximas ao pentagrama. O áudio funciona sem arquivos externos, depois de uma ação do aluno na página.

No módulo **Harmonia musical**, escolha uma tonalidade maior ou menor e compare suas escalas e acordes. Nos tons menores, o campo muda conforme a forma natural, harmônica ou melódica; as alterações na sétima (e, na melódica ascendente, na sexta) são mostradas no contexto. As sugestões de alegria, introspecção e tensão descrevem impressões possíveis das progressões, não efeitos universais.

Os cursos de **Teclado** e **Violão** combinam uma explicação curta com digitações, um campo harmônico selecionável, exercícios para tocar fora do computador e perguntas de revisão. As posições sugeridas são pontos de partida didáticos; escolha movimentos confortáveis e evite tensão ou dor.

Na página inicial, escolha **Partitura** ou **Harmonia musical**. As telas de estudo e de partituras aparecem dentro do caminho Partitura; os jogos dos dois módulos sorteiam automaticamente perguntas variadas, sem seleção manual de assunto.

## Testar no computador

Abra `index.html` no navegador. Para compartilhar com a turma, publique a pasta em um serviço de hospedagem estática, como GitHub Pages. Não há dados de alunos no código.

## Publicar gratuitamente no GitHub Pages

1. Crie ou entre em uma conta GitHub.
2. Crie um repositório público, por exemplo `musica-em-jogo`.
3. Envie para a raiz do repositório todos os arquivos do projeto, incluindo `index.html`, `styles.css`, `app.js`, `scores.js`, `harmony.css`, `harmony.js`, `instruments.css`, `instruments.js`, `manifest.webmanifest`, `icon.svg` e `sw.js`.
4. Abra **Settings → Pages**.
5. Em **Build and deployment**, escolha **Deploy from a branch**.
6. Selecione `main` e a pasta `/(root)`, então clique em **Save**.
7. Quando o GitHub Pages terminar a publicação, copie o endereço mostrado em Pages. O formato será `https://SEU-USUARIO.github.io/musica-em-jogo/`.
8. Envie esse endereço aos alunos. Em celulares, eles podem usar o menu do navegador e escolher “Adicionar à tela inicial”.

O GitHub Pages gratuito publica sites estáticos em repositórios públicos. O site e o código ficam públicos; não coloque nomes de estudantes, notas, e-mails ou outros dados pessoais no repositório.

## Instalar como aplicativo no celular (PWA)

O projeto já inclui manifesto, ícone e service worker. Depois de publicar em HTTPS, o navegador poderá instalá-lo como aplicativo. A primeira abertura precisa de internet; depois, as telas e arquivos principais ficam disponíveis offline. O progresso continua guardado localmente em cada aparelho.

### Android

1. Abra o endereço publicado no **Chrome**.
2. Toque no menu ⋮ e escolha **Instalar app** ou **Adicionar à tela inicial**.
3. Confirme. O ícone **Música em Jogo** aparecerá junto dos outros aplicativos.

### iPhone ou iPad

1. Abra o endereço no **Safari**.
2. Toque em **Compartilhar**.
3. Escolha **Adicionar à Tela de Início** e confirme.

Em um computador, navegadores compatíveis também podem mostrar o botão de instalação perto da barra de endereço ou no menu do navegador. É preciso hospedar o site em HTTPS; abrir o arquivo `index.html` diretamente do computador não instala o PWA. Os navegadores e sistemas podem apresentar nomes diferentes para a opção de instalação.

## Se quiser publicar nas lojas de aplicativos

Para oferecer uma versão na Google Play ou App Store, é preciso empacotar o site com uma ferramenta como **Capacitor**, criar os projetos Android/iOS, configurar os ícones e assinar os aplicativos. No Windows é possível preparar e compilar para Android com Android Studio; compilar e enviar a versão iOS exige macOS e Xcode, salvo serviços de compilação em nuvem. As lojas têm contas, políticas e etapas próprias. Para compartilhar com os alunos sem passar pelas lojas, use o PWA acima.

## Referências didáticas

- Open University OpenLearn, introdução à leitura de pauta, claves e ritmo: <https://www.open.edu/openlearn/history-the-arts/music/an-introduction-music-theory/content-section-4.3/>
- Open Music Theory, notas, claves e linhas suplementares: <https://pressbooks.nebraska.edu/openmusictheory/chapter/notation-of-notes-clefs-and-ledger-lines/>
- Open Music Theory, valores rítmicos: <https://open-musictheory.github.io/docs/fundamentals/rhythmic-values/>
- Open Music Theory, métrica e fórmulas de compasso: <https://open-musictheory.github.io/meter.html>
- Open Music Theory, escalas maiores e formas da escala menor: <https://openmusictheory.github.io/scales.html>
- Open Music Theory, tríades, qualidades e campos harmônicos: <https://openmusictheory.github.io/triads.html>
- Open Music Theory, funções harmônicas: <https://openmusictheory.github.io/harmonicFunctions.html>
- OpenLearn/Open University, leitura e digitação para teclado: <https://www.open.edu/openlearn/history-the-arts/introduction-music-theory-2-pitch-and-notation/content-section-2>
- Berklee Online, técnica de piano e passagem do polegar: <https://online.berklee.edu/courses/piano-technique-101>
- Yamaha Music, postura e números dos dedos no violão clássico: <https://hub.yamaha.com/music-educators/instruments/guitars-education/the-basics-of-teaching-classical-guitar/>
- Yamaha Music, diagramas de acordes e digitação de violão: <https://hub.yamaha.com/music-educators/instruments/guitars-education/teach-guitar-chords/>
- Texas A&M University Open Textbook, compassos compostos e pulsos em 6/8: <https://odp.library.tamu.edu/stepstomusictheory/chapter/compound-meters/>
- Open Music Theory, compassos compostos e agrupamento de colcheias: <https://pressbooks.nebraska.edu/openmusictheory/chapter/compound-meters-and-time-signatures/>
- Unicode Musical Symbols, glifos de pausas: <https://www.unicode.org/Public/18.0.0/charts/PDF/U1D100.pdf>
- SMuFL, registro e posicionamento de símbolos musicais: <https://www.smufl.org/version/latest/>
- Carnegie Hall, material didático e partitura de *Ode to Joy*: <https://www.carnegiehall.org/uploadedFiles/Resources_and_Components/PDF/WMI/1516_LU_OrchestraSings_TG.pdf>
- Scottish Youth Music Initiative, partitura de *Ode to Joy*: <https://blogs.glowscotland.org.uk/sb/public/youthmusicinitiative/uploads/sites/3670/2020/09/08110938/Ode-to-Joy-Melody-Sheet.pdf>
