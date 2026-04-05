let bible = null;
let currentEleve = null;
let state = { stars: 0, motIdx: 0, words: [] };

// === DÉBLOCAGE AUDIO MOBILE ===
// Nécessaire pour que Safari/Chrome sur téléphone autorise la synthèse vocale
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

// CHARGEMENT
window.onload = async () => {
    console.log("Tentative de chargement de la Bible...");
    try {
        const res = await fetch('./segond_1910.json'); // Chemin relatif strict
        if (!res.ok) throw new Error("Fichier JSON introuvable");
        const rawData = await res.json();
        
        // FORMATAGE DU JSON : Transformer le tableau de la Bible en objet hiérarchique {Livre: {Chapitre: {Verset: Texte}}}
        // Cela répare le bug d'affichage de la liste des livres et chapitres
        bible = {};
        rawData.verses.forEach(v => {
            if (!bible[v.book_name]) bible[v.book_name] = {};
            if (!bible[v.book_name][v.chapter]) bible[v.book_name][v.chapter] = {};
            bible[v.book_name][v.chapter][v.verse] = v.text;
        });

        console.log("Bible chargée et formatée avec succès !");
        renderEleves();
    } catch (e) {
        console.error("ERREUR :", e.message);
        alert("La Bible n'a pas pu être chargée. Vérifie que le fichier segond_1910.json est bien à côté de index.html");
    }
};

function openScreen(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
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
            console.log("Session chargée pour :", p.nom);
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
    document.getElementById('titre-livre').innerText = l;
    const div = document.getElementById('list-chapitres');
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
    
    // Vérification de sécurité
    if(!bible[l] || !bible[l][c] || !bible[l][c][v]) { 
        alert("Verset ou chapitre introuvable"); 
        return; 
    }
    
    const txt = bible[l][c][v];
    
    state.words = txt.split(' ');
    document.getElementById('text-display').innerHTML = state.words.map((w,i) => `<span id="w-${i}">${w}</span>`).join(' ');
    document.getElementById('ref-label').innerText = `${l} ${c}:${v}`;
    updateUI();
    openScreen('scr-lecture');
    showStep(1);
}

function showStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
    const stepEl = document.getElementById(`step-${n}`);
    if (stepEl) stepEl.classList.remove('hidden');
}

function lireVerset() {
    window.speechSynthesis.cancel();
    const txt = bible[currentEleve.livre][currentEleve.chap][currentEleve.ver];
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'fr-FR'; 
    u.rate = 0.8;
    
    u.onboundary = (e) => {
        if(e.name === 'word') {
            document.querySelectorAll('.verset-box span').forEach(s => s.classList.remove('highlight'));
            
            // Correction du ciblage du mot pour l'illumination
            let passedChars = 0;
            for(let i=0; i<state.words.length; i++) {
                if(passedChars <= e.charIndex && e.charIndex <= passedChars + state.words[i].length) {
                    const target = document.getElementById(`w-${i}`);
                    if(target) target.classList.add('highlight');
                    break;
                }
                passedChars += state.words[i].length + 1; // +1 pour l'espace
            }
        }
    };
    u.onend = () => prepareJeu();
    window.speechSynthesis.speak(u);
}

// === ALGORITHME DE DÉCOUPE SYLLABIQUE RÉEL ===
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

function prepareJeu() {
    // Sélectionner un mot pertinent du texte pour l'exercice
    const motsValides = state.words.filter(w => w.replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '').length > 4);
    const motBrut = motsValides.length > 0 ? motsValides[Math.floor(Math.random() * motsValides.length)] : state.words[0];
    const mot = motBrut.replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '');
    
    showStep(2);
    
    const syllabes = couperEnSyllabes(mot);
    const syl = syllabes[0]; // La vraie première syllabe française
    
    document.getElementById('word-hint').innerText = `...${mot.substring(syl.length)}`;
    
    const faussesSyllabes = ["par", "les", "ma", "ti", "bou", "cha", "ton", "vi", "lu", "re"];
    let choices = [syl];
    
    while (choices.length < 3) {
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
            if(s === syl) { 
                b.classList.add('correct'); 
                state.stars += 20; 
                
                // Félicitations vocales
                const winMsg = new SpeechSynthesisUtterance("Bravo !");
                winMsg.lang = "fr-FR";
                window.speechSynthesis.speak(winMsg);
                
                setTimeout(finish, 1000);
            } else {
                b.style.backgroundColor = "red";
                b.style.color = "white";
                
                const errMsg = new SpeechSynthesisUtterance("Essaie encore");
                errMsg.lang = "fr-FR";
                window.speechSynthesis.speak(errMsg);
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
    document.getElementById('user-name').innerText = currentEleve ? currentEleve.nom : "Invité";
    document.getElementById('star-count').innerText = `⭐ ${state.stars}`;
    
    // Remplissage sécurisé de la barre de progression
    if(currentEleve && bible && bible[currentEleve.livre] && bible[currentEleve.livre][currentEleve.chap]) {
        const total = Object.keys(bible[currentEleve.livre][currentEleve.chap]).length;
        const progress = (parseInt(currentEleve.ver) / total * 100);
        document.getElementById('progress-bar-inner').style.width = progress + "%";
    }
}
