let bible = null;
let currentEleve = null;
let state = { stars: 0, motIdx: 0, words: [] };
let isPlaying = false; // Sécurité pour empêcher les clics multiples

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

// === CHARGEMENT DE LA BIBLE ===
window.onload = async () => {
    console.log("Tentative de chargement de la Bible...");
    try {
        const res = await fetch('./segond_1910.json'); 
        if (!res.ok) throw new Error("Fichier JSON introuvable");
        const rawData = await res.json();
        
        bible = {};
        rawData.verses.forEach(v => {
            if (!bible[v.book_name]) bible[v.book_name] = {};
            if (!bible[v.book_name][v.chapter]) bible[v.book_name][v.chapter] = {};
            bible[v.book_name][v.chapter][v.verse] = v.text;
        });

        console.log("Bible chargée avec succès !");
        renderEleves();
    } catch (e) {
        console.error("ERREUR :", e.message);
        alert("Erreur de chargement. Vérifie la connexion ou le fichier JSON.");
    }
};

function openScreen(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    
    window.speechSynthesis.cancel();
    isPlaying = false;
}

function creerEleve() {
    const nom = prompt("Prénom de l'élève :");
    if (!nom) return;
    const data = { nom, stars: 0, livre: "Genèse", chap: "1", ver: "1" };
    localStorage.setItem('p_' + nom, JSON.stringify(data));
    renderEleves();
}

function renderEleves() {
    const div = document.getElementById('liste-eleves');
    if(!div) return;
    div.innerHTML = '';
    Object.keys(localStorage).filter(k => k.startsWith('p_')).forEach(k => {
        const p = JSON.parse(localStorage.getItem(k));
        const b = document.createElement('button');
        b.className = "btn-main"; 
        b.style.marginBottom = "10px";
        b.innerHTML = `👤 ${p.nom} (⭐ ${p.stars})`;
        b.onclick = () => { 
            currentEleve = p; 
            resumeSession(); 
        };
        div.appendChild(b);
    });
}

function resumeSession() {
    state.stars = currentEleve.stars || 0;
    updateUI();
    renderLivres();
    openScreen('scr-livres');
}

function renderLivres() {
    const div = document.getElementById('list-livres');
    if(!div || !bible) return;
    div.innerHTML = '';
    Object.keys(bible).forEach(l => {
        const b = document.createElement('button');
        b.className = "btn-syl"; 
        b.innerText = l;
        b.onclick = () => showChap(l);
        div.appendChild(b);
    });
}

function showChap(l) {
    currentEleve.livre = l;
    const titreEl = document.getElementById('titre-livre');
    if(titreEl) titreEl.innerText = l;
    
    const div = document.getElementById('list-chapitres');
    if(!div) return;
    div.innerHTML = '';
    const total = Object.keys(bible[l]).length;
    for(let i=1; i<=total; i++) {
        const b = document.createElement('button');
        b.className = "btn-syl"; b.innerText = i;
        b.onclick = () => loadVerset(l, i.toString(), "1");
        div.appendChild(b);
    }
    openScreen('scr-chapitres');
}

function loadVerset(l, c, v) {
    currentEleve.livre = l; currentEleve.chap = c; currentEleve.ver = v;
    save();
    
    if(!bible[l] || !bible[l][c] || !bible[l][c][v]) { 
        alert("Verset introuvable"); 
        return; 
    }
    
    const txt = bible[l][c][v];
    state.words = txt.split(' ');
    
    const textDisplay = document.getElementById('text-display');
    if(textDisplay) {
        textDisplay.innerHTML = state.words.map((w,i) => `<span id="w-${i}">${w}</span>`).join(' ');
    }
    
    const refLabel = document.getElementById('ref-label');
    if(refLabel) refLabel.innerText = `${l} ${c}:${v}`;
    
    updateUI();
    openScreen('scr-lecture');
    showStep(1);
}

function showStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
    const stepEl = document.getElementById(`step-${n}`);
    if (stepEl) stepEl.classList.remove('hidden');
}

// === UTILITAIRES AUDIO (Promesses) ===
function lireTexte(texte, rate) {
    return new Promise(resolve => {
        const u = new SpeechSynthesisUtterance(texte);
        u.lang = 'fr-FR';
        u.rate = rate;
        
        let isResolved = false;
        const timeout = setTimeout(() => {
            if (!isResolved) { isResolved = true; resolve(); }
        }, Math.max(2000, texte.length * 150));
        
        u.onend = () => { if(!isResolved){ isResolved=true; clearTimeout(timeout); resolve(); } };
        u.onerror = () => { if(!isResolved){ isResolved=true; clearTimeout(timeout); resolve(); } };
        
        window.speechSynthesis.speak(u);
    });
}

