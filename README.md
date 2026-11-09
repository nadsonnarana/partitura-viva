# Partitura Viva

Aplicativo gratuito de prática de leitura musical. É um site estático: não exige conta, servidor, banco de dados ou instalação pelos alunos. O progresso fica no armazenamento local do navegador de cada aparelho.

## Conteúdos

- Explicações completas antes dos jogos, com mapas separados para as claves de sol e fá.
- Leitura das notas naturais pelo nome, sem números de oitava nas opções, e linhas suplementares no pentagrama.
- Figuras rítmicas de semibreve a fusa, com referência de valores em tempos.
- Compassos 2/4, 3/4, 4/4, 2/2 e 6/8.
- Dinâmicas e articulações comuns.
- Posição e formato da cabeça da nota.
- Lições curtas, feedback após cada resposta, pontos e sequência de acertos.
- Aba **Partituras** com cinco melodias tradicionais, escrita nas claves de sol e fá, opção de ouvir e controle para mostrar ou ocultar os nomes das notas.

Na página **Aprender**, primeiro vêm todas as explicações. Só depois aparecem os jogos. As práticas de clave de sol e clave de fá são separadas.

Na aba **Partituras**, selecione uma melodia e alterne a clave. O botão **Ouvir partitura** reproduz a melodia pelo áudio do navegador; **Parar** interrompe a reprodução. A caixa **Mostrar nomes das notas** liga ou desliga as etiquetas. As versões são arranjos didáticos em Dó maior; na clave de fá, a reprodução soa uma oitava abaixo. O áudio funciona sem arquivos externos, depois de uma ação do aluno na página.

## Testar no computador

Abra `index.html` no navegador. Para compartilhar com a turma, publique a pasta em um serviço de hospedagem estática, como GitHub Pages. Não há dados de alunos no código.

## Publicar gratuitamente no GitHub Pages

1. Crie ou entre em uma conta GitHub.
2. Crie um repositório público, por exemplo `partitura-viva`.
3. Envie para a raiz do repositório os arquivos `index.html`, `styles.css`, `app.js`, `scores.js` e `README.md`.
4. Abra **Settings → Pages**.
5. Em **Build and deployment**, escolha **Deploy from a branch**.
6. Selecione `main` e a pasta `/(root)`, então clique em **Save**.
7. Quando o GitHub Pages terminar a publicação, copie o endereço mostrado em Pages. O formato será `https://SEU-USUARIO.github.io/partitura-viva/`.
8. Envie esse endereço aos alunos. Em celulares, eles podem usar o menu do navegador e escolher “Adicionar à tela inicial”.

O GitHub Pages gratuito publica sites estáticos em repositórios públicos. O site e o código ficam públicos; não coloque nomes de estudantes, notas, e-mails ou outros dados pessoais no repositório.

## Instalar como aplicativo no celular (PWA)

O projeto já inclui manifesto, ícone e service worker. Depois de publicar em HTTPS, o navegador poderá instalá-lo como aplicativo. A primeira abertura precisa de internet; depois, as telas e arquivos principais ficam disponíveis offline. O progresso continua guardado localmente em cada aparelho.

### Android

1. Abra o endereço publicado no **Chrome**.
2. Toque no menu ⋮ e escolha **Instalar app** ou **Adicionar à tela inicial**.
3. Confirme. O ícone **Partitura Viva** aparecerá junto dos outros aplicativos.

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
