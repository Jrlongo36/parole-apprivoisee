/* =========================================================
   LA PAROLE APPRIVOISÉE — script.js
   Zéro appel Claude. SpeechSynthesis + API getbible.net (lsg)
   Découpage syllabique : algorithme + table de syllabes manuelles
   ========================================================= */

'use strict';

// =========================================================
// 1. DONNÉES FONDAMENTALES
// =========================================================

const BOOKS = [
  // AT
  { id:1,  name:"Genèse",        abbr:"Gn",  ch:50, testament:"Ancien Testament" },
  { id:2,  name:"Exode",         abbr:"Ex",  ch:40, testament:"Ancien Testament" },
  { id:3,  name:"Lévitique",     abbr:"Lv",  ch:27, testament:"Ancien Testament" },
  { id:4,  name:"Nombres",       abbr:"Nb",  ch:36, testament:"Ancien Testament" },
  { id:5,  name:"Deutéronome",   abbr:"Dt",  ch:34, testament:"Ancien Testament" },
  { id:6,  name:"Josué",         abbr:"Jos", ch:24, testament:"Ancien Testament" },
  { id:7,  name:"Juges",         abbr:"Jg",  ch:21, testament:"Ancien Testament" },
  { id:8,  name:"Ruth",          abbr:"Rt",  ch:4,  testament:"Ancien Testament" },
  { id:9,  name:"1 Samuel",      abbr:"1S",  ch:31, testament:"Ancien Testament" },
  { id:10, name:"2 Samuel",      abbr:"2S",  ch:24, testament:"Ancien Testament" },
  { id:11, name:"1 Rois",        abbr:"1R",  ch:22, testament:"Ancien Testament" },
  { id:12, name:"2 Rois",        abbr:"2R",  ch:25, testament:"Ancien Testament" },
  { id:13, name:"1 Chroniques",  abbr:"1Ch", ch:29, testament:"Ancien Testament" },
  { id:14, name:"2 Chroniques",  abbr:"2Ch", ch:36, testament:"Ancien Testament" },
  { id:15, name:"Esdras",        abbr:"Esd", ch:10, testament:"Ancien Testament" },
  { id:16, name:"Néhémie",       abbr:"Né",  ch:13, testament:"Ancien Testament" },
  { id:17, name:"Esther",        abbr:"Est", ch:10, testament:"Ancien Testament" },
  { id:18, name:"Job",           abbr:"Jb",  ch:42, testament:"Ancien Testament" },
  { id:19, name:"Psaumes",       abbr:"Ps",  ch:150,testament:"Ancien Testament" },
  { id:20, name:"Proverbes",     abbr:"Pr",  ch:31, testament:"Ancien Testament" },
  { id:21, name:"Ecclésiaste",   abbr:"Ec",  ch:12, testament:"Ancien Testament" },
  { id:22, name:"Cantique",      abbr:"Ct",  ch:8,  testament:"Ancien Testament" },
  { id:23, name:"Ésaïe",         abbr:"Es",  ch:66, testament:"Ancien Testament" },
  { id:24, name:"Jérémie",       abbr:"Jr",  ch:52, testament:"Ancien Testament" },
  { id:25, name:"Lamentations",  abbr:"Lm",  ch:5,  testament:"Ancien Testament" },
  { id:26, name:"Ézéchiel",      abbr:"Éz",  ch:48, testament:"Ancien Testament" },
  { id:27, name:"Daniel",        abbr:"Da",  ch:12, testament:"Ancien Testament" },
  { id:28, name:"Osée",          abbr:"Os",  ch:14, testament:"Ancien Testament" },
  { id:29, name:"Joël",          abbr:"Jl",  ch:3,  testament:"Ancien Testament" },
  { id:30, name:"Amos",          abbr:"Am",  ch:9,  testament:"Ancien Testament" },
  { id:31, name:"Abdias",        abbr:"Ab",  ch:1,  testament:"Ancien Testament" },
  { id:32, name:"Jonas",         abbr:"Jon", ch:4,  testament:"Ancien Testament" },
  { id:33, name:"Michée",        abbr:"Mi",  ch:7,  testament:"Ancien Testament" },
  { id:34, name:"Nahoum",        abbr:"Na",  ch:3,  testament:"Ancien Testament" },
  { id:35, name:"Habacuc",       abbr:"Hab", ch:3,  testament:"Ancien Testament" },
  { id:36, name:"Sophonie",      abbr:"So",  ch:3,  testament:"Ancien Testament" },
  { id:37, name:"Aggée",         abbr:"Ag",  ch:2,  testament:"Ancien Testament" },
  { id:38, name:"Zacharie",      abbr:"Za",  ch:14, testament:"Ancien Testament" },
  { id:39, name:"Malachie",      abbr:"Ml",  ch:4,  testament:"Ancien Testament" },
  // NT
  { id:40, name:"Matthieu",      abbr:"Mt",  ch:28, testament:"Nouveau Testament" },
  { id:41, name:"Marc",          abbr:"Mc",  ch:16, testament:"Nouveau Testament" },
  { id:42, name:"Luc",           abbr:"Lc",  ch:24, testament:"Nouveau Testament" },
  { id:43, name:"Jean",          abbr:"Jn",  ch:21, testament:"Nouveau Testament" },
  { id:44, name:"Actes",         abbr:"Ac",  ch:28, testament:"Nouveau Testament" },
  { id:45, name:"Romains",       abbr:"Rm",  ch:16, testament:"Nouveau Testament" },
  { id:46, name:"1 Corinthiens", abbr:"1Co", ch:16, testament:"Nouveau Testament" },
  { id:47, name:"2 Corinthiens", abbr:"2Co", ch:13, testament:"Nouveau Testament" },
  { id:48, name:"Galates",       abbr:"Ga",  ch:6,  testament:"Nouveau Testament" },
  { id:49, name:"Éphésiens",     abbr:"Ép",  ch:6,  testament:"Nouveau Testament" },
  { id:50, name:"Philippiens",   abbr:"Ph",  ch:4,  testament:"Nouveau Testament" },
  { id:51, name:"Colossiens",    abbr:"Col", ch:4,  testament:"Nouveau Testament" },
  { id:52, name:"1 Thessaloniciens", abbr:"1Th", ch:5, testament:"Nouveau Testament" },
  { id:53, name:"2 Thessaloniciens", abbr:"2Th", ch:3, testament:"Nouveau Testament" },
  { id:54, name:"1 Timothée",    abbr:"1Tm", ch:6,  testament:"Nouveau Testament" },
  { id:55, name:"2 Timothée",    abbr:"2Tm", ch:4,  testament:"Nouveau Testament" },
  { id:56, name:"Tite",          abbr:"Ti",  ch:3,  testament:"Nouveau Testament" },
  { id:57, name:"Philémon",      abbr:"Phm", ch:1,  testament:"Nouveau Testament" },
  { id:58, name:"Hébreux",       abbr:"Hé",  ch:13, testament:"Nouveau Testament" },
  { id:59, name:"Jacques",       abbr:"Jc",  ch:5,  testament:"Nouveau Testament" },
  { id:60, name:"1 Pierre",      abbr:"1Pi", ch:5,  testament:"Nouveau Testament" },
  { id:61, name:"2 Pierre",      abbr:"2Pi", ch:3,  testament:"Nouveau Testament" },
  { id:62, name:"1 Jean",        abbr:"1Jn", ch:5,  testament:"Nouveau Testament" },
  { id:63, name:"2 Jean",        abbr:"2Jn", ch:1,  testament:"Nouveau Testament" },
  { id:64, name:"3 Jean",        abbr:"3Jn", ch:1,  testament:"Nouveau Testament" },
  { id:65, name:"Jude",          abbr:"Jd",  ch:1,  testament:"Nouveau Testament" },
  { id:66, name:"Apocalypse",    abbr:"Ap",  ch:22, testament:"Nouveau Testament" }
];

