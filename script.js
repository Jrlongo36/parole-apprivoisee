let bible = null;
let currentEleve = null;
let state = { stars: 0, motIdx: 0, words: [] };

// CHARGEMENT
window.onload = async () => {
    console.log("Tentative de chargement de la Bible...");
    try {
        const res = await fetch('./segond_1910.json'); // Chemin relatif strict
        if (!res.ok) throw new Error("Fichier JSON introuvable");
        bible = await res.json();
        console.log("Bible chargée avec succès !");
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
    const txt = bible[l][c][v];
    if(!txt) { alert("Verset non trouvé"); return; }
    
    state.words = txt.split(' ');
    document.getElementById('text-display').innerHTML = state.words.map((w,i) => `<span id="w-${i}">${w}</span>`).join(' ');
    document.getElementById('ref-label').innerText = `${l} ${c}:${v}`;
    updateUI();
    openScreen('scr-lecture');
    showStep(1);
}

function showStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`step-${n}`).classList.remove('hidden');
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
            const idx = state.words.findIndex(w => txt.substring(e.charIndex).startsWith(w));
            const target = document.getElementById(`w-${idx}`);
            if(target) target.classList.add('highlight');
        }
    };
    u.onend = () => prepareJeu();
    window.speechSynthesis.speak(u);
}

function prepareJeu() {
    const longWords = state.words.filter(w => w.length > 5);
    const motBrut = longWords.length > 0 ? longWords[0] : state.words[0];
    const mot = motBrut.replace(/[.,!?;]/g, "");
    
    showStep(2);
    document.getElementById('word-hint').innerText = `...${mot.substring(3)}`;
    const syl = mot.substring(0,3);
    const choices = [syl, "par", "les"].sort(() => Math.random() - 0.5);
    const div = document.getElementById('syllabes-choices');
    div.innerHTML = '';
    choices.forEach(s => {
        const b = document.createElement('button');
        b.className = "btn-syl"; b.innerText = s;
        b.onclick = () => { 
            if(s === syl) { 
                b.classList.add('correct'); 
                state.stars += 20; 
                setTimeout(finish, 600);
            } else {
                b.style.backgroundColor = "red";
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
    if(currentEleve && bible) {
        const total = Object.keys(bible[currentEleve.livre][currentEleve.chap]).length;
        const progress = (parseInt(currentEleve.ver) / total * 100);
        document.getElementById('progress-bar-inner').style.width = progress + "%";
    }
}
