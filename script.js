const grid = document.getElementById('grid');
const rows = 8;
const cols = 10;
const totalCells = 75;
let currentOperators = [];
let isAnimating = false;
let operatorData = {};

// Get modal elements
const modal = document.getElementById('operatorModal');
const closeBtn = document.querySelector('.close');

// Add menu button click handler
document.querySelector('.menu-btn').addEventListener('click', () => {
    const container = document.querySelector('.container');
    const menuBtn = document.querySelector('.menu-btn');
    container.classList.toggle('panels-open');
    menuBtn.classList.toggle('active');
});

// Modal event listeners
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Escape key to close modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
    }
});

function openModal(operator) {
    // Populate modal with operator data
    document.getElementById('modalIcon').src = `assets/${operator.id}.svg`;
    document.getElementById('modalIcon').alt = operator.name;
    document.getElementById('modalName').textContent = operator.name;
    document.getElementById('modalRole').textContent = operator.role;
    document.getElementById('modalOrg').textContent = operator.org;
    
    // Bio information
    document.getElementById('modalRealName').textContent = operator.bio.real_name;
    document.getElementById('modalBirthplace').textContent = operator.bio.birthplace;
    
    // Details
    document.getElementById('modalSeason').textContent = operator.meta.season;
    document.getElementById('modalHeight').textContent = operator.meta.height;
    document.getElementById('modalWeight').textContent = operator.meta.weight;
    document.getElementById('modalCountry').textContent = operator.meta.country.toUpperCase();
    
    // Price
    document.getElementById('modalRenown').textContent = operator.meta.price.renown.toLocaleString();
    document.getElementById('modalCredits').textContent = operator.meta.price.r6credits;
    
    // Update ratings
    updateRatingBars('health', operator.ratings.health);
    updateRatingBars('speed', operator.ratings.speed);
    updateRatingBars('difficulty', operator.ratings.difficulty);
    
    // Show modal with animation
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Trigger animation on next frame
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}

function closeModal() {
    // Start closing animation
    modal.classList.remove('show');
    modal.classList.add('closing');
    
    // Hide modal after animation completes
    setTimeout(() => {
        modal.style.display = 'none';
        modal.classList.remove('closing');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }, 300); // Match the CSS transition duration
}

function updateRatingBars(ratingType, value) {
    const bars = document.querySelectorAll(`[data-rating="${ratingType}"]`);
    bars.forEach((bar, index) => {
        if (index < value) {
            bar.classList.add('active');
        } else {
            bar.classList.remove('active');
        }
    });
}

// Load operator data
fetch('operator-data.json')
    .then(response => response.json())
    .then(data => {
        // Store operator data globally
        operatorData = data;
        // Convert operator data to array
        currentOperators = Object.values(data);
        createGrid(currentOperators);
        
        // Add click handlers for role buttons
        document.querySelectorAll('.role-btn').forEach(button => {
            button.addEventListener('click', () => {
                if (isAnimating) return;
                
                // Update active button
                document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter operators based on role
                const role = button.dataset.role;
                const filteredOperators = role === 'all' 
                    ? Object.values(data)
                    : Object.values(data).filter(op => op.role === role);
                
                // Start animation sequence
                animateTransition(filteredOperators);
            });
        });
    });

function animateTransition(newOperators) {
    isAnimating = true;
    
    // Fade out all current cells
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        cell.classList.add('fade-out');
    });
    
    // Wait for fade out animation
    setTimeout(() => {
        // Clear and recreate grid
        grid.innerHTML = '';
        createGrid(newOperators);
        
        // Add fly-in animation to new cells
        requestAnimationFrame(() => {
            const newCells = document.querySelectorAll('.grid-cell');
            newCells.forEach(cell => {
                cell.classList.add('fly-in');
            });
            
            // Reset animation flag after animations complete
            setTimeout(() => {
                isAnimating = false;
                newCells.forEach(cell => {
                    cell.classList.remove('fly-in');
                });
            }, 500);
        });
    }, 500);
}

function createGrid(operators) {
    let operatorIndex = 0;
    let cellCount = 0;
    
    // Create grid
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        
        for (let j = 0; j < cols; j++) {
            if (cellCount >= totalCells) {
                break;
            }
            
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            // Get next operator in sequence
            if (operatorIndex < operators.length) {
                const operator = operators[operatorIndex];
                
                // Create operator icon
                const icon = document.createElement('img');
                icon.src = `assets/${operator.id}.svg`;
                icon.alt = operator.name;
                icon.className = 'operator-icon';
                
                // Create operator name
                const name = document.createElement('div');
                name.className = 'operator-name';
                name.textContent = operator.name;
                
                // Add role indicator
                const role = document.createElement('div');
                role.className = 'operator-role';
                role.textContent = operator.role;
                
                // Add elements to cell
                cell.appendChild(icon);
                cell.appendChild(name);
                cell.appendChild(role);
                
                // Add click handler to show modal
                cell.addEventListener('click', () => {
                    openModal(operator);
                });
                
                // Add cursor pointer style
                cell.style.cursor = 'pointer';
                
                operatorIndex++;
            }
            
            row.appendChild(cell);
            cellCount++;
        }
        
        grid.appendChild(row);
        
        if (cellCount >= totalCells) {
            break;
        }
    }
} 