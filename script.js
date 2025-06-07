// Constants and state
const CONFIG = {
    GRID: { rows: 8, cols: 10, totalCells: 75 },
    ANIMATION: { fadeOut: 500, flyIn: 500 },
    MODAL: { transitionDuration: 300 }
};

const state = {
    currentOperators: [],
    isAnimating: false,
    operatorData: {}
};

// DOM Elements - cached for performance
const elements = {
    grid: document.getElementById('grid'),
    modal: document.getElementById('operatorModal'),
    closeBtn: document.querySelector('.close'),
    menuBtn: document.querySelector('.menu-btn'),
    container: document.querySelector('.container'),
    roleButtons: document.querySelectorAll('.role-btn'),
    infoBtn: document.querySelector('.info-btn'),
    infoPanel: document.querySelector('.info-panel'),
    mobileWarningModal: document.getElementById('mobileWarningModal'),
    mobileWarningClose: document.getElementById('mobileWarningClose')
};

// Utility functions
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const trapFocus = (element) => {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });
};

// Menu functionality
const toggleMenu = () => {
    const isOpen = elements.container.classList.toggle('panels-open');
    elements.menuBtn.classList.toggle('active');
    elements.menuBtn.setAttribute('aria-expanded', isOpen);
};

// Info panel functionality
const toggleInfoPanel = () => {
    const isOpen = elements.infoPanel.classList.toggle('open');
    elements.infoBtn.setAttribute('aria-expanded', isOpen);
};

// Mobile detection and warning functionality
const isMobileDevice = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768 || window.innerHeight <= 500;
    
    return isMobileUserAgent || (isTouchDevice && isSmallScreen);
};

const showMobileWarning = () => {
    elements.mobileWarningModal.classList.add('show');
    elements.mobileWarningModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Focus on close button for accessibility
    elements.mobileWarningClose.focus();
    
    // Trap focus within modal
    trapFocus(elements.mobileWarningModal);
};

const closeMobileWarning = () => {
    elements.mobileWarningModal.classList.remove('show');
    elements.mobileWarningModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
};

// Modal functionality
const openModal = (operator) => {
    try {
        // Populate modal with operator data
        const modalElements = {
            icon: document.getElementById('modalIcon'),
            name: document.getElementById('modalName'),
            role: document.getElementById('modalRole'),
            org: document.getElementById('modalOrg'),
            realName: document.getElementById('modalRealName'),
            birthplace: document.getElementById('modalBirthplace'),
            season: document.getElementById('modalSeason'),
            height: document.getElementById('modalHeight'),
            weight: document.getElementById('modalWeight'),
            country: document.getElementById('modalCountry'),
            renown: document.getElementById('modalRenown'),
            credits: document.getElementById('modalCredits')
        };

        modalElements.icon.src = `assets/${operator.id}.svg`;
        modalElements.icon.alt = operator.name;
        modalElements.name.textContent = operator.name;
        modalElements.role.textContent = operator.role;
        modalElements.org.textContent = operator.org;
        
        // Bio information
        modalElements.realName.textContent = operator.bio.real_name;
        modalElements.birthplace.textContent = operator.bio.birthplace;
        
        // Details
        modalElements.season.textContent = operator.meta.season;
        modalElements.height.textContent = operator.meta.height;
        modalElements.weight.textContent = operator.meta.weight;
        modalElements.country.textContent = operator.meta.country.toUpperCase();
        
        // Price
        modalElements.renown.textContent = operator.meta.price.renown.toLocaleString();
        modalElements.credits.textContent = operator.meta.price.r6credits;
        
        // Update ratings
        updateRatingBars('health', operator.ratings.health);
        updateRatingBars('speed', operator.ratings.speed);
        updateRatingBars('difficulty', operator.ratings.difficulty);
        
        // Show modal with animation
        elements.modal.style.display = 'block';
        elements.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Trap focus within modal
        trapFocus(elements.modal);
        
        // Focus on close button for accessibility
        elements.closeBtn.focus();
        
        // Trigger animation on next frame
        requestAnimationFrame(() => {
            elements.modal.classList.add('show');
        });
    } catch (error) {
        console.error('Error in openModal:', error);
    }
};

const closeModal = () => {
    try {
        // Start closing animation
        elements.modal.classList.remove('show');
        elements.modal.classList.add('closing');
        elements.modal.setAttribute('aria-hidden', 'true');
        
        // Hide modal after animation completes
        setTimeout(() => {
            elements.modal.style.display = 'none';
            elements.modal.classList.remove('closing');
            document.body.style.overflow = 'auto';
        }, CONFIG.MODAL.transitionDuration);
    } catch (error) {
        console.error('Error in closeModal:', error);
    }
};

const updateRatingBars = (ratingType, value) => {
    try {
        const bars = document.querySelectorAll(`[data-rating="${ratingType}"]`);
        bars.forEach((bar, index) => {
            const isActive = index < value;
            bar.classList.toggle('active', isActive);
            
            // Update aria-label for the parent rating container
            const ratingContainer = bar.closest('.rating-bars');
            if (ratingContainer) {
                ratingContainer.setAttribute('aria-label', `${ratingType} rating: ${value} out of 3`);
            }
        });
    } catch (error) {
        console.error('Error in updateRatingBars:', error);
    }
};

