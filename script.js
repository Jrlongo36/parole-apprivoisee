let bible = null;
let currentEleve = null;
let state = { stars: 0, motIdx: 0, words: [] };

window.onload = async () => {
    afficherEcran('accueil'); // Afficher l'accueil au démarrage
    console.log("Tentative de chargement de la Bible...");
    try {
        const res = await fetch('./segond_1910.json');
        if (!res.ok) throw new Error("Fichier JSON introuvable");
        const rawData = await res.json();
        
        // Formatage de la Bible
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
    }
};

function afficherEcran(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');
}

// NOUVELLE FONCTION DE CREATION DE PROFIL
function creerProfil(type) {
    // Demande le prénom en adaptant le texte selon le type
    const titre = type === 'enfant' ? "Prénom de l'enfant :" : "Prénom du lecteur :";
    const nom = prompt(titre);
    
    if (!nom) return; // Si l'utilisateur annule, on arrête
    
    // On enregistre les données, en incluant le type (enfant ou adulte)
    const data = { nom: nom, type: type, stars: 0, livre: "Genèse", chap: "1", ver: "1" };
    localStorage.setItem('p_' + nom, JSON.stringify(data));
    
    renderEleves();
}

// MISE À JOUR DE L'AFFICHAGE DES PROFILS
function renderEleves() {
    const div = document.getElementById('liste-eleves');
    if(!div) return;
    div.innerHTML = '';
    
    Object.keys(localStorage).filter(k => k.startsWith('p_')).forEach(k => {
        const p = JSON.parse(localStorage.getItem(k));
        const btn = document.createElement('button');
        btn.className = "btn-main"; 
        
        // Apparence différente selon que c'est un enfant ou un adulte
        if (p.type === 'adulte') {
            btn.innerHTML = `👩🏾👨🏽 ${p.nom}`;
            btn.style.backgroundColor = "var(--violet-dark)";
        } else {
            btn.innerHTML = `👧🏽👦🏾 ${p.nom} (⭐ ${p.stars})`;
            btn.style.backgroundColor = "var(--vert)";
        }

        btn.onclick = () => { 
            currentEleve = p; 
            resumeSession(); 
        };
        div.appendChild(btn);
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
    Object.keys(bible).slice(0, 5).forEach(l => { // On limite à 5 livres pour le test
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
    
    updateUI();
    afficherEcran('scr-lecture');
}

function save() {
    currentEleve.stars = state.stars;
    localStorage.setItem('p_' + currentEleve.nom, JSON.stringify(currentEleve));
}

function updateUI() {
    document.getElementById('user-name').innerText = currentEleve ? currentEleve.nom : "Invité";
    document.getElementById('star-count').innerText = `⭐ ${state.stars}`;
}
