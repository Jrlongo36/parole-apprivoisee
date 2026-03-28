// --- VARIABLES GLOBALES ---
let bibleData = null;
let appState = {
    mode: 'enfant',
    livre: null,
    chapitre: 1,
    verset: 1,
    motActuelIndex: 0,
    syllabeCorrecte: ""
};

// --- INITIALISATION & CHARGEMENT ---
window.onload = async () => {
    setupSpeedControl();
    try {
        const response = await fetch('segond_1910.json');
        if (!response.ok) throw new Error('Erreur réseau');
        bibleData = await response.json();
        
        // Cacher chargement, montrer modes
        document.getElementById('loading-zone').classList.add('hidden');
        document.getElementById('mode-zone').classList.remove('hidden');
    } catch (error) {
        document.getElementById('loading-zone').innerHTML = "<p style='color:red'>Erreur de chargement. Vérifie le fichier JSON.</p>";
        console.error(error);
    }
};

// --- NAVIGATION ---
function nav(screenId) {
    // Cache toutes les sections
    document.querySelectorAll('body > section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('body > section').forEach(s => s.classList.add('hidden'));
    // Montre la section demandée
    const target = document.getElementById(screenId);
    target.classList.remove('hidden');
    target.classList.add('active');
}

function choisirMode(mode) {
    appState.mode = mode;
    document.body.className = mode; // Pour le CSS
    genererListeLivres();
    nav('scr-livres');
}

// --- LOGIQUE BIBLE ---
function genererListeLivres() {
    const container = document.getElementById('liste-livres');
    container.innerHTML = '';
    Object.keys(bibleData).forEach(livre => {
        const btn = document.createElement('button');
        btn.className = 'btn-item';
        btn.innerText = livre;
        btn.onclick = () => choisirLivre(livre);
        container.appendChild(btn);
    });
}

function choisirLivre(livre) {
    appState.livre = livre;
    document.getElementById('titre-chapitres').innerText = livre;
    const container = document.getElementById('liste-chapitres');
    container.innerHTML = '';
    
    const nbChapitres = Object.keys(bibleData[livre]).length;
    for (let i = 1; i <= nbChapitres; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-num';
        btn.innerText = i;
        btn.onclick = () => chargerLecture(livre, i, 1);
        container.appendChild(btn);
    }
    nav('scr-chapitres');
}

function retourAuxChapitres() {
    window.speechSynthesis.cancel(); // Arrête la voix
    nav('scr-chapitres');
}

// --- CŒUR : LECTURE & EXERCICE ---
function chargerLecture(livre, chapitre, verset) {
    appState.livre = livre;
    appState.chapitre = chapitre;
    appState.verset = verset;
    appState.motActuelIndex = 0;

    // Mise à jour UI
    document.getElementById('reference-lecture').innerText = `${livre} ${chapitre}:${verset}`;
    const texte = bibleData[livre][chapitre][verset];
    document.getElementById('texte-verset').innerText = texte;

    showStep(1); // Revenir à l'étape écoute
    nav('scr-lecture');
}

function showStep(stepNumber) {
    document.querySelectorAll('#exercice-zone .step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step-${stepNumber}`).classList.remove('hidden');
}

// --- SYNTHÈSE VOCALE (TTS) ---
function setupSpeedControl() {
    const speedInput = document.getElementById('speed');
    const speedVal = document.getElementById('speed-val');
    speedInput.oninput = () => { speedVal.innerText = speedInput.value; };
}

function lireVerset() {
    window.speechSynthesis.cancel();
    const texte = bibleData[appState.livre][appState.chapitre][appState.verset];
    const utterance = new SpeechSynthesisUtterance(texte);
    utterance.lang = 'fr-FR';
    utterance.rate = document.getElementById('speed').value;
    
    utterance.onend = () => {
        // Après la lecture, on passe automatiquement à l'exercice de syllabes
        lancerExerciceSyllabes();
    };
    
    window.speechSynthesis.speak(utterance);
}

// --- ALGORITHME DE SYLLABATION & JEU ---
function lancerExerciceSyllabes() {
    const texte = bibleData[appState.livre][appState.chapitre][appState.verset];
    // Nettoyer le texte et découper en mots (on garde les mots > 3 lettres)
    const mots = texte.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s+/).filter(m => m.length > 3);
    
    if (appState.motActuelIndex >= mots.length) {
        showStep(3); // Fin du verset
        return;
    }

    const motTarget = mots[appState.motActuelIndex];
    const syllabes = decouperMot(motTarget);
    
    if (syllabes.length < 2) {
        appState.motActuelIndex++;
        lancerExerciceSyllabes(); // Passe au mot suivant si indivisible
        return;
    }

    // Préparer l'UI du jeu
    showStep(2);
    appState.syllabeCorrecte = syllabes[0]; // On demande la première syllabe
    
    // Afficher le mot à trou
    const motTrou = appState.syllabeCorrecte.replace(/./g, '_') + ' ' + syllabes.slice(1).join('');
    document.getElementById('mot-a-trou').innerText = motTrou;

    // Générer les choix (correcte + intrus)
    genererChoixSyllabes(appState.syllabeCorrecte);
}

// Algo basique de découpage (C-V)
function decouperMot(mot) {
    // Regex très simplifiée pour l'exemple
    return mot.toLowerCase()
      .replace(/([aeiouyàâéèêëîïôûù])([^aeiouyàâéèêëîïôûù\s])([aeiouyàâéèêëîïôûù])/g, '$1-$2$3')
      .split('-');
}

function genererChoixSyllabes(correcte) {
    const container = document.getElementById('syllabes-choix');
    container.innerHTML = '';
    
    const intrus = ["pa", "to", "ma", "re", "li"]; // Intrus statiques pour le MVP
    const choix = [correcte, intrus[Math.floor(Math.random()*intrus.length)]];
    
    // Mélanger
    choix.sort(() => Math.random() - 0.5);

    choix.forEach(syl => {
        const btn = document.createElement('button');
        btn.className = 'btn-syl';
        btn.innerText = syl;
        btn.onclick = () => validerSyllabe(syl, btn);
        container.appendChild(btn);
    });
}

function validerSyllabe(choix, bouton) {
    if (choix === appState.syllabeCorrecte) {
        bouton.style.backgroundColor = "#4CAF50"; // Vert
        setTimeout(() => {
            appState.motActuelIndex++;
            lancerExerciceSyllabes();
        }, 800);
    } else {
        bouton.style.backgroundColor = "#f44336"; // Rouge
        // Petit TTS d'aide
        const utt = new SpeechSynthesisUtterance("Réessaie"); utt.lang='fr-FR'; utt.rate=1.2;
        window.speechSynthesis.speak(utt);
    }
}

function versetSuivant() {
    const nbVersets = Object.keys(bibleData[appState.livre][appState.chapitre]).length;
    if (appState.verset < nbVersets) {
        chargerLecture(appState.livre, appState.chapitre, appState.verset + 1);
    } else {
        retourAuxChapitres(); // Fin du chapitre
    }
}
