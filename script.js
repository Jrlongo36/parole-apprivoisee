let bible = null;
let currentEleve = null;
let state = { stars: 0, livre: 1, chap: 1, ver: 1, text: "", wordsData: [] };
let currentUtterance = null; // Pour pouvoir stopper la lecture

// === DÉBLOCAGE AUDIO MOBILE ===
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    audioUnlocked = true;
}
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

// === ALGORITHME DE SYLLABES (Inchangé) ===
function couperEnSyllabes(mot) {
    mot = mot.toLowerCase().replace(/[^a-zâäàéèêëîïôöùûüç-]/g, '');
    if (mot.length <= 3) return [mot];
    const voyelles = 'aâäàéèêëîïôöùûüçy';
    let syllabes = [];
    let syllabeActuelle = '';
    for (let i = 0; i < mot.length; i++) {
        syllabeActuelle += mot[i];
        if (voyelles.includes(mot[i])) {
            let reste = mot.substring(i + 1);
            if (reste.length > 0 && !voyelles.includes(reste[0])) {
                syllabes.push(syllabeActuelle);
                syllabeActuelle = '';
            }
        }
    }
    if (syllabeActuelle !== '') {
        if (syllabes.length > 0) syllabes[syllabes.length - 1] += syllabeActuelle;
        else syllabes.push(syllabeActuelle);
    }
    return syllabes.length > 0 ? syllabes : [mot];
}