function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// === LA FONCTION DE LECTURE (Connectée à votre bouton) ===
async function lireVerset() {
    if (isPlaying) return;
    isPlaying = true;
    window.speechSynthesis.cancel(); // Couper tout audio précédent

    const txt = bible[currentEleve.livre][currentEleve.chap][currentEleve.ver];
    
    // 1. LECTURE NORMALE DU VERSET
    await lireTexte(txt, 0.85);
    await pause(600);

    if (!isPlaying) return;

    // 2. PRÉPARATION DES SYLLABES DANS L'INTERFACE D'ORIGINE
    const textDisplay = document.getElementById('text-display');
    if(!textDisplay) return;
    
    textDisplay.innerHTML = '';
    let syllabesAudio = [];

    state.words.forEach((mot, motIndex) => {
        const motSpan = document.createElement('span');
        motSpan.id = `w-${motIndex}`;
        motSpan.style.display = "inline-block";
        motSpan.style.marginRight = "5px";

        const cleanMatch = mot.match(/[a-zA-Zâäàéèêëîïôöùûüç]+/);
        if (cleanMatch) {
            const cleanWord = cleanMatch[0];
            const prefix = mot.substring(0, cleanMatch.index);
            const suffix = mot.substring(cleanMatch.index + cleanWord.length);
            
            if (prefix) motSpan.appendChild(document.createTextNode(prefix));

            const syllabes = couperEnSyllabes(cleanWord);
            syllabes.forEach(syl => {
                const sylSpan = document.createElement('span');
                sylSpan.innerText = syl;
                sylSpan.style.transition = "background-color 0.2s, color 0.2s";
                sylSpan.style.borderRadius = "3px";
                sylSpan.style.padding = "0 1px";
                motSpan.appendChild(sylSpan);
                syllabesAudio.push({ element: sylSpan, text: syl });
            });

            if (suffix) motSpan.appendChild(document.createTextNode(suffix));
        } else {
            motSpan.innerText = mot;
        }
        textDisplay.appendChild(motSpan);
    });

    // 3. LECTURE SYLLABE PAR SYLLABE AVEC ILLUMINATION OR
    for (let i = 0; i < syllabesAudio.length; i++) {
        if (!isPlaying) break;
        const sylData = syllabesAudio[i];
        
        // Allumer
        sylData.element.style.backgroundColor = "var(--or, #FFD700)";
        sylData.element.style.color = "#000";
        
        await lireTexte(sylData.text, 0.7); // Vitesse plus lente
        await pause(150); // Petite pause pour que l'enfant répète
        
        // Éteindre
        sylData.element.style.backgroundColor = "transparent";
        sylData.element.style.color = "";
    }

    if (!isPlaying) return;

    // 4. LANCER LE JEU AUTOMATIQUEMENT
    isPlaying = false;
    prepareJeu();
}

// === ALGORITHME DE DÉCOUPE SYLLABIQUE ===
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

// === LOGIQUE DU JEU ===
function prepareJeu() {
    const motsValides = state.words.filter(w => w.replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '').length > 4);
    const motBrut = motsValides.length > 0 ? motsValides[Math.floor(Math.random() * motsValides.length)] : state.words[0];
    const mot = motBrut.replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '');
    
    showStep(2); // Afficher la vue du jeu
    
    const syllabes = couperEnSyllabes(mot);
    const syl = syllabes[0]; 
    
    const wordHint = document.getElementById('word-hint');
    if(wordHint) wordHint.innerText = `...${mot.substring(syl.length)}`;
    
    const faussesSyllabes = ["par", "les", "ma", "ti", "bou", "cha", "ton", "vi", "lu", "re"];
    let choices = [syl];
    
    while (choices.length < 3) {
        let f = faussesSyllabes[Math.floor(Math.random() * faussesSyllabes.length)];
        if (!choices.includes(f)) choices.push(f);
    }
    choices.sort(() => Math.random() - 0.5);

    const div = document.getElementById('syllabes-choices');
    if(!div) return;
    
    div.innerHTML = '';
    choices.forEach(s => {
        const b = document.createElement('button');
        b.className = "btn-syl"; b.innerText = s;
        b.onclick = () => { 
            if(s === syl) { 
                b.classList.add('correct'); 
                state.stars += 20; 
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Bravo !"));
                setTimeout(finish, 1000);
            } else {
                b.style.backgroundColor = "red";
                b.style.color = "white";
                window.speechSynthesis.speak(new SpeechSynthesisUtterance("Essaie encore"));
            }
        };
        div.appendChild(b);
    });
}

function finish() { save(); updateUI(); showStep(3); }

function prochainVerset() {
    const vInt = parseInt(currentEleve.ver) + 1;
    loadVerset(currentEleve.livre, currentEleve.chap, vInt.toString());
}

function save() {
    currentEleve.stars = state.stars;
    localStorage.setItem('p_' + currentEleve.nom, JSON.stringify(currentEleve));
}

function updateUI() {
    const uName = document.getElementById('user-name');
    if(uName) uName.innerText = currentEleve ? currentEleve.nom : "Invité";
    
    const sCount = document.getElementById('star-count');
    if(sCount) sCount.innerText = `⭐ ${state.stars}`;
    
    if(currentEleve && bible && bible[currentEleve.livre] && bible[currentEleve.livre][currentEleve.chap]) {
        const total = Object.keys(bible[currentEleve.livre][currentEleve.chap]).length;
        const progress = (parseInt(currentEleve.ver) / total * 100);
        const pBar = document.getElementById('progress-bar-inner');
        if(pBar) pBar.style.width = progress + "%";
    }
}