// Table manuelle de syllabes pour les mots bibliques les plus fréquents et difficiles
// Format : mot_minuscule_sans_ponctuation → tableau de syllabes
const SYLLABLE_TABLE = {
  // Mots théologiques clés
  "commencement": ["com","men","ce","ment"],
  "éternel":      ["é","ter","nel"],
  "seigneur":     ["sei","gneur"],
  "créa":         ["cré","a"],
  "lumière":      ["lu","miè","re"],
  "ténèbres":     ["té","nè","bres"],
  "firmament":    ["fir","ma","ment"],
  "assemblée":    ["as","sem","blée"],
  "alliance":     ["al","li","an","ce"],
  "bénédiction":  ["bé","né","dic","tion"],
  "miséricorde":  ["mi","sé","ri","cor","de"],
  "prophète":     ["pro","phè","te"],
  "israelites":   ["is","ra","é","li","tes"],
  "israélites":   ["is","ra","é","li","tes"],
  "tabernacle":   ["ta","ber","na","cle"],
  "sacrifice":    ["sa","cri","fice"],
  "jérusalem":    ["jé","ru","sa","lem"],
  "gloire":       ["gloi","re"],
  "grâce":        ["grâ","ce"],
  "évangile":     ["é","van","gi","le"],
  "baptême":      ["bap","tê","me"],
  "ressuscita":   ["res","sus","ci","ta"],
  "résurrection": ["ré","sur","rec","tion"],
  "rédemption":   ["ré","demp","tion"],
  "repentance":   ["re","pen","tan","ce"],
  "péché":        ["pé","ché"],
  "pardon":       ["par","don"],
  "salut":        ["sa","lut"],
  "prière":       ["priè","re"],
  "adoration":    ["a","do","ra","tion"],
  "louange":      ["lou","an","ge"],
  "annonciation": ["an","non","cia","tion"],
  "nativité":     ["na","ti","vi","té"],
  "crucifixion":  ["cru","ci","fix","ion"],
  "ascension":    ["as","cen","sion"],
  "pentecôte":    ["pen","te","cô","te"],
  "révélation":   ["ré","vé","la","tion"],
  "apocalypse":   ["a","poc","a","lyp","se"],
  "eucharistie":  ["eu","cha","ris","tie"],
  // Mots courants
  "dieu":         ["Dieu"],
  "jésus":        ["Jé","sus"],
  "christ":       ["Christ"],
  "esprit":       ["es","prit"],
  "saint":        ["saint"],
  "sainte":       ["sain","te"],
  "père":         ["pè","re"],
  "fils":         ["fils"],
  "cieux":        ["cieux"],
  "terre":        ["ter","re"],
  "eau":          ["eau"],
  "feu":          ["feu"],
  "vent":         ["vent"],
  "soleil":       ["so","leil"],
  "lune":         ["lu","ne"],
  "étoile":       ["é","toi","le"],
  "jour":         ["jour"],
  "nuit":         ["nuit"],
  "peuple":       ["peu","ple"],
  "roi":          ["roi"],
  "reine":        ["rei","ne"],
  "temple":       ["tem","ple"],
  "maison":       ["mai","son"],
  "pain":         ["pain"],
  "vin":          ["vin"],
  "amour":        ["a","mour"],
  "vérité":       ["vé","ri","té"],
  "justice":      ["jus","tice"],
  "paix":         ["paix"],
  "espérance":    ["es","pé","ran","ce"],
  "foi":          ["foi"],
  "force":        ["for","ce"],
  "puissance":    ["puis","san","ce"],
  "sagesse":      ["sa","ges","se"],
  "connaissance": ["con","nais","san","ce"],
  "commandements":["com","man","de","ments"],
  "serviteur":    ["ser","vi","teur"],
  "berger":       ["ber","ger"],
  "brebis":       ["bre","bis"],
  "agneau":       ["a","gneau"],
  "lion":         ["li","on"],
  "colombe":      ["co","lom","be"],
  "ange":         ["an","ge"],
  "arche":        ["ar","che"],
  "désert":       ["dé","sert"],
  "montagne":     ["mon","ta","gne"],
  "rivière":      ["ri","viè","re"],
  "source":       ["sour","ce"],
  "chemin":       ["che","min"],
  "porte":        ["por","te"],
  "lumière":      ["lu","miè","re"],
  "ombre":        ["om","bre"],
  "miracle":      ["mi","ra","cle"],
  "guérison":     ["gué","ri","son"],
  "délivrance":   ["dé","li","vran","ce"],
};

