let bible = null;
let currentEleve = null;
let state = { stars: 0, livre: "Genèse", chap: "1", ver: "1", words: [] };
let isPlaying = false;

// === 1. DÉBLOCAGE AUDIO POUR TÉLÉPHONE ===
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

// === 2. CHARGEMENT SÉCURISÉ AU DÉMARRAGE ===
window.onload = async () => {
    try {
        // 1. On force l'affichage de l'accueil immédiatement
        afficherEcran('accueil'); 
        
        console.log("Tentative de chargement de la Bible...");
        const res = await fetch('./segond_1910.json'); 
        if (!res.ok) throw new Error("Fichier JSON introuvable (Erreur " + res.status + ")");
        
        const rawData = await res.json();
        
        // Formatage de la Bible
        bible = {};
        rawData.verses.forEach(v => {
            if (!bible[v.book_name]) bible[v.book_name] = {};
            if (!bible[v.book_name][v.chapter]) bible[v.book_name][v.chapter] = {};
            bible[v.book_name][v.chapter][v.verse] = v.text;
        });

        console.log("Bible chargée avec succès !");
        
        // On nettoie et charge les anciens élèves
        renderEleves();
        
    } catch (e) {
        console.error("CRASH DÉMARRAGE :", e.message);
        // Au lieu d'une page blanche, on affiche l'erreur à l'écran !
        document.body.innerHTML = `
            <div style="padding: 50px; text-align: center; font-family: sans-serif;">
                <h1 style="color: red;">⚠️ Oups !</h1>
                <p>L'application n'arrive pas à charger la Bible.</p>
                <p style="color: #666; margin-top: 10px;">Détail : ${e.message}</p>
                <button onclick="localStorage.clear(); window.location.reload(true);" style="margin-top: 20px; padding: 10px 20px; background: #534AB7; color: white; border: none; border-radius: 10px; cursor: pointer;">
                    Réparer et Recharger
                </button>
            </div>
        `;
    }
};

// === 3. GESTION DES ÉCRANS ET UTILISATEURS ===
function afficherEcran(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
    window.speechSynthesis.cancel();
    isPlaying = false;
}

function creerProfil(type) {
    const titre = type === 'enfant' ? "Prénom de l'enfant :" : "Prénom du lecteur :";
    const nom = prompt(titre);
    
    if (!nom) return; 
    
    const data = { nom: nom, type: type, stars: 0, livre: "Genèse", chap: "1", ver: "1" };
    localStorage.setItem('p_' + nom, JSON.stringify(data));
    
    renderEleves();
}

function renderEleves() {
    const div = document.getElementById('liste-eleves');
    if(!div) return;
    div.innerHTML = '';
    
    Object.keys(localStorage).filter(k => k.startsWith('p_')).forEach(k => {
        try {
            const p = JSON.parse(localStorage.getItem(k));
            const btn = document.createElement('button');
            btn.className = "btn-main"; 
            
            if (p.type === 'adulte') {
                btn.innerHTML = `👩🏾👨🏽 ${p.nom}`;
                btn.style.backgroundColor = "var(--violet-dark)";
            } else {
                btn.innerHTML = `👧🏽👦🏾 ${p.nom} (⭐ ${p.stars || 0})`;
                btn.style.backgroundColor = "var(--vert)";
            }

            btn.onclick = () => { 
                currentEleve = p; 
                resumeSession(); 
            };
            div.appendChild(btn);
        } catch(e) {
            // Si une ancienne sauvegarde est corrompue, on l'efface au lieu de faire planter l'app
            localStorage.removeItem(k);
        }
    });
}

function resumeSession() {
    state.stars = currentEleve.stars || 0;
    updateUI();
    renderLivres();
    afficherEcran('scr-livres');
}

