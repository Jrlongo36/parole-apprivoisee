let bible = null;
let currentEleve = null;
let state = { stars: 0, livre: "Genèse", chap: "1", ver: "1", words: [] };
let isPlaying = false;

// === DÉBLOCAGE AUDIO MOBILE ===
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis.speak(u);
    audioUnlocked = true;
}
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

// === CHARGEMENT DE LA BIBLE ===
window.onload = async () => {
    try {
        const res = await fetch('./segond_1910.json');
        const rawData = await res.json();
        bible = {};
        rawData.verses.forEach(v => {
            if (!bible[v.book_name]) bible[v.book_name] = {};
            if (!bible[v.book_name][v.chapter]) bible[v.book_name][v.chapter] = {};
            bible[v.book_name][v.chapter][v.verse] = v.text;
        });
        renderEleves();
    } catch (e) {
        console.error("Erreur de chargement", e);
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
        const btn = document.createElement('button');
        btn.className = "btn-main";
        btn.style.marginBottom = "10px";
        btn.innerText = `👤 ${p.nom} (⭐ ${p.stars})`;
        btn.onclick = () => {
            currentEleve = p;
            state.stars = p.stars;
            state.livre = p.livre || "Genèse";
            state.chap = p.chap || "1";
            state.ver = p.ver || "1";
            updateUI();
            loadVerset(state.livre, state.chap, state.ver);
        };
        div.appendChild(btn);
    });
}

function loadVerset(l, c, v) {
    if (!bible || !bible[l] || !bible[l][c] || !bible[l][c][v]) return;
    const text = bible[l][c][v];
    state.words = text.split(/\s+/);
    
    // Mettre à jour l'UI avec le texte
    const refEl = document.getElementById('ref-verset');
    if(refEl) refEl.innerText = `${l} ${c}:${v}`;
    
    const txtEl = document.getElementById('texte-verset');
    if(txtEl) {
        txtEl.innerHTML = ''; 
        state.words.forEach((mot, i) => {
            const motSpan = document.createElement('span');
            motSpan.style.display = "inline-block";
            motSpan.style.marginRight = "5px";
            motSpan.innerText = mot;
            txtEl.appendChild(motSpan);
        });
    }
    
    openScreen('screen-lecture');
}

// === CŒUR DE L'APPRENTISSAGE (LECTURE -> SYLLABES -> JEU) ===
async function passerAuQuiz() {
    if (isPlaying) return;
    isPlaying = true;

    const texteVerset = document.getElementById('texte-verset');
    const texteComplet = state.words.join(' ');

    // 1. LECTURE NORMALE DU VERSET
    await lireTexte(texteComplet, 0.9);
    await pause(600); // Petite pause respiration

    if (!isPlaying) return;

    // 2. PRÉPARATION DU DOM POUR LES SYLLABES
    texteVerset.innerHTML = '';
    let toutesLesSyllabes = [];

    state.words.forEach((mot) => {
        // Séparer la ponctuation du mot
        const cleanMatch = mot.match(/[a-zA-Zâäàéèêëîïôöùûüç]+/);
        const motSpan = document.createElement('span');
        motSpan.style.display = "inline-block";
        motSpan.style.marginRight = "5px";

        if (cleanMatch) {
            const cleanWord = cleanMatch[0];
            const prefix = mot.substring(0, cleanMatch.index);
            const suffix = mot.substring(cleanMatch.index + cleanWord.length);
            
            if (prefix) motSpan.appendChild(document.createTextNode(prefix));

            // Découpage et emballage des syllabes
            const syllabes = couperEnSyllabes(cleanWord);
            syllabes.forEach(syl => {
                const sylSpan = document.createElement('span');
                sylSpan.innerText = syl;
                sylSpan.style.transition = "background-color 0.2s";
                sylSpan.style.padding = "1px 2px";
                sylSpan.style.borderRadius = "4px";
                motSpan.appendChild(sylSpan);
                toutesLesSyllabes.push({ element: sylSpan, text: syl });
            });

            if (suffix) motSpan.appendChild(document.createTextNode(suffix));
        } else {
            motSpan.innerText = mot;
        }
        texteVerset.appendChild(motSpan);
    });

    // 3. SURVEILLANCE ET LECTURE SYLLABE PAR SYLLABE
    for (let i = 0; i < toutesLesSyllabes.length; i++) {
        if (!isPlaying) break; // Si l'utilisateur quitte l'écran
        
        const sylData = toutesLesSyllabes[i];
        
        // Allumer (Surveillance)
        sylData.element.style.backgroundColor = "var(--or, #FFD700)";
        sylData.element.style.color = "#000";
        
        // Lire la syllabe avec la voix
        await lireTexte(sylData.text, 0.7);
        
        // Petite pause
        await pause(100);
        
        // Éteindre
        sylData.element.style.backgroundColor = "transparent";
        sylData.element.style.color = "";
    }

    if (!isPlaying) return;

    // 4. TRANSITION VERS LE JEU AUTOMATIQUE
    demarrerJeuSyllabes();
}

// Utilitaires de lecture
function lireTexte(texte, rate) {
    return new Promise(resolve => {
        const u = new SpeechSynthesisUtterance(texte);
        u.lang = 'fr-FR';
        u.rate = rate;
        
        // Fallback si la voix plante (bug Safari)
        const timeout = setTimeout(resolve, Math.max(1000, texte.length * 100));
        
        u.onend = () => { clearTimeout(timeout); resolve(); };
        u.onerror = () => { clearTimeout(timeout); resolve(); };
        
        window.speechSynthesis.speak(u);
    });
}

function pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

// === LOGIQUE DU JEU QUIZ ===
function demarrerJeuSyllabes() {
    const motsValides = state.words.filter(w => w.replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '').length > 4);
    const motBrut = motsValides.length > 0 ? motsValides[Math.floor(Math.random() * motsValides.length)] : state.words[0];
    const mot = motBrut.replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '');
    
    const syllabes = couperEnSyllabes(mot);
    const bonneSyllabe = syllabes[0];
    
    const motTarget = document.getElementById('mot-target');
    if(motTarget) motTarget.innerText = `...${mot.substring(bonneSyllabe.length)}`;
    
    const faussesSyllabes = ["par", "les", "ma", "ti", "bou", "cha", "ton", "vi", "lu", "re"];
    let choices = [bonneSyllabe];
    while (choices.length < 3) {
        let f = faussesSyllabes[Math.floor(Math.random() * faussesSyllabes.length)];
        if (!choices.includes(f)) choices.push(f);
    }
    choices.sort(() => Math.random() - 0.5);

    const div = document.getElementById('syllabes-choices');
    if(div) {
        div.innerHTML = '';
        choices.forEach(s => {
            const b = document.createElement('button');
            b.className = "btn-syl"; 
            b.innerText = s;
            b.onclick = () => { 
                if(s === bonneSyllabe) { 
                    b.classList.add('correct'); 
                    state.stars += 20; 
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Bravo !"));
                    setTimeout(finish, 1000);
                } else {
                    b.style.backgroundColor = "var(--rouge, red)";
                    b.style.color = "white";
                    window.speechSynthesis.speak(new SpeechSynthesisUtterance("Essaie encore"));
                }
            };
            div.appendChild(b);
        });
    }
    openScreen('screen-quiz');
}

function finish() {
    save(); 
    updateUI(); 
    prochainVerset(); 
}

function prochainVerset() {
    const vInt = parseInt(state.ver) + 1;
    state.ver = vInt.toString();
    currentEleve.ver = state.ver;
    loadVerset(state.livre, state.chap, state.ver);
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
}