// Définitions simples — langage pasteur, niveau zéro lecteur
const DEFINITIONS = {
  "éternel":       "L'Éternel, c'est le nom de Dieu dans la Bible. Il a toujours existé, avant tout.",
  "seigneur":      "Seigneur veut dire maître, celui qui commande. Ici c'est Dieu.",
  "dieu":          "Dieu, c'est celui qui a tout créé : le ciel, la terre, toi et moi.",
  "grâce":         "La grâce, c'est quand Dieu nous donne ce que nous ne méritons pas, par amour.",
  "foi":           "La foi, c'est croire en Dieu même quand on ne le voit pas.",
  "péché":         "Le péché, c'est quand on fait quelque chose que Dieu n'aime pas.",
  "salut":         "Le salut, c'est être sauvé, libéré du péché, grâce à Jésus.",
  "jésus":         "Jésus, c'est le Fils de Dieu. Il est venu sur terre pour nous sauver.",
  "christ":        "Christ veut dire 'l'Oint', celui que Dieu a choisi. C'est Jésus.",
  "esprit":        "L'Esprit de Dieu, c'est sa présence invisible qui nous aide et nous guide.",
  "alliance":      "L'alliance, c'est la promesse entre Dieu et son peuple. Comme un contrat d'amour.",
  "miséricorde":   "La miséricorde, c'est la bonté de Dieu qui pardonne même quand on a mal fait.",
  "prophète":      "Un prophète, c'est quelqu'un que Dieu choisit pour transmettre ses paroles.",
  "tabernacle":    "Le tabernacle, c'est la grande tente sacrée où Dieu habitait au milieu de son peuple.",
  "sacrifice":     "Un sacrifice, c'est offrir quelque chose à Dieu pour lui montrer notre amour ou demander pardon.",
  "commencement":  "Le commencement, c'est le tout premier moment, quand tout a commencé.",
  "gloire":        "La gloire de Dieu, c'est sa beauté et sa grandeur que l'on peut voir ou ressentir.",
  "firmament":     "Le firmament, c'est le ciel, tout ce qu'on voit au-dessus de nous.",
  "ténèbres":      "Les ténèbres, c'est le noir complet, l'obscurité totale.",
  "lumière":       "La lumière, c'est ce que Dieu a créé en premier pour chasser l'obscurité.",
  "évangile":      "L'évangile, c'est la bonne nouvelle : Jésus nous aime et nous sauve.",
  "baptême":       "Le baptême, c'est être plongé dans l'eau pour montrer qu'on commence une nouvelle vie avec Dieu.",
  "résurrection":  "La résurrection, c'est Jésus qui est revenu à la vie trois jours après sa mort.",
  "repentance":    "La repentance, c'est regretter ses fautes et décider de changer de vie.",
  "pardon":        "Le pardon, c'est quand Dieu efface nos péchés comme si on n'avait jamais fait de mal.",
  "prière":        "La prière, c'est parler à Dieu, lui dire ce qu'on ressent, ce dont on a besoin.",
  "adoration":     "L'adoration, c'est honorer Dieu, lui dire combien on l'aime et combien il est grand.",
  "louange":       "La louange, c'est chanter et célébrer Dieu pour tout ce qu'il fait.",
  "salut":         "Le salut, c'est être sauvé, libéré du péché grâce à Jésus.",
  "paix":          "La paix de Dieu, c'est un calme profond dans le cœur même quand les choses sont difficiles.",
  "espérance":     "L'espérance, c'est attendre avec confiance que Dieu réalise ses promesses.",
  "sagesse":       "La sagesse, c'est savoir vivre bien, selon Dieu, pas seulement être intelligent.",
  "commandements": "Les commandements, ce sont les règles que Dieu a données à Moïse sur la montagne.",
  "berger":        "Un berger, c'est quelqu'un qui s'occupe des moutons. Dieu est notre berger, il prend soin de nous.",
  "agneau":        "L'agneau, c'est un jeune mouton. Dans la Bible, il représente Jésus qui a donné sa vie.",
  "ange":          "Un ange, c'est un messager de Dieu. Il vient nous apporter les paroles de Dieu.",
  "arche":         "L'arche de Noé, c'est le grand bateau que Dieu a demandé à Noé de construire.",
  "désert":        "Le désert, c'est une grande étendue sans eau ni végétation. Le peuple de Dieu y a marché 40 ans.",
  "miracle":       "Un miracle, c'est quelque chose d'impossible que seul Dieu peut faire.",
  "guérison":      "La guérison, c'est quand Dieu rend la santé à quelqu'un de malade.",
};

// =========================================================
// 2. ÉTAT GLOBAL
// =========================================================

let APP = {
  mode:        'adulte',     // 'enfant' | 'adulte'
  currentBook:  null,        // objet book
  currentChap:  1,
  currentVerse: 1,
  currentStep:  0,           // 0=listen, 1=word-by-word, 2=syllable, 3=quiz, 4=review
  verseText:    '',
  words:        [],          // tokens du verset
  syllables:    {},          // { mot: [syllabes] }
  errors:       [],          // mots ratés pour révision
  speed:        'slow',      // 'slow' | 'normal'
  bibleCache:   {},          // bookId → { chapterNum → [verseTexts] }
  totalStars:   0,
  sessionVerses: 0,
  difficultWords: [],
  repeatTimer:  null,
  verseCount:   0,           // nb de versets débloqués total
};

// =========================================================
// 3. SPEECH SYNTHESIS
// =========================================================

const TTS = {
  voice: null,
  queue: [],
  speaking: false,

  init() {
    const load = () => {
      const voices = speechSynthesis.getVoices();
      this.voice = voices.find(v => v.lang.startsWith('fr')) || voices[0] || null;
    };
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
  },

  getRate() {
    if (APP.mode === 'enfant') return 0.7;
    return APP.speed === 'slow' ? 0.85 : 1.05;
  },

  speak(text, opts = {}) {
    if (!text) return Promise.resolve();
    return new Promise(resolve => {
      speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'fr-FR';
      utter.rate = opts.rate || this.getRate();
      utter.pitch = APP.mode === 'enfant' ? 1.2 : 1.0;
      utter.volume = 1;
      if (this.voice) utter.voice = this.voice;
      utter.onend = resolve;
      utter.onerror = resolve;
      speechSynthesis.speak(utter);
    });
  },

  stop() { speechSynthesis.cancel(); }
};

// =========================================================
// 4. NAVIGATION / ÉCRANS
// =========================================================

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function goBack() {
  // Navigation contextuelle dans le sélecteur
  const s2 = document.getElementById('step-chapter');
  const s3 = document.getElementById('step-verse');
  if (s3.classList.contains('active')) { showSelectorStep('chapter'); return; }
  if (s2.classList.contains('active')) { showSelectorStep('book'); return; }
  // Si on est dans lecture → retour sélecteur
  if (document.getElementById('reading-screen').classList.contains('active')) {
    openSelector(); return;
  }
  showScreen('selector-screen');
}

function showSelectorStep(step) {
  ['step-book','step-chapter','step-verse'].forEach(id => {
    document.getElementById(id).classList.remove('active');
  });
  document.getElementById('step-' + step).classList.add('active');
  updateSelectorTitle(step);
}

