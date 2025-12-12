// MUUTOS: Päivitetty kuvan nimi
const IMAGE_URL = 'palapeli.jpg'; 
const GRID_SIZE = 4; 
const TILE_COUNT = GRID_SIZE * GRID_SIZE; 

const gameBoard = document.getElementById('game-board');
const piecesTray = document.getElementById('pieces-tray');

let pieces = []; 
let draggingElement = null;
let currentMagnifiedPiece = null; 
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

// --- SUURENNUS FUNKTIOT ---

function clearMagnification() {
    if (currentMagnifiedPiece) {
        currentMagnifiedPiece.classList.remove('magnified');
        currentMagnifiedPiece.removeEventListener('mousemove', handleDragStartDetection);
        currentMagnifiedPiece.removeEventListener('mouseout', handleMagnificationOff);
        currentMagnifiedPiece = null;
    }
}

function handlePieceMouseDown(e) {
    if (e.button !== 0 || e.target.classList.contains('solved')) return;
    
    clearMagnification(); 
    currentMagnifiedPiece = e.target.closest('.puzzle-piece');
    dragStarted = false; 

    if (currentMagnifiedPiece) {
        currentMagnifiedPiece.classList.add('magnified');
        currentMagnifiedPiece.addEventListener('mousemove', handleDragStartDetection);
        currentMagnifiedPiece.addEventListener('mouseout', handleMagnificationOff);
    }
}

function handleSolvedPieceMouseDown(e) {
    if (e.button !== 0) return;
    const piece = e.target.closest('.puzzle-piece');
    if (piece && piece.classList.contains('solved')) {
        clearMagnification();
        currentMagnifiedPiece = piece;
        piece.classList.add('magnified');
    }
}

function handleMouseUp() {
    clearMagnification();
}

function handleDragStartDetection(e) {
    if (!dragStarted) {
        clearMagnification();
        dragStarted = true;
    }
    // Poistetaan kuuntelija heti, kun liike on havaittu, jotta raahaus alkaa kunnolla
    if (currentMagnifiedPiece) {
         currentMagnifiedPiece.removeEventListener('mousemove', handleDragStartDetection);
    }
}

function handleMagnificationOff() {
    if(currentMagnifiedPiece && currentMagnifiedPiece.classList.contains('magnified')) {
        clearMagnification();
    }
}

// --- 3. Tapahtumankuuntelijat ---

function addEventListeners() {
    // 1. Palojen käsittely
    pieces.forEach(piece => {
        piece.addEventListener('mousedown', handlePieceMouseDown);
        piece.addEventListener('mouseup', handleMouseUp);
        
        piece.addEventListener('dragstart', (e) => {
            clearMagnification(); 
            e.target.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        piece.addEventListener('dragend', (e) => {
            e.target.classList.remove('is-dragging');
            draggingElement = null;
        });
    });

    // 2. Alustalla olevien palojen suurennus
    gameBoard.addEventListener('mousedown', (e) => {
        const solvedPiece = e.target.closest('.puzzle-piece.solved');
        if (solvedPiece) {
            handleSolvedPieceMouseDown(e);
        }
    });
    
    document.addEventListener('mouseup', handleMouseUp);


    // 3. Pudotustapahtumat
    gameBoard.querySelectorAll('.puzzle-slot').forEach(slot => {
        slot.addEventListener('dragover', (e) => e.preventDefault());
        slot.addEventListener('drop', handleDrop);
    });
    
    function handleDrop(e) {
        e.preventDefault();
        
        const pieceId = e.dataTransfer.getData('text/plain');
        const piece = document.querySelector(`.puzzle-piece[data-id="${pieceId}"]`);
        
        const targetElement = e.target.closest('.puzzle-slot');
        if (!targetElement) return;

        if (targetElement.children.length === 0) {
            
            const slotId = targetElement.dataset.id;
            
            if (pieceId === slotId) {
                targetElement.appendChild(piece);
                piece.classList.add('solved');
                piece.setAttribute('draggable', false);
                targetElement.classList.add('solved-slot');
                checkWinCondition();
            } else {
                targetElement.appendChild(piece);
            }
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
    clearMagnification();
    gameBoard.innerHTML = '';
    piecesTray.innerHTML = '';
    pieces = [];
    createPieces(); 
});


createPieces();