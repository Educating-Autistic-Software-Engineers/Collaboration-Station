const emojiRewards = [
    { id: 1, emoji: '😀', name: 'Happy Face', requiredCoins: 0 },
    { id: 2, emoji: '🎨', name: 'Artist', requiredCoins: 50 },
    { id: 3, emoji: '🚀', name: 'Rocket', requiredCoins: 100 },
    { id: 4, emoji: '⭐', name: 'Star', requiredCoins: 150 },
    { id: 5, emoji: '🎯', name: 'Target', requiredCoins: 200 },
    { id: 6, emoji: '🏆', name: 'Trophy', requiredCoins: 300 },
    { id: 7, emoji: '💎', name: 'Diamond', requiredCoins: 400 },
    { id: 8, emoji: '👑', name: 'Crown', requiredCoins: 500 },
    { id: 9, emoji: '🔥', name: 'Fire', requiredCoins: 600 },
    { id: 10, emoji: '⚡', name: 'Lightning', requiredCoins: 750 },
    { id: 11, emoji: '🌟', name: 'Glowing Star', requiredCoins: 1000 },
    { id: 12, emoji: '🦄', name: 'Unicorn', requiredCoins: 1500 }
];

let currentCoins = 0;
let selectedEmoji = null;
let unlockedEmojis = new Set();

function initializeShop() {
    sessionStorage.setItem('currentCoins', '250');
    sessionStorage.setItem('selectedEmoji', '1');
    sessionStorage.setItem('unlockedEmojis', JSON.stringify([1, 2, 3]));
    currentCoins = sessionStorage.getItem('currentCoins') ? parseInt(sessionStorage.getItem('currentCoins')) : 0; 
    selectedEmoji = sessionStorage.getItem('selectedEmoji') ? parseInt(sessionStorage.getItem('selectedEmoji')) : null;
    unlockedEmojis = new Set(JSON.parse(sessionStorage.getItem('unlockedEmojis')) || []); 

    updateCoinDisplay();
    renderShop();
    checkNewUnlocks();
}

function updateCoinDisplay() {
    document.getElementById('coin-balance').textContent = currentCoins;
}

function renderProgressBar() {
    const progressSection = document.getElementById('progress-section');
    
    // Find next reward to unlock
    const nextReward = emojiRewards.find(r => currentCoins < r.requiredCoins);
    
    if (!nextReward) {
        // All rewards unlocked!
        progressSection.innerHTML = `
            <div class="all-unlocked">
                <h2>🎉 All Rewards Unlocked! 🎉</h2>
                <p>You've collected every icon in the gallery!</p>
            </div>
        `;
        return;
    }
    
    // Find previous reward threshold (or 0 if this is the first)
    const currentRewardIndex = emojiRewards.findIndex(r => r.id === nextReward.id);
    const previousReward = currentRewardIndex > 0 ? emojiRewards[currentRewardIndex - 1] : null;
    const previousThreshold = previousReward ? previousReward.requiredCoins : 0;
    
    // Calculate progress
    const coinsNeeded = nextReward.requiredCoins - currentCoins;
    const progressRange = nextReward.requiredCoins - previousThreshold;
    const currentProgress = currentCoins - previousThreshold;
    const progressPercent = Math.min(100, (currentProgress / progressRange) * 100);
    
    progressSection.innerHTML = `
        <div class="progress-container">
            <div class="progress-header">
                <div class="progress-title">Next Reward</div>
                <div class="progress-info">
                    <span class="coin-icon">🪙</span>
                    ${coinsNeeded} coins to go
                </div>
            </div>
            <div class="next-reward">
                <span class="next-reward-emoji">${nextReward.emoji}</span>
                <span>${nextReward.name}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                <div class="progress-text">${currentCoins} / ${nextReward.requiredCoins}</div>
            </div>
        </div>
    `;
}

function renderShop() {
    renderProgressBar();
    renderProgressBar();
    
    const shopGrid = document.getElementById('shop-grid');
    shopGrid.innerHTML = '';

    emojiRewards.forEach(reward => {
        const isUnlocked = currentCoins >= reward.requiredCoins || unlockedEmojis.has(reward.id);
        const isSelected = selectedEmoji === reward.id;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = `emoji-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        itemDiv.innerHTML = `
            <div class="emoji-display">${reward.emoji}</div>
            <div class="emoji-name">${reward.name}</div>
            <div class="emoji-requirement">
                <span class="coin-icon">🪙</span>
                ${reward.requiredCoins} Coins
            </div>
            ${isUnlocked ? 
                `<button class="select-btn ${isSelected ? 'selected' : ''}" onclick="selectEmoji(${reward.id})">
                    ${isSelected ? '✓ Selected' : 'Select'}
                </button>` :
                `<div class="unlock-status locked">
                    ${currentCoins}/${reward.requiredCoins} Coins
                </div>`
            }
        `;
        
        shopGrid.appendChild(itemDiv);
    });
}

function selectEmoji(emojiId) {
    const reward = emojiRewards.find(r => r.id === emojiId);
    const isUnlocked = currentCoins >= reward.requiredCoins || unlockedEmojis.has(emojiId);
    
    if (!isUnlocked) return;
    
    selectedEmoji = emojiId;
    renderShop();
}

function checkNewUnlocks() {
    emojiRewards.forEach(reward => {
        if (currentCoins >= reward.requiredCoins && !unlockedEmojis.has(reward.id)) {
            unlockedEmojis.add(reward.id);
        }
    });
}

// Initialize shop on page load
initializeShop();