function updateSelectorTitle(step) {
  const titles = { book: 'Choisir le Livre', chapter: 'Choisir le Chapitre', verse: 'Choisir le Verset' };
  document.getElementById('selector-title').textContent = titles[step] || 'Navigation';
}

// =========================================================
// 5. MODE ENFANT / ADULTE
// =========================================================

function selectMode(mode) {
  APP.mode = mode;
  document.body.classList.toggle('mode-enfant', mode === 'enfant');
  const msg = mode === 'enfant'
    ? 'Bienvenue ! Je vais t\'aider à apprendre à lire la Bible. C\'est parti !'
    : 'Bienvenue dans La Parole Apprivoisée. Que Dieu bénisse votre apprentissage.';
  TTS.speak(msg);
  loadProgress();
  openSelector();
}

// =========================================================
// 6. SÉLECTEUR LIVRE / CHAPITRE / VERSET
// =========================================================

function openSelector() {
  renderBookGrid();
  showSelectorStep('book');
  showScreen('selector-screen');
  TTS.speak('Choisissez un livre de la Bible.');
}

function renderBookGrid() {
  const grid = document.getElementById('book-grid');
  const search = (document.getElementById('book-search')?.value || '').toLowerCase();
  let html = '';
  let lastTestament = '';
  const done = getCompletedRefs();

  BOOKS.forEach(book => {
    if (search && !book.name.toLowerCase().includes(search) && !book.abbr.toLowerCase().includes(search)) return;
    if (book.testament !== lastTestament) {
      html += `<div class="book-card testament-header">${book.testament}</div>`;
      lastTestament = book.testament;
    }
    const isDone = done.books && done.books.includes(book.id);
    html += `<div class="book-card ${isDone ? 'done' : ''}" onclick="selectBook(${book.id})">
      <span class="book-abbr">${book.abbr}</span>
      <span class="book-name">${book.name}</span>
    </div>`;
  });
  grid.innerHTML = html;
}

function filterBooks() { renderBookGrid(); }

function selectBook(bookId) {
  APP.currentBook = BOOKS.find(b => b.id === bookId);
  document.getElementById('selected-book-name').textContent = APP.currentBook.name;
  renderChapterGrid();
  showSelectorStep('chapter');
  TTS.speak(`Livre ${APP.currentBook.name}. Choisissez un chapitre.`);
}

function renderChapterGrid() {
  const grid = document.getElementById('chapter-grid');
  const done = getCompletedRefs();
  let html = '';
  for (let c = 1; c <= APP.currentBook.ch; c++) {
    const key = `${APP.currentBook.id}:${c}`;
    const isDone = done.chapters && done.chapters.includes(key);
    html += `<button class="num-btn ${isDone ? 'done' : ''}" onclick="selectChapter(${c})">${c}</button>`;
  }
  grid.innerHTML = html;
}

function selectChapter(chap) {
  APP.currentChap = chap;
  document.getElementById('selected-chapter-name').textContent =
    `${APP.currentBook.name} — Chapitre ${chap}`;
  loadChapterVerseCount(chap);
}

async function loadChapterVerseCount(chap) {
  const book = APP.currentBook;
  if (!APP.bibleCache[book.id]) APP.bibleCache[book.id] = {};

  let verseTexts = APP.bibleCache[book.id][chap];
  if (!verseTexts) {
    // Essai localStorage
    const cacheKey = `lsg_${book.id}`;
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        APP.bibleCache[book.id] = parsed;
        verseTexts = parsed[chap];
      } catch(e) {}
    }
  }

  if (!verseTexts) {
    // Chargement depuis l'API (tout le livre)
    showToast('Chargement en cours…');
    try {
      const res = await fetch(`https://api.getbible.net/v2/lsg/${book.id}.json`);
      const data = await res.json();
      const chapMap = {};
      Object.entries(data.chapters).forEach(([cNum, chapObj]) => {
        const vArr = Object.values(chapObj.verses).map(v => cleanVerseText(v.text));
        chapMap[parseInt(cNum)] = vArr;
      });
      APP.bibleCache[book.id] = chapMap;
      localStorage.setItem(`lsg_${book.id}`, JSON.stringify(chapMap));
      verseTexts = chapMap[chap] || [];
    } catch(e) {
      showToast('Connexion nécessaire pour le premier chargement.');
      return;
    }
  }

  renderVerseGrid(verseTexts.length);
  showSelectorStep('verse');
  TTS.speak(`Chapitre ${chap}. Choisissez un verset.`);
}

function renderVerseGrid(count) {
  const grid = document.getElementById('verse-grid');
  const done = getCompletedRefs();
  let html = '';
  for (let v = 1; v <= count; v++) {
    const key = `${APP.currentBook.id}:${APP.currentChap}:${v}`;
    const isDone = done.verses && done.verses.includes(key);
    html += `<button class="num-btn ${isDone ? 'done' : ''}" onclick="selectVerse(${v})">${v}</button>`;
  }
  grid.innerHTML = html;
}

async function selectVerse(verseNum) {
  APP.currentVerse = verseNum;
  const book = APP.currentBook;
  const verseTexts = APP.bibleCache[book.id]?.[APP.currentChap];
  if (!verseTexts || !verseTexts[verseNum - 1]) {
    showToast('Verset introuvable.');
    return;
  }
  APP.verseText = verseTexts[verseNum - 1];
  APP.words = tokenizeVerse(APP.verseText);
  APP.syllables = buildSyllableMap(APP.words);
  APP.errors = [];
  APP.currentStep = 0;
  startReadingSession();
}

// =========================================================
// 7. NETTOYAGE ET TOKENISATION
// =========================================================

