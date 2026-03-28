let bible = null;
let currentEleve = null;
let state = { stars: 0, motIdx: 0, words: [] };

window.onload = async () => {
    const res = await fetch('segond_1910.json');
    bible = await res.json();
    renderEleves();
};

function openScreen(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function creerEleve() {
    const nom = prompt("Prénom de l'élève :");
    if (!nom) return;
    const data = { nom, stars: 0, livre: "Genèse", chap: 1, ver: 1 };
    localStorage.setItem(`p_` + nom, JSON.stringify(data));
    renderEleves();
}

function renderEleves() {
    const div = document.getElementById('liste-eleves');
    div.innerHTML = '';
    Object.keys(localStorage).filter(k => k.startsWith('p_')).forEach(k => {
        const p = JSON.parse(localStorage.getItem(k));
        const b = document.createElement('button');
        b.className = "btn-main"; b.style.marginBottom = "10px";
        b.innerHTML = `👤 ${p.nom} (⭐ ${p.stars})`;
        b.onclick = () => { currentEleve = p; resumeSession(); };
        div.appendChild(b);
    });
}

function resumeSession() {
    state.stars = currentEleve.stars;
    updateUI();
    renderLivres();
    openScreen('scr-livres');
}

function renderLivres() {
    const div = document.getElementById('list-livres');
    div.innerHTML = '';
    Object.keys(bible).forEach(l => {
        const b = document.createElement('button');
        b.className = "btn-syl"; b.innerText = l;
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
        b.onclick = () => loadVerset(l, i, 1);
        div.appendChild(b);
    }
    openScreen('scr-chapitres');
}

function loadVerset(l, c, v) {
    currentEleve.livre = l; currentEleve.chap = c; currentEleve.ver = v;
    save();
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
    document.getElementById(`step-${n}`).classList.remove('hidden');
}

function lireVerset() {
    window.speechSynthesis.cancel();
    const txt = bible[currentEleve.livre][currentEleve.chap][currentEleve.ver];
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = 'fr-FR'; u.rate = 0.7;
    
    u.onboundary = (e) => {
        if(e.name === 'word') {
            document.querySelectorAll('.verset-box span').forEach(s => s.classList.remove('highlight'));
            const idx = state.words.findIndex(w => txt.substring(e.charIndex).startsWith(w));
            if(document.getElementById(`w-${idx}`)) document.getElementById(`w-${idx}`).classList.add('highlight');
        }
    };
    u.onend = () => prepareJeu();
    window.speechSynthesis.speak(u);
}

function prepareJeu() {
    const mot = state.words.find(w => w.length > 5).replace(/[.,]/g, "");
    showStep(2);
    document.getElementById('word-hint').innerText = `_ _ _ ${mot.substring(3)}`;
    const syl = mot.substring(0,3);
    const choices = [syl, "par", "mon"].sort(() => Math.random() - 0.5);
    const div = document.getElementById('syllabes-choices');
    div.innerHTML = '';
    choices.forEach(s => {
        const b = document.createElement('button');
        b.className = "btn-syl"; b.innerText = s;
        b.onclick = () => { if(s === syl) { b.classList.add('correct'); state.stars += 20; finish(); } };
        div.appendChild(b);
    });
}

function finish() { save(); updateUI(); showStep(3); }

function prochainVerset() {
    loadVerset(currentEleve.livre, currentEleve.chap, currentEleve.ver + 1);
}

function save() {
    currentEleve.stars = state.stars;
    localStorage.setItem(`p_` + currentEleve.nom, JSON.stringify(currentEleve));
}

function updateUI() {
    document.getElementById('user-name').innerText = currentEleve ? currentEleve.nom : "Invité";
    document.getElementById('star-count').innerText = `⭐ ${state.stars}`;
    if(currentEleve) {
        const total = Object.keys(bible[currentEleve.livre][currentEleve.chap]).length;
        document.getElementById('progress-bar-inner').style.width = (currentEleve.ver/total*100) + "%";
    }
}
