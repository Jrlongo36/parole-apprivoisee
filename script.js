let bible = null;
let currentEleve = null;
let state = { stars: 0, motIdx: 0, words: [] };

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

// === CHARGEMENT PERFORMANT (INDEXEDDB) ===
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
    console.log("Initialisation de l'application...");
    try {
        const db = await initDB();
        const tx = db.transaction("bibleStore", "readonly");
        const req = tx.objectStore("bibleStore").get("segond_1910");
        
        req.onsuccess = async () => {
            if (req.result) {
                bible = req.result.data;
                console.log("✅ Bible chargée depuis IndexedDB !");
                renderEleves();
            } else {
                console.log("⏳ Téléchargement de la Bible (1ère fois)...");
                const res = await fetch('./segond_1910.json');
                if (!res.ok) throw new Error("Fichier JSON introuvable");
                bible = await res.json();
                
                const txWrite = db.transaction("bibleStore", "readwrite");
                txWrite.objectStore("bibleStore").put({ id: "segond_1910", data: bible });
                console.log("✅ Bible sauvegardée !");
                renderEleves();
            }
        };
    } catch (e) {
        console.error("ERREUR :", e.message);
        alert("La Bible n'a pas pu être chargée. Vérifiez votre connexion.");
    }
};

// === GESTION DE L'INTERFACE ET DES UTILISATEURS ===
function openScreen(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
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
    if(!div) return;
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
    updateUI();
    loadVerset(eleve.livre, eleve.chap, eleve.ver);
}

function loadVerset(livreId, chapId, verId) {
    if (!bible) return;
    
    // Recherche du verset dans le JSON de la Bible Segond 1910
    const versetData = bible.verses.find(v => v.book === livreId && v.chapter === chapId && v.verse === verId);
    
    if (versetData) {
        const texte = versetData.text;
        document.getElementById('ref-verset').innerText = `${versetData.book_name} ${chapId}:${verId}`;
        document.getElementById('texte-verset').innerText = texte;
        state.words = texte.split(/\s+/).filter(w => w.length > 2);
        openScreen('screen-lecture');
    } else {
        alert("Verset introuvable !");
        openScreen('screen-home');
    }
}

function passerAuQuiz() {
    if (state.words.length === 0) return;
    // Sélectionner un mot aléatoire du verset
    const motAleatoire = state.words[Math.floor(Math.random() * state.words.length)].replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '');
    startQuizSyllabe(motAleatoire);
    openScreen('screen-quiz');
}

// === NOUVEL ALGORITHME DE SYLLABES ===
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

// === NOUVEAU QUIZ SYLLABE ===
function startQuizSyllabe(mot) {
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
        b.className = "btn-syl"; 
        b.innerText = s;
        b.onclick = () => { 
            if(s === bonneSyllabe) { 
                b.classList.add('correct'); 
                state.stars += 20;
                
                // Félicitation vocale
                const winMsg = new SpeechSynthesisUtterance("Bravo !");
                winMsg.lang = "fr-FR";
                window.speechSynthesis.speak(winMsg);
                
                setTimeout(finish, 1000);
            } else {
                b.style.backgroundColor = "var(--rouge)";
                b.style.color = "white";
                b.style.borderColor = "var(--rouge)";
                // L'audio dit "Essaie encore" en cas d'erreur
                const errMsg = new SpeechSynthesisUtterance("Essaie encore");
                errMsg.lang = "fr-FR";
                window.speechSynthesis.speak(errMsg);
            }
        };
        div.appendChild(b);
    });
}

function finish() { 
    save(); 
    updateUI(); 
    prochainVerset();
}

function prochainVerset() {
    // Logique simplifiée : avancer au verset suivant
    currentEleve.ver = parseInt(currentEleve.ver) + 1;
    loadVerset(currentEleve.livre, currentEleve.chap, currentEleve.ver);
}

function save() {
    currentEleve.stars = state.stars;
    localStorage.setItem('p_' + currentEleve.nom, JSON.stringify(currentEleve));
}

function updateUI() {
    document.getElementById('user-name').innerText = currentEleve ? currentEleve.nom : "Invité";
    document.getElementById('star-count').innerText = `⭐ ${state.stars}`;
}