function cleanVerseText(text) {
  return (text || '')
    .replace(/¶/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeVerse(text) {
  // Retourne les mots sans ponctuation attachée, en gardant ponctuation pour affichage
  const tokens = [];
  const regex = /(\S+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[1];
    const clean = raw.replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
    if (clean.length > 0) tokens.push({ display: raw, clean: clean });
  }
  return tokens;
}

// =========================================================
// 8. DÉCOUPAGE SYLLABIQUE "ZÉRO FAUTE"
// =========================================================

/**
 * Construit la carte des syllabes pour chaque mot du verset.
 * Priorité : table manuelle → algorithme
 */
function buildSyllableMap(words) {
  const map = {};
  words.forEach(w => {
    const key = w.clean.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
    if (map[key]) return; // déjà calculé
    map[key] = syllabify(w.clean);
  });
  return map;
}

function syllabify(word) {
  const lower = word.toLowerCase().replace(/[^a-zà-ÿ'-]/g, '');
  // 1. Table manuelle (priorité absolue)
  if (SYLLABLE_TABLE[lower]) return SYLLABLE_TABLE[lower];
  // 2. Mots très courts → pas de découpage
  if (lower.length <= 3) return [word];
  // 3. Algorithme
  return syllabifyAlgorithm(word);
}

/**
 * Algorithme de syllabification français robuste.
 * Règles appliquées par ordre de priorité :
 * 1. Digraphes consonantiques inséparables : ch, ph, th, gn, qu, gu
 * 2. Groupes consonantiques initiaux de syllabes : br, cr, dr, fr, gr, pr, tr, vr, bl, cl, fl, gl, pl
 * 3. Voyelles consécutives : souvent une frontière
 * 4. Consonne unique entre voyelles → va avec la suivante
 * 5. Deux consonnes entre voyelles → frontière entre elles (sauf groupes)
 * 6. Trois consonnes ou plus → frontière après la première
 */
function syllabifyAlgorithm(word) {
  // Normaliser les accents pour la détection voyelle/consonne
  const vowels = new Set('aeiouàâäèéêëîïôùûüÿœæ');
  const chars = word.split('');
  const n = chars.length;

  // Digraphes inséparables (on ne coupe jamais entre eux)
  const digraphsCons = ['ch','ph','th','gn','qu','gu','sc'];
  // Groupes d'attaque de syllabe (consonne + r/l)
  const attackGroups = ['br','cr','dr','fr','gr','pr','tr','vr','bl','cl','fl','gl','pl','str','spr','scr'];

  const isVowel = c => vowels.has(c.toLowerCase());
  const isDigraph = (i) => {
    const pair = (chars[i] + (chars[i+1] || '')).toLowerCase();
    return digraphsCons.includes(pair);
  };
  const isAttack = (i) => {
    const triple = (chars[i] + (chars[i+1] || '') + (chars[i+2] || '')).toLowerCase();
    const pair   = (chars[i] + (chars[i+1] || '')).toLowerCase();
    return attackGroups.includes(triple) || attackGroups.includes(pair);
  };

  // Trouver les positions de coupure
  const cuts = [0];
  let i = 1;
  while (i < n) {
    if (!isVowel(chars[i-1]) || !isVowel(chars[i])) {
      i++;
      continue;
    }
    // Deux voyelles consécutives → possible frontière
    // Mais pas pour les diphtongues (ai, ei, au, eau, ou, eu, oeu, oi, ui, ie, io)
    const pair = (chars[i-1] + chars[i]).toLowerCase();
    const diphthongs = ['ai','ei','au','ou','eu','oi','ui','ie','io','ue','eau','oeu'];
    if (!diphthongs.includes(pair)) {
      cuts.push(i);
    }
    i++;
  }

  // Coupure consonne-voyelle
  i = 1;
  while (i < n - 1) {
    if (isVowel(chars[i-1]) && !isVowel(chars[i]) && isVowel(chars[i+1])) {
      // V C V → coupe avant la consonne
      if (!isDigraph(i-1)) {
        cuts.push(i);
      }
    }
    if (isVowel(chars[i-1]) && !isVowel(chars[i]) && !isVowel(chars[i+1]) && i + 2 < n && isVowel(chars[i+2])) {
      // V C C V
      const pair = (chars[i] + chars[i+1]).toLowerCase();
      if (attackGroups.includes(pair)) {
        cuts.push(i); // coupe avant les deux consonnes
      } else if (!digraphsCons.includes(pair)) {
        cuts.push(i+1); // coupe entre les deux consonnes
      }
    }
    i++;
  }

  // Dédupliquer et trier les coupures
  const sortedCuts = [...new Set(cuts)].sort((a,b) => a-b);

  // Construire les syllabes
  const syllables = [];
  for (let j = 0; j < sortedCuts.length; j++) {
    const start = sortedCuts[j];
    const end = sortedCuts[j+1] || n;
    const syl = chars.slice(start, end).join('');
    if (syl.trim()) syllables.push(syl);
  }

  // Fusionner les syllabes sans voyelle avec la suivante ou précédente
  const finalSyls = [];
  syllables.forEach((syl, idx) => {
    const hasVowel = syl.split('').some(c => isVowel(c));
    if (!hasVowel && finalSyls.length > 0) {
      finalSyls[finalSyls.length - 1] += syl;
    } else {
      finalSyls.push(syl);
    }
  });

  return finalSyls.length > 0 ? finalSyls : [word];
}

// =========================================================
// 9. SESSION DE LECTURE — MACHINE À ÉTATS
// =========================================================

function startReadingSession() {
  showScreen('reading-screen');
  updateReferenceDisplay();
  renderVerseWords();
  APP.currentStep = 0;
  APP.errors = [];
  updateStepDots();
  clearExercise();
  startStep0_Listen();
}

function updateReferenceDisplay() {
  document.getElementById('ref-book').textContent = APP.currentBook.name;
  document.getElementById('ref-chap').textContent = APP.currentChap;
  document.getElementById('ref-verse').textContent = APP.currentVerse;
  document.getElementById('verse-ref-badge').textContent =
    `${APP.currentBook.abbr} ${APP.currentChap}:${APP.currentVerse}`;
}

function renderVerseWords(highlightIndex = -1) {
  const container = document.getElementById('verse-words');
  container.innerHTML = APP.words.map((w, i) => {
    const cls = [
      'word-token',
      i === highlightIndex ? 'active-word' : '',
      APP.errors.includes(w.clean) ? '' : '',
    ].filter(Boolean).join(' ');
    return `<span class="${cls}" data-idx="${i}" onclick="onWordClick(${i})">${w.display}</span>`;
  }).join('');
}

function onWordClick(idx) {
  const word = APP.words[idx];
  if (!word) return;
  // Lire la définition si disponible
  const key = word.clean.toLowerCase();
  const def = DEFINITIONS[key];
  TTS.speak(word.clean).then(() => {
    if (def) {
      setTimeout(() => showDefinitionPopup(word.clean, def), 400);
    }
  });
}

function showDefinitionPopup(word, def) {
  removeDefinitionPopup();
  const popup = document.createElement('div');
  popup.className = 'def-popup';
  popup.id = 'def-popup';
  popup.innerHTML = `
    <button class="def-popup-close" onclick="removeDefinitionPopup()">✕</button>
    <h4>${word}</h4>
    <p>${def}</p>`;
  document.body.appendChild(popup);
  requestAnimationFrame(() => popup.classList.add('open'));
  TTS.speak(def);
}
function removeDefinitionPopup() {
  const p = document.getElementById('def-popup');
  if (p) p.remove();
}

// ---------- ÉTAPE 0 : ÉCOUTE DU VERSET (3 fois) ----------
async function startStep0_Listen() {
  APP.currentStep = 0;
  updateStepDots();
  clearExercise();
  document.getElementById('step-btn').textContent = '▶ Mot par mot';

  resetRepeatTimer();
  await TTS.speak('Écoute bien ce verset. Je vais le lire trois fois.');
  for (let i = 0; i < 3; i++) {
    await TTS.speak(APP.verseText);
    if (i < 2) await delay(600);
  }
  await TTS.speak('Maintenant, appuie sur le bouton pour continuer mot par mot.');
  setRepeatTimer(() => TTS.speak(APP.verseText));
}

// ---------- ÉTAPE 1 : MOT PAR MOT ----------
async function startStep1_WordByWord() {
  APP.currentStep = 1;
  updateStepDots();
  clearExercise();
  document.getElementById('step-btn').textContent = '▶ Syllabes';

  cancelRepeatTimer();
  await TTS.speak('Maintenant je lis chaque mot. Suis du doigt !');
  for (let i = 0; i < APP.words.length; i++) {
    renderVerseWords(i);
    // Scroll to highlighted word
    const wordEl = document.querySelector(`.word-token[data-idx="${i}"]`);
    if (wordEl) wordEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
    await TTS.speak(APP.words[i].clean, { rate: APP.mode === 'enfant' ? 0.65 : 0.8 });
    await delay(300);
  }
  renderVerseWords();
  await TTS.speak('Bravo ! Tu as suivi tous les mots. Continue !');
}

// ---------- ÉTAPE 2 : QUIZ SYLLABATION ----------
async function startStep2_Syllable() {
  APP.currentStep = 2;
  updateStepDots();
  document.getElementById('step-btn').textContent = '▶ Quiz mots';

  // Choisir les mots de 2+ syllabes
  const candidates = APP.words.filter(w => {
    const syls = APP.syllables[w.clean.toLowerCase().replace(/[^a-zà-ÿ]/g, '')];
    return syls && syls.length >= 2;
  });

  if (candidates.length === 0) {
    await TTS.speak('Ce verset a de très courts mots. Passons au quiz !');
    startStep3_WordQuiz();
    return;
  }

  // Limiter à 3 mots max
  const toTest = shuffleArr([...candidates]).slice(0, 3);
  await runSyllableQuiz(toTest, 0);
}

async function runSyllableQuiz(words, idx) {
  if (idx >= words.length) {
    await TTS.speak('Excellent travail sur les syllabes !');
    startStep3_WordQuiz();
    return;
  }
  const word = words[idx];
  const key  = word.clean.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
  const syls = APP.syllables[key] || [word.clean];

  // Prendre une syllabe cible
  const targetIdx  = Math.floor(Math.random() * syls.length);
  const targetSyl  = syls[targetIdx];

  // Construire 2 distracteurs : autres syllabes du même mot ou mots voisins
  const distractors = generateSylDistractors(targetSyl, word.clean, APP.words);
  const options = shuffleArr([targetSyl, ...distractors.slice(0, 2)]);

  const zone = document.getElementById('exercise-zone');
  zone.classList.remove('hidden');
  zone.innerHTML = `
    <div class="syllable-exercise">
      <h3>🔤 Quelle est cette syllabe ?</h3>
      <div class="target-word-display">${word.display}</div>
      <div class="syllable-options" id="syl-options"></div>
    </div>`;

  const optContainer = document.getElementById('syl-options');
  options.forEach(syl => {
    const btn = document.createElement('button');
    btn.className = 'syl-btn';
    btn.textContent = syl;
    btn.onclick = () => handleSylAnswer(btn, syl, targetSyl, word, words, idx);
    optContainer.appendChild(btn);
  });

  await TTS.speak(`Dans le mot ${word.clean}, touche la syllabe : ${targetSyl}`);
  setRepeatTimer(() => TTS.speak(`Touche la syllabe : ${targetSyl}`));
}

async function handleSylAnswer(btn, chosen, correct, word, words, idx) {
  cancelRepeatTimer();
  const allBtns = document.querySelectorAll('.syl-btn');
  allBtns.forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add('correct');
    await TTS.speak('Bravo ! C\'est la bonne syllabe !');
    setTimeout(() => runSyllableQuiz(words, idx + 1), 800);
  } else {
    btn.classList.add('wrong');
    // Montrer la bonne réponse
    allBtns.forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
    if (!APP.errors.find(e => e === word.clean)) APP.errors.push(word.clean);
    APP.difficultWords.push(word.clean);
    await TTS.speak(`Essaie encore. La bonne syllabe était : ${correct}`);
    setTimeout(() => runSyllableQuiz(words, idx + 1), 1200);
  }
}

// ---------- ÉTAPE 3 : QUIZ RECONNAISSANCE MOT ----------
async function startStep3_WordQuiz() {
  APP.currentStep = 3;
  updateStepDots();
  clearExercise();
  document.getElementById('step-btn').textContent = '▶ Révision';

  // Sélectionner 3 mots significatifs (> 3 lettres)
  const significant = APP.words.filter(w => w.clean.length > 3);
  if (significant.length < 2) {
    await TTS.speak('Passons à la révision !');
    startStep4_Review();
    return;
  }
  const toTest = shuffleArr([...significant]).slice(0, Math.min(3, significant.length));
  await runWordQuiz(toTest, 0);
}

async function runWordQuiz(words, idx) {
  if (idx >= words.length) {
    await TTS.speak('Parfait ! Tu reconnais bien les mots !');
    startStep4_Review();
    return;
  }
  const target = words[idx];
  // Distracteurs : autres mots du verset
  const others = APP.words.filter(w => w.clean !== target.clean && w.clean.length > 2);
  const distractors = shuffleArr(others).slice(0, 2).map(w => w.display);
  const options = shuffleArr([target.display, ...distractors]);

  const zone = document.getElementById('exercise-zone');
  zone.classList.remove('hidden');
  zone.innerHTML = `
    <div class="word-exercise">
      <h3>🎯 Touche le mot que tu entends</h3>
      <div class="word-options" id="word-opts"></div>
    </div>`;

  const container = document.getElementById('word-opts');
  const icons = ['🔵','🟢','🟠'];
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'word-opt-btn';
    btn.innerHTML = `<span class="opt-icon">${icons[i]}</span><span>${opt}</span>`;
    btn.onclick = () => handleWordQuizAnswer(btn, opt, target.display, target, words, idx);
    container.appendChild(btn);
  });

  await TTS.speak(`Touche le mot : ${target.clean}`);
  setRepeatTimer(() => TTS.speak(`Quel mot est : ${target.clean} ?`));
}

async function handleWordQuizAnswer(btn, chosen, correct, word, words, idx) {
  cancelRepeatTimer();
  document.querySelectorAll('.word-opt-btn').forEach(b => b.disabled = true);

  if (chosen === correct) {
    btn.classList.add('correct');
    await TTS.speak('Oui ! Tu l\'as reconnu !');
    setTimeout(() => runWordQuiz(words, idx + 1), 800);
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('.word-opt-btn').forEach(b => {
      if (b.querySelector('span:last-child').textContent === correct) b.classList.add('correct');
    });
    if (!APP.errors.find(e => e === word.clean)) APP.errors.push(word.clean);
    APP.difficultWords.push(word.clean);
    await TTS.speak(`Le bon mot était : ${correct}. On continue !`);
    setTimeout(() => runWordQuiz(words, idx + 1), 1200);
  }
}

// ---------- ÉTAPE 4 : RÉVISION DES MOTS RATÉS ----------
async function startStep4_Review() {
  APP.currentStep = 4;
  updateStepDots();
  clearExercise();
  document.getElementById('step-btn').textContent = '✓ Terminer';

  if (APP.errors.length === 0) {
    await TTS.speak('Parfait ! Tu n\'as fait aucune erreur sur ce verset !');
    showCongratsOverlay(true);
    return;
  }

  await TTS.speak(`Révisons ensemble les ${APP.errors.length} mot${APP.errors.length > 1 ? 's' : ''} difficile${APP.errors.length > 1 ? 's' : ''}.`);

  const zone = document.getElementById('exercise-zone');
  zone.classList.remove('hidden');
  let html = '<div style="padding:0.5rem">';
  html += '<h3 style="font-family:var(--font-title);color:var(--orange);text-align:center;margin-bottom:1rem;">🔁 Révision</h3>';
  APP.errors.forEach(word => {
    const key = word.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
    const syls = (APP.syllables[key] || [word]).join(' · ');
    html += `<div style="background:rgba(245,130,58,0.1);border:1px solid var(--orange);border-radius:12px;padding:0.875rem;margin-bottom:0.6rem;display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:var(--font-title);font-size:1.2rem">${word}</span>
      <span style="color:var(--text-muted);font-size:0.9rem">${syls}</span>
      <button onclick="TTS.speak('${word.replace(/'/g,"\\'")}',{})" style="background:rgba(255,255,255,0.1);border:none;color:white;border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:1rem">🔊</button>
    </div>`;
  });
  html += '</div>';
  zone.innerHTML = html;

  for (const word of APP.errors) {
    await TTS.speak(word, { rate: 0.7 });
    const key = word.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
    const syls = APP.syllables[key] || [word];
    await TTS.speak(syls.join('… '), { rate: 0.6 });
    await delay(300);
  }
  await TTS.speak('Tu connais maintenant ces mots difficiles. Bravo !');
  showCongratsOverlay(APP.errors.length === 0);
}

// ---------- NEXT STEP (bouton ▶) ----------
function nextStep() {
  cancelRepeatTimer();
  removeDefinitionPopup();
  switch(APP.currentStep) {
    case 0: startStep1_WordByWord(); break;
    case 1: startStep2_Syllable();   break;
    case 2: startStep3_WordQuiz();   break;
    case 3: startStep4_Review();     break;
    case 4: showCongratsOverlay(APP.errors.length === 0); break;
  }
}

function updateStepDots() {
  for (let i = 1; i <= 5; i++) {
    const dot = document.getElementById(`dot-${i}`);
    dot.classList.remove('active','done');
    if (i - 1 < APP.currentStep) dot.classList.add('done');
    else if (i - 1 === APP.currentStep) dot.classList.add('active');
  }
}

function clearExercise() {
  const zone = document.getElementById('exercise-zone');
  zone.classList.add('hidden');
  zone.innerHTML = '';
}

// =========================================================
// 10. FÉLICITATION & SUITE
// =========================================================

async function showCongratsOverlay(perfect) {
  cancelRepeatTimer();
  const stars = perfect ? 3 : APP.errors.length <= 1 ? 2 : 1;
  APP.totalStars += stars;
  APP.sessionVerses++;
  saveProgress();
  updateProgressDisplay();

  // Confettis !
  if (typeof confetti !== 'undefined') {
    confetti({
      particleCount: perfect ? 150 : 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#534AB7','#E8C96B','#4CAF86','#F5823A']
    });
  }

  const icon    = perfect ? '🏆' : '🌟';
  const title   = perfect ? 'Parfait !' : 'Bravo !';
  const starStr = '⭐'.repeat(stars);
  const msg = perfect
    ? `Tu as parfaitement appris ${APP.currentBook.name} ${APP.currentChap}:${APP.currentVerse} !`
    : `Tu as bien travaillé ce verset. Continue comme ça !`;

  document.getElementById('congrats-icon').textContent = icon;
  document.getElementById('congrats-title').textContent = title;
  document.getElementById('congrats-msg').textContent = msg;
  document.getElementById('congrats-stars').textContent = starStr;
  document.getElementById('congrats-overlay').classList.remove('hidden');

  await TTS.speak(`${title} ${msg} Tu as gagné ${stars} étoile${stars > 1 ? 's' : ''} !`);
}

function continueAfterCongrats() {
  document.getElementById('congrats-overlay').classList.add('hidden');
  // Proposer le verset suivant
  const nextVerse = APP.currentVerse + 1;
  const book = APP.currentBook;
  const verseTexts = APP.bibleCache[book.id]?.[APP.currentChap];
  if (verseTexts && nextVerse <= verseTexts.length) {
    TTS.speak('Veux-tu continuer avec le verset suivant ?');
    selectVerse(nextVerse);
  } else {
    TTS.speak('Tu as terminé ce chapitre ! Choisis un nouveau passage.');
    openSelector();
  }
}

// =========================================================
// 11. CONTRÔLES LECTURE
// =========================================================

function replayVerse() {
  TTS.stop();
  TTS.speak(APP.verseText);
}

function toggleSpeed() {
  APP.speed = APP.speed === 'slow' ? 'normal' : 'slow';
  const btn = document.getElementById('speed-btn');
  btn.textContent = APP.speed === 'slow' ? '🐢' : '🐇';
  btn.classList.toggle('fast', APP.speed === 'normal');
  TTS.speak(APP.speed === 'slow' ? 'Lecture lente.' : 'Lecture normale.');
}

// =========================================================
// 12. TIMER DE RÉPÉTITION AUTO
// =========================================================

function setRepeatTimer(fn) {
  cancelRepeatTimer();
  APP.repeatTimer = setTimeout(() => { fn(); setRepeatTimer(fn); }, 5000);
}
function resetRepeatTimer() { cancelRepeatTimer(); }
function cancelRepeatTimer() {
  if (APP.repeatTimer) { clearTimeout(APP.repeatTimer); APP.repeatTimer = null; }
}

// =========================================================
// 13. TABLEAU PASTEUR
// =========================================================

function openPastorView() {
  renderPastorDashboard();
  showScreen('pastor-screen');
  TTS.speak('Tableau du pasteur.');
}
function closePastorView() {
  showScreen('reading-screen');
}

function renderPastorDashboard() {
  const progress = loadRawProgress();
  const body = document.getElementById('pastor-body');

  if (!progress || !progress.log || progress.log.length === 0) {
    body.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem">Aucune progression enregistrée.</p>';
    return;
  }

  const totalSessions = progress.log.length;
  const totalVerses   = progress.totalVerses || 0;
  const totalStars    = progress.totalStars || 0;
  const difficults    = [...new Set(progress.difficultWords || [])];

  body.innerHTML = `
    <div class="pastor-stat-card">
      <h3>📊 Résumé global</h3>
      <div class="stat-row"><span>Sessions totales</span><span>${totalSessions}</span></div>
      <div class="stat-row"><span>Versets travaillés</span><span>${totalVerses}</span></div>
      <div class="stat-row"><span>Étoiles gagnées</span><span>${totalStars} ⭐</span></div>
    </div>
    <div class="pastor-stat-card">
      <h3>⚠️ Mots difficiles fréquents</h3>
      ${difficults.length > 0
        ? `<div class="difficult-words-list">${difficults.map(w => `<span class="diff-word-tag">${w}</span>`).join('')}</div>`
        : '<p style="color:var(--text-muted)">Aucun mot difficile enregistré.</p>'}
    </div>
    <div class="pastor-stat-card">
      <h3>📅 Dernières sessions</h3>
      ${progress.log.slice(-10).reverse().map(entry => `
        <div class="stat-row">
          <span>${entry.date}</span>
          <span>${entry.ref}</span>
          <span>${'⭐'.repeat(entry.stars)}</span>
        </div>`).join('')}
    </div>`;
}

function exportProgress() {
  const progress = loadRawProgress();
  if (!progress) { showToast('Aucune donnée à exporter.'); return; }

  let txt = '=== La Parole Apprivoisée — Rapport Pasteur ===\n\n';
  txt += `Total versets : ${progress.totalVerses || 0}\n`;
  txt += `Total étoiles : ${progress.totalStars || 0}\n\n`;
  txt += 'Mots difficiles :\n';
  (progress.difficultWords || []).forEach(w => { txt += `  - ${w}\n`; });
  txt += '\nHistorique :\n';
  (progress.log || []).forEach(e => {
    txt += `  ${e.date}  ${e.ref}  ${'⭐'.repeat(e.stars)}\n`;
  });

  const blob = new Blob([txt], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `rapport_parole_${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  TTS.speak('Rapport exporté.');
}

// =========================================================
// 14. SAUVEGARDE / CHARGEMENT
// =========================================================

function saveProgress() {
  const raw = loadRawProgress() || { log: [], totalVerses: 0, totalStars: 0, difficultWords: [], books: [], chapters: [], verses: [] };
  const ref = `${APP.currentBook.abbr} ${APP.currentChap}:${APP.currentVerse}`;
  const today = new Date().toLocaleDateString('fr-FR');

  raw.log.push({ date: today, ref, stars: APP.totalStars });
  raw.totalVerses = (raw.totalVerses || 0) + 1;
  raw.totalStars  = (raw.totalStars  || 0) + (APP.totalStars || 0);
  raw.difficultWords = [...new Set([...(raw.difficultWords || []), ...APP.difficultWords])];

  // Tracker complétude
  if (!raw.books.includes(APP.currentBook.id)) raw.books.push(APP.currentBook.id);
  const chapKey = `${APP.currentBook.id}:${APP.currentChap}`;
  if (!raw.chapters.includes(chapKey)) raw.chapters.push(chapKey);
  const verseKey = `${APP.currentBook.id}:${APP.currentChap}:${APP.currentVerse}`;
  if (!raw.verses.includes(verseKey)) raw.verses.push(verseKey);

  localStorage.setItem('parole_progress', JSON.stringify(raw));
}

function loadProgress() {
  const raw = loadRawProgress();
  if (raw) {
    APP.totalStars = raw.totalStars || 0;
    updateProgressDisplay();
  }
}

function loadRawProgress() {
  try { return JSON.parse(localStorage.getItem('parole_progress')) || null; } catch(e) { return null; }
}

function getCompletedRefs() {
  const raw = loadRawProgress();
  return raw || { books:[], chapters:[], verses:[] };
}

function updateProgressDisplay() {
  document.getElementById('progress-count').textContent = APP.totalStars;
}

// =========================================================
// 15. UTILITAIRES
// =========================================================

function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function generateSylDistractors(targetSyl, word, allWords) {
  const pool = [];
  // Autres syllabes du même mot
  const key = word.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
  const syls = APP.syllables[key] || [];
  syls.forEach(s => { if (s !== targetSyl) pool.push(s); });
  // Syllabes d'autres mots du verset
  allWords.forEach(w => {
    const k2 = w.clean.toLowerCase().replace(/[^a-zà-ÿ]/g, '');
    const s2  = APP.syllables[k2] || [];
    s2.forEach(s => { if (s !== targetSyl && !pool.includes(s)) pool.push(s); });
  });
  // Fallback : syllabes communes
  const fallback = ['la','le','un','de','et','en','il','au','on','ma','sa','du','ce','se','te'];
  fallback.forEach(s => { if (s !== targetSyl.toLowerCase() && !pool.includes(s)) pool.push(s); });
  return shuffleArr(pool).slice(0, 2);
}

function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, duration);
}

// =========================================================
// 16. INITIALISATION
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  TTS.init();

  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Accueil vocal
  setTimeout(() => {
    TTS.speak(
      'Bienvenue dans La Parole Apprivoisée. ' +
      'Choisissez le mode Enfant ou le mode Adulte pour commencer.'
    );
  }, 800);

  // Fermer popup définition en cliquant ailleurs
  document.addEventListener('click', e => {
    const popup = document.getElementById('def-popup');
    if (popup && !popup.contains(e.target) && !e.target.classList.contains('word-token')) {
      removeDefinitionPopup();
    }
  });
});