function renderLivres() {
    const div = document.getElementById('list-livres');
    if(!div || !bible) return;
    div.innerHTML = '';
    Object.keys(bible).slice(0, 5).forEach(l => { 
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
    for(let i=1; i<=Math.min(total, 20); i++) {
        const b = document.createElement('button');
        b.className = "btn-syl"; b.innerText = i;
        b.onclick = () => loadVerset(l, i.toString(), "1");
        div.appendChild(b);
    }
    afficherEcran('scr-chapitres');
}

function loadVerset(l, c, v) {
    currentEleve.livre = l; currentEleve.chap = c; currentEleve.ver = v;
    save();
    
    if(!bible[l] || !bible[l][c] || !bible[l][c][v]) return; 
    
    const txt = bible[l][c][v];
    state.words = txt.split(' ');
    
    document.getElementById('text-display').innerText = txt;
    document.getElementById('ref-label').innerText = `${l} ${c}:${v}`;
    
    const btnLire = document.getElementById('btn-lire');
    if(btnLire) {
        btnLire.disabled = false;
        btnLire.innerText = "▶️ Écouter et Apprendre";
    }
    
    updateUI();
    afficherEcran('scr-lecture');
}

// === 4. LE MOTEUR VOCAL ET KARAOKÉ ===
function direTexte(texte, rate) {
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

function pause(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function lireVersetEtSyllabes() {
    if (isPlaying) return;
    isPlaying = true;
    window.speechSynthesis.cancel();
    
    const btn = document.getElementById('btn-lire');
    if(btn) {
        btn.disabled = true;
        btn.innerText = "⏳ Lecture en cours...";
    }

    const texteComplet = bible[currentEleve.livre][currentEleve.chap][currentEleve.ver];
    
    await direTexte(texteComplet, 0.85);
    await pause(600);

    if (!isPlaying) return;

    const textDisplay = document.getElementById('text-display');
    textDisplay.innerHTML = '';
    let elementsSyllabes = [];

    state.words.forEach(mot => {
        const spanMot = document.createElement('span');
        spanMot.style.marginRight = "6px";
        spanMot.style.display = "inline-block";

        const lettres = mot.match(/[a-zA-Zâäàéèêëîïôöùûüç]+/);
        if (lettres) {
            const motPropre = lettres[0];
            const debut = mot.substring(0, lettres.index);
            const fin = mot.substring(lettres.index + motPropre.length);
            
            if(debut) spanMot.appendChild(document.createTextNode(debut));

            const syllabes = couperEnSyllabes(motPropre);
            syllabes.forEach(syl => {
                const spanSyl = document.createElement('span');
                spanSyl.innerText = syl;
                spanSyl.style.transition = "background-color 0.2s, color 0.2s";
                spanSyl.style.padding = "2px";
                spanSyl.style.borderRadius = "4px";
                spanMot.appendChild(spanSyl);
                elementsSyllabes.push({ span: spanSyl, text: syl });
            });

            if(fin) spanMot.appendChild(document.createTextNode(fin));
        } else {
            spanMot.innerText = mot;
        }
        textDisplay.appendChild(spanMot);
    });

    for (let i = 0; i < elementsSyllabes.length; i++) {
        if (!isPlaying) break;
        const data = elementsSyllabes[i];
        
        data.span.style.backgroundColor = "var(--or, #FFD700)";
        data.span.style.color = "black";
        
        await direTexte(data.text, 0.7);
        await pause(100);
        
        data.span.style.backgroundColor = "transparent";
        data.span.style.color = "var(--texte)";
    }

    if (!isPlaying) return;

    isPlaying = false;
    lancerJeu();
}

// === 5. ALGORITHME DE DÉCOUPE ===
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

// === 6. LE JEU FINAL ===
function lancerJeu() {
    const motsValides = state.words.filter(w => w.replace(/[^a-zA-Z]/g, '').length > 4);
    const motBrut = motsValides.length > 0 ? motsValides[Math.floor(Math.random() * motsValides.length)] : state.words[0];
    const mot = motBrut.replace(/[^a-zA-Zâäàéèêëîïôöùûüç]/g, '');
    
    const syllabes = couperEnSyllabes(mot);
    const bonneSyllabe = syllabes[0]; 
    
    document.getElementById('word-hint').innerText = `...${mot.substring(bonneSyllabe.length)}`;
    
    const fausses = ["par", "les", "ma", "ti", "bou", "cha", "ton", "vi", "lu", "re"];
    let choices = [bonneSyllabe];
    while (choices.length < 4) {
        let f = fausses[Math.floor(Math.random() * fausses.length)];
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
                b.classList.add('correct'); 
                state.stars += 20; 
                direTexte("Bravo !", 1);
                setTimeout(() => {
                    save(); updateUI(); prochainVerset();
                }, 1000);
            } else {
                b.style.backgroundColor = "red"; b.style.color = "white";
                direTexte("Essaie encore", 1);
            }
        };
        div.appendChild(b);
    });
    
    afficherEcran('scr-quiz');
}

function prochainVerset() {
    const nv = parseInt(currentEleve.ver) + 1;
    loadVerset(currentEleve.livre, currentEleve.chap, nv.toString());
}

function save() {
    currentEleve.stars = state.stars;
    localStorage.setItem('p_' + currentEleve.nom, JSON.stringify(currentEleve));
}

function updateUI() {
    document.getElementById('user-name').innerText = currentEleve ? currentEleve.nom : "Invité";
    document.getElementById('star-count').innerText = `⭐ ${state.stars}`;
}
