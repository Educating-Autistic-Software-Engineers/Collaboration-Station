const emojiRewards = [
    { id: 1, emoji: '😀', name: 'Happy Face', requiredTasks: 0 },
    { id: 2, emoji: '🎨', name: 'Artist', requiredTasks: 5 },
    { id: 3, emoji: '🚀', name: 'Rocket', requiredTasks: 10 },
    { id: 4, emoji: '⭐', name: 'Star', requiredTasks: 15 },
    { id: 5, emoji: '🎯', name: 'Target', requiredTasks: 20 },
    { id: 6, emoji: '🏆', name: 'Trophy', requiredTasks: 30 },
    { id: 7, emoji: '💎', name: 'Diamond', requiredTasks: 50 },
    { id: 8, emoji: '👑', name: 'Crown', requiredTasks: 75 },
    { id: 9, emoji: '🔥', name: 'Fire', requiredTasks: 100 },
    { id: 10, emoji: '⚡', name: 'Lightning', requiredTasks: 150 },
    { id: 11, emoji: '🌟', name: 'Glowing Star', requiredTasks: 200 },
    { id: 12, emoji: '🦄', name: 'Unicorn', requiredTasks: 300 }
];

const profileEffects = [
    { id: 1, name: 'Sparkles', emoji: '✨', requiredTasks: 5 },
    { id: 2, name: 'Fire Aura', emoji: '🔥', requiredTasks: 20 },
    { id: 3, name: 'Rainbow', emoji: '🌈', requiredTasks: 50 },
    { id: 4, name: 'Galaxy', emoji: '🌌', requiredTasks: 100 },
    { id: 5, name: 'Neon Glow', emoji: '⚡', requiredTasks: 150 }
];

let tasksCompleted = 0;
let selectedEmoji = null;
let selectedEffect = null;
let unlockedEmojis = new Set();

function initializeShop() {
    // Get tasks completed from sessionStorage or set to demo value
    tasksCompleted = parseInt(sessionStorage.getItem('tasksCompleted') || '0');
    
    // If demo and no tasks, set a demo value
    if (tasksCompleted === 0 && !sessionStorage.getItem('tasksCompleted')) {
        tasksCompleted = 42; // Demo value
        sessionStorage.setItem('tasksCompleted', tasksCompleted);
    }
    
    sessionStorage.setItem('selectedEmoji', '1');
    selectedEmoji = sessionStorage.getItem('selectedEmoji') ? parseInt(sessionStorage.getItem('selectedEmoji')) : null;
    selectedEffect = sessionStorage.getItem('selectedEffect') ? parseInt(sessionStorage.getItem('selectedEffect')) : null;
    unlockedEmojis = new Set(JSON.parse(sessionStorage.getItem('unlockedEmojis')) || [1]); 
    
    // Auto-unlock emojis based on tasks
    autoUnlockEmojis();

    updateTasksDisplay();
    renderShop();
}

function updateTasksDisplay() {
    const taskDisplay = document.getElementById('tasks-completed');
    if (taskDisplay) {
        taskDisplay.textContent = tasksCompleted;
    }
}

function autoUnlockEmojis() {
    emojiRewards.forEach(reward => {
        if (tasksCompleted >= reward.requiredTasks) {
            unlockedEmojis.add(reward.id);
        }
    });
    
    // Save unlocked emojis
    sessionStorage.setItem('unlockedEmojis', JSON.stringify(Array.from(unlockedEmojis)));
}

function renderShop() {
    const shopGrid = document.getElementById('shop-grid');
    shopGrid.innerHTML = '';

    emojiRewards.forEach(reward => {
        const isUnlocked = tasksCompleted >= reward.requiredTasks || unlockedEmojis.has(reward.id);
        const isSelected = selectedEmoji === reward.id;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `emoji-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        let itemContent;
        if (isUnlocked) {
            itemContent = `
                <div class="emoji-display">${reward.emoji}</div>
                <div class="emoji-name">${reward.name}</div>
                <button class="emoji-btn ${isSelected ? 'selected' : ''}" onclick="selectEmoji(${reward.id})">
                    ${isSelected ? 'Active' : 'Select'}
                </button>
            `;
        } else {
            const tasksUntilUnlock = reward.requiredTasks - tasksCompleted;
            itemContent = `
                <div class="emoji-display locked-emoji">${reward.emoji}</div>
                <div class="emoji-name">${reward.name}</div>
                <div class="emoji-requirement">
                    ${tasksUntilUnlock} tasks
                </div>
            `;
        }
        
        itemDiv.innerHTML = itemContent;
        shopGrid.appendChild(itemDiv);
    });

    renderProfileEffects();
}

function renderProfileEffects() {
    const effectsContainer = document.getElementById('profile-effects');
    if (!effectsContainer) return;
    
    effectsContainer.innerHTML = '';
    
    const title = document.createElement('h3');
    title.className = 'effects-title';
    title.textContent = '✨ Profile Effects';
    effectsContainer.appendChild(title);
    
    const effectsGrid = document.createElement('div');
    effectsGrid.className = 'effects-grid';
    
    profileEffects.forEach(effect => {
        const isUnlocked = tasksCompleted >= effect.requiredTasks;
        const isSelected = selectedEffect === effect.id;
        
        const effectDiv = document.createElement('div');
        effectDiv.className = `effect-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        let effectContent;
        if (isUnlocked) {
            effectContent = `
                <div class="effect-display">${effect.emoji}</div>
                <div class="effect-name">${effect.name}</div>
                <button class="effect-btn ${isSelected ? 'selected' : ''}" onclick="selectEffect(${effect.id})">
                    ${isSelected ? '✓ Active' : 'Activate'}
                </button>
            `;
        } else {
            const tasksUntilUnlock = effect.requiredTasks - tasksCompleted;
            effectContent = `
                <div class="effect-display locked-effect">${effect.emoji}</div>
                <div class="effect-name">${effect.name}</div>
                <div class="effect-requirement">${tasksUntilUnlock} tasks</div>
            `;
        }
        
        effectDiv.innerHTML = effectContent;
        effectsGrid.appendChild(effectDiv);
    });
    
    effectsContainer.appendChild(effectsGrid);
}

async function selectEmoji(emojiId) {
    // Profile emoji selection disabled in production — no-op to prevent user changes.
    return;
}

function selectEffect(effectId) {
    // Profile effects activation disabled in production — no-op to prevent user changes.
    return;
}

initializeShop();