// === INITIALISATION DB (Inchangé) ===
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("BibleAppDB", 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("bibleStore")) {
                db.createObjectStore("bibleStore", { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

window.onload = async () => {
    try {
        const db = await initDB();
        const tx = db.transaction("bibleStore", "readonly");
        const req = tx.objectStore("bibleStore").get("segond_1910");
        req.onsuccess = async () => {
            if (req.result) {
                bible = req.result.data;
                renderEleves();
            } else {
                const res = await fetch('./segond_1910.json');
                bible = await res.json();
                const txWrite = db.transaction("bibleStore", "readwrite");
                txWrite.objectStore("bibleStore").put({ id: "segond_1910", data: bible });
                renderEleves();
            }
        };
    } catch (e) { alert("Erreur de chargement."); }
};

// === GESTION INTERFACE ===
function openScreen(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    // Stopper toute lecture en cours quand on change d'écran
    window.speechSynthesis.cancel();
}

function creerEleve() {
    const nom = prompt("Prénom de l'élève :");
    if (!nom) return;
    const data = { nom, stars: 0, livre: 1, chap: 1, ver: 1 };
    localStorage.setItem('p_' + nom, JSON.stringify(data));
    renderEleves();
}

function renderEleves() {
    const div = document.getElementById('liste-eleves');
    div.innerHTML = '';
    Object.keys(localStorage).forEach(key => {
        if(key.startsWith('p_')) {
            const eleve = JSON.parse(localStorage.getItem(key));
            const btn = document.createElement('button');
            btn.className = "btn-main";
            btn.innerText = eleve.nom + ` (⭐ ${eleve.stars})`;
            btn.onclick = () => chargerEleve(eleve);
            div.appendChild(btn);
        }
    });
}

function chargerEleve(eleve) {
    currentEleve = eleve;
    state.stars = eleve.stars;
    state.livre = eleve.livre;
    state.chap = eleve.chap;
    state.ver = eleve.ver;
    updateUI();
    loadVerset(state.livre, state.chap, state.ver);
}

// === NOUVEAU : CHARGEMENT ET PRÉPARATION DU KARAOKÉ COMPLE ===
function loadVerset(livreId, chapId, verId) {
    if (!bible) return;
    const versetData = bible.verses.find(v => v.book === livreId && v.chapter === chapId && v.verse === verId);
    if (!versetData) {
        alert("Fin du livre !");
        openScreen('screen-home');
        return;
    }
    
    state.text = versetData.text;
    state.wordsData = []; // Reset des données de synchronisation
    
    document.getElementById('ref-verset').innerText = `${versetData.book_name} ${chapId}:${verId}`;
    document.getElementById('btn-aller-quiz').classList.add('hidden'); // Cacher le bouton de sortie

    // Préparer l'affichage HTML complexe (chaque mot découpé en syllabes)
    const conteneur = document.getElementById('texte-verset-karaoke');
    conteneur.innerHTML = '';
    
    // Découper le texte en mots bruts (en gardant les espaces et ponctuation pour la lecture)
    const rawWords = state.text.split(/(\s+)/); // Garde les espaces dans le tableau
    let charOffset = 0; // Position du caractère dans la phrase complète

    rawWords.forEach((rawWord, index) => {
        const wordSpan = document.createElement('span');
        
        // Est-ce un vrai mot (lettres) ou de la ponctuation/espace ?
        const cleanWord = rawWord.replace(/[^a-zA-Zâäàéèêëîïôöùûüç']/g, '');
        
        if (cleanWord.length > 0) {
            // C'est un vrai mot -> Appliquer l'algorithme de syllabes
            wordSpan.className = 'k-word';
            wordSpan.id = `w-${state.wordsData.length}`; // ID unique pour la synchro
            
            const syllabes = couperEnSyllabes(cleanWord);
            syllabes.forEach(syl => {
                const sylSpan = document.createElement('span');
                sylSpan.className = 'k-syl';
                sylSpan.innerText = syl;
                wordSpan.appendChild(sylSpan);
            });

            // Stocker les données nécessaires pour synchroniser l'audio
            state.wordsData.push({
                index: state.wordsData.length,
                cleanText: cleanWord,
                rawText: rawWord,
                charOffset: charOffset,
                length: rawWord.length,
                domElement: wordSpan,
                syllabesDom: wordSpan.querySelectorAll('.k-syl')
            });
        } else {
            // C'est de la ponctuation ou un espace -> l'injecter tel quel
            wordSpan.innerText = rawWord;
        }

        conteneur.appendChild(wordSpan);
        charOffset += rawWord.length; // Mettre à jour l'offset
    });

    openScreen('screen-lecture');
}

// === NOUVEAU : INTELLIGENCE VOCALE KARAOKÉ SYLLABIQUE ===
function lireVersetKaraoke() {
    if (!state.text || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Stop si on reclique
        return;
    }

    const btn = document.getElementById('btn-lire-verset');
    const btnQuiz = document.getElementById('btn-aller-quiz');
    
    btn.disabled = true;
    btn.innerText = "⏳ Lecture...";
    btnQuiz.classList.add('hidden');

    currentUtterance = new SpeechSynthesisUtterance(state.text);
    currentUtterance.lang = 'fr-FR';
    currentUtterance.rate = 0.8; // Vitesse légèrement réduite pour mieux suivre

    // NETTOYAGE PRÉALABLE des illuminations
    document.querySelectorAll('.k-syl, .k-word').forEach(el => {
        el.classList.remove('illuminated', 'active-word');
    });

    // --- LE CŒUR DE LA SYNCHRONISATION ---
    // Cet événement se déclenche à chaque mot prononcé par l'IA
    currentUtterance.onboundary = (event) => {
        if (event.name !== 'word') return;

        const charIndex = event.charIndex; // Position du caractère lu par l'IA

        // Trouver le mot correspondant dans nos données préparées
        const wordData = state.wordsData.find(w => charIndex >= w.charOffset && charIndex < (w.charOffset + w.length));
        
        if (wordData) {
            // 1. Allumer le fond du mot (pour montrer le mot global)
            // On éteint le précédent
            const prevWord = document.querySelector('.active-word');
            if(prevWord) prevWord.classList.remove('active-word');
            wordData.domElement.classList.add('active-word');

            // 2. ILLUMINATION SYLLABIQUE SÉQUENTIELLE
            // On estime la durée du mot basé sur sa longueur (approx. 100ms par caractère à vitesse 0.8)
            const estimatedWordDuration = wordData.length * 90; 
            const sylElements = wordData.syllabesDom;
            const timePerSyl = estimatedWordDuration / sylElements.length;

            // Allumer les syllabes l'une après l'autre
            sylElements.forEach((sylEl, i) => {
                setTimeout(() => {
                    // Éteindre la syllabe précédente à l'intérieur de ce mot
                    if(i > 0) sylElements[i-1].classList.remove('illuminated');
                    // Allumer l'actuelle
                    sylEl.classList.add('illuminated');
                }, i * timePerSyl);
            });

            // Éteindre la dernière syllabe du mot après sa durée
            setTimeout(() => {
                sylElements[sylElements.length - 1].classList.remove('illuminated');
            }, estimatedWordDuration);
        }
    };

    currentUtterance.onend = () => {
        btn.disabled = false;
        btn.innerText = "🔄 Réécouter";
        btnQuiz.classList.remove('hidden'); // Débloquer la sortie
        // Nettoyer le dernier mot actif
        const lastWord = document.querySelector('.active-word');
        if(lastWord) lastWord.classList.remove('active-word');
    };

    window.speechSynthesis.speak(currentUtterance);
}

// === LOGIQUE DU JEU (Adaptée) ===
function passerAuQuizFinal() {
    // Choisir un mot du verset pour le quiz
    const vMots = state.wordsData.filter(w => w.cleanText.length > 3);
    if(vMots.length === 0) { prochainVerset(); return; }
    
    const targetData = vMots[Math.floor(Math.random() * vMots.length)];
    const mot = targetData.cleanText;
    const syllabes = couperEnSyllabes(mot);
    const bonneSyllabe = syllabes[0];
    
    document.getElementById('mot-target').innerText = `...${mot.substring(bonneSyllabe.length)}`;
    
    const faussesSyllabes = ["par", "les", "ma", "ti", "bou", "cha", "ton", "vi", "lu", "re"];
    let choices = [bonneSyllabe];
    while (choices.length < 4) {
        let f = faussesSyllabes[Math.floor(Math.random() * faussesSyllabes.length)];
        if (!choices.includes(f)) choices.push(f);
    }
    choices.sort(() => Math.random() - 0.5);
    
    const div = document.getElementById('syllabes-choices');
    div.innerHTML = '';
    choices.forEach(s => {
        const b = document.createElement('button');
        b.className = "btn-syl"; b.innerText = s;
        b.onclick = () => { 
            if(s === bonneSyllabe) { 
                b.classList.add('correct'); state.stars += 20;
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Bravo !"));
                setTimeout(finish, 1000);
            } else {
                b.style.backgroundColor = "var(--rouge)"; b.style.color = "white";
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Essaie encore"));
            }
        };
        div.appendChild(b);
    });
    openScreen('screen-quiz');
}

function finish() { save(); updateUI(); prochainVerset(); }
function prochainVerset() { state.ver++; loadVerset(state.livre, state.chap, state.ver); }
function save() {
    currentEleve.stars = state.stars; currentEleve.ver = state.ver;
    localStorage.setItem('p_' + currentEleve.nom, JSON.stringify(currentEleve));
}
function updateUI() {
    document.getElementById('user-name').innerText = currentEleve ? currentEleve.nom : "Invité";
    document.getElementById('star-count').innerText = `⭐ ${state.stars}`;
    document.getElementById('progress-bar-inner').style.width = (state.ver % 30 * 3.3) + "%";
}