// Grid functionality
const createGrid = (operators) => {
    try {
        let operatorIndex = 0;
        let cellCount = 0;
        
        const fragment = document.createDocumentFragment();
        
        // Create grid efficiently using DocumentFragment
        for (let i = 0; i < CONFIG.GRID.rows; i++) {
            const row = document.createElement('div');
            row.className = 'grid-row';
            
            for (let j = 0; j < CONFIG.GRID.cols; j++) {
                if (cellCount >= CONFIG.GRID.totalCells) break;
                
                const cell = document.createElement('div');
                cell.className = 'grid-cell rounded-cell transition-medium';
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('tabindex', '0');
                
                // Get next operator in sequence
                if (operatorIndex < operators.length) {
                    const operator = operators[operatorIndex];
                    
                    // Create operator content
                    const content = createOperatorContent(operator);
                    cell.appendChild(content);
                    
                    // Add click and keyboard handlers
                    const openOperatorModal = () => openModal(operator);
                    cell.addEventListener('click', openOperatorModal);
                    cell.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openOperatorModal();
                        }
                    });
                    
                    // Accessibility
                    cell.setAttribute('aria-label', `${operator.name}, ${operator.role}`);
                    
                    operatorIndex++;
                }
                
                row.appendChild(cell);
                cellCount++;
                
                if (cellCount >= CONFIG.GRID.totalCells) break;
            }
            
            fragment.appendChild(row);
        }
        
        elements.grid.appendChild(fragment);
    } catch (error) {
        console.error('Error in createGrid:', error);
    }
};

const createOperatorContent = (operator) => {
    const fragment = document.createDocumentFragment();
    
    // Create operator icon
    const icon = document.createElement('img');
    icon.src = `assets/${operator.id}.svg`;
    icon.alt = operator.name;
    icon.className = 'operator-icon';
    icon.loading = 'lazy'; // Improve performance
    
    // Create operator name
    const name = document.createElement('div');
    name.className = 'operator-name';
    name.textContent = operator.name;
    
    // Add role indicator
    const role = document.createElement('div');
    role.className = 'operator-role';
    role.textContent = operator.role;
    
    fragment.appendChild(icon);
    fragment.appendChild(name);
    fragment.appendChild(role);
    
    return fragment;
};

const animateTransition = (newOperators) => {
    if (state.isAnimating) return;
    
    state.isAnimating = true;
    
    // Fade out all current cells
    const cells = document.querySelectorAll('.grid-cell');
    cells.forEach(cell => cell.classList.add('fade-out'));
    
    // Wait for fade out animation
    setTimeout(() => {
        // Clear and recreate grid
        elements.grid.innerHTML = '';
        createGrid(newOperators);
        
        // Add fly-in animation to new cells
        requestAnimationFrame(() => {
            const newCells = document.querySelectorAll('.grid-cell');
            newCells.forEach(cell => cell.classList.add('fly-in'));
            
            // Reset animation flag after animations complete
            setTimeout(() => {
                state.isAnimating = false;
                newCells.forEach(cell => cell.classList.remove('fly-in'));
            }, CONFIG.ANIMATION.flyIn);
        });
    }, CONFIG.ANIMATION.fadeOut);
};

const handleRoleButtonClick = (button) => {
    if (state.isAnimating) return;
    
    // Update active button and aria-pressed states
    elements.roleButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
    
    // Filter operators based on role
    const role = button.dataset.role;
    const filteredOperators = role === 'all' 
        ? Object.values(state.operatorData)
        : Object.values(state.operatorData).filter(op => op.role === role);
    
    // Start animation sequence
    animateTransition(filteredOperators);
};

// Event listeners
const initEventListeners = () => {
    // Menu button
    elements.menuBtn.addEventListener('click', toggleMenu);
    
    // Info panel
    elements.infoBtn.addEventListener('click', toggleInfoPanel);
    
    // Modal event listeners
    elements.closeBtn.addEventListener('click', closeModal);
    
    // Mobile warning modal
    elements.mobileWarningClose.addEventListener('click', closeMobileWarning);
    
    // Click outside modal to close
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            closeModal();
        }
    });
    
    // Click outside mobile warning to close
    elements.mobileWarningModal.addEventListener('click', (e) => {
        if (e.target === elements.mobileWarningModal) {
            closeMobileWarning();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.modal.style.display === 'block') {
                closeModal();
            } else if (elements.mobileWarningModal.classList.contains('show')) {
                closeMobileWarning();
            } else if (elements.infoPanel.classList.contains('open')) {
                toggleInfoPanel();
            }
        }
    });
    
    // Role buttons with debouncing
    const debouncedRoleHandler = debounce((button) => handleRoleButtonClick(button), 100);
    elements.roleButtons.forEach(button => {
        button.addEventListener('click', () => debouncedRoleHandler(button));
    });
};

// Initialization
const init = async () => {
    try {
        // Load operator data with error handling
        const response = await fetch('operator-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Store operator data globally
        state.operatorData = data;
        state.currentOperators = Object.values(data);
        
        // Create initial grid
        createGrid(state.currentOperators);
        
        // Initialize event listeners
        initEventListeners();
        
        // Check for mobile device and show warning if needed
        if (isMobileDevice()) {
            // Small delay to ensure everything is loaded
            setTimeout(() => {
                showMobileWarning();
            }, 500);
        }
        
        console.log('SiegeGrid initialized successfully');
    } catch (error) {
        console.error('Error in initialization:', error);
        // Show user-friendly error message
        elements.grid.innerHTML = '<div class="error-message">Failed to load operator data. Please refresh the page.</div>';
    }
};

// Start the application
init(); 