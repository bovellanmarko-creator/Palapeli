// MUUTOS: Päivitetty kuvan nimi
const IMAGE_URL = 'palapeli.jpg'; 
const GRID_SIZE = 4; 
const TILE_COUNT = GRID_SIZE * GRID_SIZE; 

const gameBoard = document.getElementById('game-board');
const piecesTray = document.getElementById('pieces-tray');
// UUSI: Tallenna pelin tila, jotta tiedetään, missä palojen pitäisi olla
let correctSlotPositions = {};

let pieces = []; 
let draggingElement = null;
let dragStarted = false; 

// --- Laskee dynaamisen TILE_SIZE:n (pikseleinä) ---
function getTileSize() {
    const tempElement = document.createElement('div');
    tempElement.style.width = 'var(--tile-size)';
    tempElement.style.visibility = 'hidden';
    document.body.appendChild(tempElement);
    
    const size = parseFloat(window.getComputedStyle(tempElement).width);
    
    document.body.removeChild(tempElement);
    return size;
}

// --- 1. Palojen Luonti ja Alustus ---

function createPieces() {
    // Tyhjennä vanha tila
    gameBoard.innerHTML = '';
    piecesTray.innerHTML = '';
    pieces = [];
    correctSlotPositions = {};
    piecesTray.style.display = 'flex'; // Varmista, että tarjotin näkyy
    gameBoard.classList.remove('finished-board');

    const TILE_SIZE = getTileSize(); 
    const BOARD_SIZE = GRID_SIZE * TILE_SIZE; 

    let correctOrder = Array.from({ length: TILE_COUNT }, (_, i) => i);
    let shuffledOrder = shuffleArray([...correctOrder]); 

    for (let i = 0; i < TILE_COUNT; i++) {
        const correctIndex = correctOrder[i];
        
        const col = correctIndex % GRID_SIZE;
        const row = Math.floor(correctIndex / GRID_SIZE);
        
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.dataset.id = correctIndex;
        
        const bgPositionX = -col * TILE_SIZE;
        const bgPositionY = -row * TILE_SIZE;
        piece.style.backgroundPosition = `${bgPositionX}px ${bgPositionY}px`;
        
        piece.setAttribute('draggable', true);
        pieces.push(piece);
    }
    
    shuffledOrder.forEach(index => {
        piecesTray.appendChild(pieces[index]);
    });
    
    for (let i = 0; i < TILE_COUNT; i++) {
        const slot = document.createElement('div');
        slot.classList.add('puzzle-slot');
        slot.dataset.id = i; 
        gameBoard.appendChild(slot);

        // Tallenna aukon sijainti suhteessa alustaan
        // Nämä koordinaatit ovat tärkeitä tuplaklikkaukselle!
        const slotRect = slot.getBoundingClientRect();
        const boardRect = gameBoard.getBoundingClientRect();
        correctSlotPositions[i] = {
            // Huom: Nämä ovat suhteellisia koordinaatteja, ja ne tarvitsevat vielä korjauksen
            // (ne eivät ole absoluuttisia pixeleitä ennen kuin peli on aloitettu)
            // Laitetaan tässä suhteellinen indeksi, jota käytetään myöhemmin
            col: i % GRID_SIZE,
            row: Math.floor(i / GRID_SIZE)
        };
    }

    addEventListeners();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- POISTETTU: SUURENNUS FUNKTIOT ---

// --- UUSI: TUPLAKLIKKAUS FUNKTIO ---

function moveToCorrectPosition(e) {
    const piece = e.currentTarget;
    const pieceId = piece.dataset.id;
    const targetSlot = gameBoard.querySelector(`.puzzle-slot[data-id="${pieceId}"]`);
    
    // Tarkista, ettei paikka ole jo täytetty
    if (targetSlot && targetSlot.children.length === 0) {
        // Poista pala aiemmasta sijainnista (oli se sitten tarjottimella tai väärässä paikassa)
        if (piece.parentNode) {
            piece.parentNode.removeChild(piece);
        }

        // Siirrä pala oikeaan aukkoon
        targetSlot.appendChild(piece);
        piece.classList.add('solved');
        piece.setAttribute('draggable', false);
        targetSlot.classList.add('solved-slot');

        // Poista tyylit, jos pala on jostain syystä absoluuttisesti sijoitettu
        piece.style.position = '';
        piece.style.top = '';
        piece.style.left = '';

        checkWinCondition();
    }
}


// --- UUSI: ALOITA ALUSTA FUNKTIO ---

function resetGame() {
    createPieces(); // Luo palat uudelleen sekoittaen ne
    document.getElementById('game-container').style.boxShadow = '10px 10px 0px rgba(0, 0, 0, 0.4)';
}


// --- 3. Tapahtumankuuntelijat ---

function addEventListeners() {
    // A. "Aloita Alusta" -painike
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
    }
    
    // B. Palojen käsittely
    pieces.forEach(piece => {
        // Poistettu: mousedown ja mouseup (suurennus)

        // UUSI: Tuplaklikkaus
        piece.addEventListener('dblclick', moveToCorrectPosition);
        
        piece.addEventListener('dragstart', (e) => {
            // clearMagnification(); // Poistettu
            e.target.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        piece.addEventListener('dragend', (e) => {
            e.target.classList.remove('is-dragging');
            draggingElement = null;
        });
    });

    // C. Pudotustapahtumat

    // 1. Pelilaudan aukot
    gameBoard.querySelectorAll('.puzzle-slot').forEach(slot => {
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', handleDrop);
    });
   
    // 2. Tarjotin (Sallii palasten siirtämisen pois alustalta)
    // TÄMÄ VAATII, että `piecesTray` on HTML:ssä asetettu hyväksymään pudotuksia.
    piecesTray.addEventListener('dragover', (e) => e.preventDefault());
    piecesTray.addEventListener('drop', handleDropToTray);
    
    function handleDrop(e) {
        e.preventDefault();
        
        const pieceId = e.dataTransfer.getData('text/plain');
        const piece = document.querySelector(`.puzzle-piece[data-id="${pieceId}"]`);
        
        const targetElement = e.target.closest('.puzzle-slot');
        if (!targetElement || targetElement.children.length > 0) return; // Vain tyhjiin aukkoihin

        const slotId = targetElement.dataset.id;
        
        if (pieceId === slotId) {
            targetElement.appendChild(piece);
            piece.classList.add('solved');
            piece.setAttribute('draggable', false);
            targetElement.classList.add('solved-slot');
            checkWinCondition();
        } else {
            targetElement.appendChild(piece);
            piece.classList.remove('solved'); // Varmista, että solved poistuu, jos siirretään
            piece.setAttribute('draggable', true);
        }
    }

    // UUSI: Funktio, joka käsittelee pudotuksen takaisin tarjottimelle
    function handleDropToTray(e) {
        e.preventDefault();
        const pieceId = e.dataTransfer.getData('text/plain');
        const piece = document.querySelector(`.puzzle-piece[data-id="${pieceId}"]`);
        
        if (piece) {
            // Jos pala oli ratkaistussa aukossa, poista solved-luokat aukosta
            const parentSlot = piece.parentNode;
            if (parentSlot && parentSlot.classList.contains('solved-slot')) {
                parentSlot.classList.remove('solved-slot');
            }
            
            piecesTray.appendChild(piece);
            piece.classList.remove('solved');
            piece.setAttribute('draggable', true);
        }
    }
}

// --- Voittotarkistus (Sama) ---
function checkWinCondition() {
    const solvedPieces = document.querySelectorAll('.puzzle-piece.solved').length;
    if (solvedPieces === TILE_COUNT) {
        piecesTray.style.display = 'none';
        gameBoard.classList.add('finished-board');
        document.getElementById('game-container').style.boxShadow = 'none';
        
        setTimeout(() => {
            alert('PALAPELI VALMIS! Pop-Art de Mako on ylpeä sinusta.');
        }, 100); 
    }
}

// --- Skaalautumisen kuuntelija ---
window.addEventListener('resize', () => {
    // clearMagnification(); // Poistettu
    // Uudelleenluonti hoitaa nollauksen ja sekoituksen
    createPieces(); 
});


createPieces();
