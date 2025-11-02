// Constants for scoring
const STARTING_POINTS = 25000;
const REFERENCE_POINTS = 30000;
// Rank points are already in leaderboard point units (p)
const RANK_POINTS = {
    1: 50,   // +50p for 1st place
    2: 10,   // +10p for 2nd place
    3: -10,  // -10p for 3rd place
    4: -30   // -30p for 4th place
};
const POINTS_TO_LEADERBOARD = 1000;

// Data storage
let players = [];
let games = [];

// Player positions for mahjong
const POSITIONS = ['东', '南', '西', '北'];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderLeaderboard();
    renderPlayerSelection();
    renderGameForm();
    renderGameHistory();
    
    // Add Enter key support for adding players
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addPlayer();
            }
        });
    }
    
    // Handle player selection changes
    const playerSelection = document.getElementById('playerSelection');
    if (playerSelection) {
        playerSelection.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                updateScoreInputs();
            }
        });
    }
});

// Data persistence
function saveData() {
    localStorage.setItem('mahjong_players', JSON.stringify(players));
    localStorage.setItem('mahjong_games', JSON.stringify(games));
}

function loadData() {
    const savedPlayers = localStorage.getItem('mahjong_players');
    const savedGames = localStorage.getItem('mahjong_games');
    
    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
    }
    
    if (savedGames) {
        games = JSON.parse(savedGames);
    }
}

// Calculate leaderboard score for a single game
function calculateLeaderboardScore(finalScore, rank) {
    // 持点 component: (Final Score - 30,000) / 1000
    const scoreComponent = (finalScore - REFERENCE_POINTS) / POINTS_TO_LEADERBOARD;
    
    // 顺位点 component: Rank points are already in leaderboard point units
    const rankComponent = RANK_POINTS[rank];
    
    return scoreComponent + rankComponent;
}

// Add new player
function addPlayer() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('Please enter a player name');
        return;
    }
    
    // Check if player already exists
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Player already exists!');
        nameInput.value = '';
        return;
    }
    
    players.push({
        id: Date.now().toString(),
        name: name,
        totalPoints: 0,
        gamesPlayed: 0,
        averageRank: 0,
        rankCounts: { 1: 0, 2: 0, 3: 0, 4: 0 }
    });
    
    nameInput.value = '';
    saveData();
    renderLeaderboard();
    renderPlayerSelection();
    renderGameForm();
}

// Record a new game
function recordGame() {
    // Get selected players
    const selectedPlayers = [];
    POSITIONS.forEach((pos, index) => {
        const select = document.getElementById(`position-${index}`);
        if (select && select.value) {
            selectedPlayers.push({
                position: pos,
                name: select.value
            });
        }
    });
    
    if (selectedPlayers.length !== 4) {
        alert('Please select exactly 4 players for 东南西北 positions');
        return;
    }
    
    // Check for duplicate players
    const playerNames = selectedPlayers.map(p => p.name);
    const uniqueNames = new Set(playerNames);
    if (uniqueNames.size !== 4) {
        alert('Each player can only be selected once');
        return;
    }
    
    // Get scores for selected players
    const gameResults = [];
    selectedPlayers.forEach((player, index) => {
        const scoreInput = document.getElementById(`score-${index}`);
        if (!scoreInput) {
            alert(`Missing score input for ${player.position} (${player.name})`);
            return;
        }
        
        const scoreStr = scoreInput.value.trim();
        if (scoreStr === '') {
            alert(`Please enter a score for ${player.position} (${player.name})`);
            return;
        }
        
        const score = parseFloat(scoreStr);
        if (isNaN(score) || score < 0) {
            alert(`Please enter a valid score for ${player.position} (${player.name})`);
            return;
        }
        
        gameResults.push({
            name: player.name,
            position: player.position,
            finalScore: score
        });
    });
    
    if (gameResults.length !== 4) {
        return; // Error already handled above
    }
    
    // Sort by final score to determine rank
    gameResults.sort((a, b) => b.finalScore - a.finalScore);
    
    // Assign ranks
    gameResults.forEach((result, index) => {
        result.rank = index + 1;
        result.leaderboardScore = calculateLeaderboardScore(result.finalScore, result.rank);
    });
    
    // Update player stats
    gameResults.forEach(result => {
        const player = players.find(p => p.name === result.name);
        if (player) {
            player.totalPoints += result.leaderboardScore;
            player.gamesPlayed += 1;
            player.rankCounts[result.rank] += 1;
            
            // Recalculate average rank
            const totalRankPoints = Object.keys(player.rankCounts).reduce((sum, rank) => {
                return sum + (parseInt(rank) * player.rankCounts[rank]);
            }, 0);
            player.averageRank = totalRankPoints / player.gamesPlayed;
        }
    });
    
    // Save game to history
    games.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        results: gameResults.map(r => ({
            name: r.name,
            position: r.position,
            finalScore: r.finalScore,
            rank: r.rank,
            leaderboardScore: r.leaderboardScore
        }))
    });
    
    saveData();
    renderLeaderboard();
    renderPlayerSelection(); // This will clear the form
    renderGameForm();
    renderGameHistory();
}

// Render player selection dropdowns
function renderPlayerSelection() {
    const playerSelection = document.getElementById('playerSelection');
    
    if (players.length === 0) {
        playerSelection.innerHTML = '<p class="help-text">Add at least one player to record games.</p>';
        return;
    }
    
    if (players.length < 4) {
        playerSelection.innerHTML = `<p class="help-text">Need at least 4 players to record a game. Currently have ${players.length} player(s).</p>`;
        return;
    }
    
    playerSelection.innerHTML = `
        <p class="help-text">Select 4 players in order: 东 (East), 南 (South), 西 (West), 北 (North)</p>
        <div class="player-selection-grid">
            ${POSITIONS.map((pos, index) => `
                <div class="player-selection-item">
                    <label>${pos}</label>
                    <select id="position-${index}" onchange="updateScoreInputs()">
                        <option value="">-- Select Player --</option>
                        ${players.map(player => `
                            <option value="${player.name}">${player.name}</option>
                        `).join('')}
                    </select>
                </div>
            `).join('')}
        </div>
    `;
}

// Update score inputs based on selected players
function updateScoreInputs() {
    const playerScores = document.getElementById('playerScores');
    const selectedPlayers = [];
    
    POSITIONS.forEach((pos, index) => {
        const select = document.getElementById(`position-${index}`);
        if (select && select.value) {
            selectedPlayers.push({
                position: pos,
                name: select.value,
                index: index
            });
        }
    });
    
    if (selectedPlayers.length === 0) {
        playerScores.innerHTML = '';
        return;
    }
    
    if (selectedPlayers.length < 4) {
        playerScores.innerHTML = `
            <p class="help-text" style="color: var(--warning-color);">
                Please select all 4 players. Currently selected: ${selectedPlayers.length}/4
            </p>
        `;
        return;
    }
    
    // Check for duplicates
    const playerNames = selectedPlayers.map(p => p.name);
    const uniqueNames = new Set(playerNames);
    if (uniqueNames.size !== 4) {
        playerScores.innerHTML = `
            <p class="help-text" style="color: var(--danger-color);">
                Error: Each player can only be selected once. Please select 4 different players.
            </p>
        `;
        return;
    }
    
    // Show score inputs for selected players
    playerScores.innerHTML = `
        <p class="help-text">Enter final scores for the selected players (starting from 25,000 points)</p>
        ${selectedPlayers.map((player, idx) => {
            // Find the saved value if it exists
            const scoreInput = document.getElementById(`score-${player.index}`);
            const savedValue = scoreInput ? scoreInput.value : '';
            
            return `
                <div class="player-score-input">
                    <label>${player.position} (${player.name}):</label>
                    <input type="number" 
                           id="score-${player.index}" 
                           data-player="${player.name}" 
                           placeholder="Final score (starting: 25,000)" 
                           min="0" 
                           step="100"
                           value="${savedValue}" />
                </div>
            `;
        }).join('')}
    `;
}

// Render leaderboard
function renderLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    
    // Sort players by total points (descending)
    const sortedPlayers = [...players].sort((a, b) => b.totalPoints - a.totalPoints);
    
    if (sortedPlayers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No players yet. Add a player to get started!</td></tr>';
        return;
    }
    
    tbody.innerHTML = sortedPlayers.map((player, index) => {
        const rank = index + 1;
        const pointsClass = player.totalPoints >= 0 ? 'positive' : 'negative';
        const formattedPoints = player.totalPoints.toFixed(1);
        const isChampion = rank === 1 && sortedPlayers.length > 0;
        
        return `
            <tr>
                <td>${rank}</td>
                <td>
                    ${isChampion ? '<span class="champion-logo">👑</span>' : ''}
                    ${player.name}
                </td>
                <td class="${pointsClass}">${formattedPoints}</td>
                <td>${player.gamesPlayed}</td>
                <td>${player.gamesPlayed > 0 ? player.averageRank.toFixed(1) : '0.0'}</td>
                <td>${player.rankCounts[1]}</td>
                <td>${player.rankCounts[2]}</td>
                <td>${player.rankCounts[3]}</td>
                <td>${player.rankCounts[4]}</td>
            </tr>
        `;
    }).join('');
}

// Render game form (called after player selection is rendered)
function renderGameForm() {
    // Score inputs are updated by updateScoreInputs() when players are selected
    updateScoreInputs();
}

// Render game history
function renderGameHistory() {
    const historyContainer = document.getElementById('gameHistory');
    
    if (games.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">No games recorded yet.</p>';
        return;
    }
    
    historyContainer.innerHTML = games.map(game => {
        const date = new Date(game.date).toLocaleString();
        const sortedResults = [...game.results].sort((a, b) => a.rank - b.rank);
        const gameIndex = games.indexOf(game);
        
        return `
            <div class="history-item" data-game-id="${game.id}">
                <div class="history-header">
                    <h3>Game ${gameIndex + 1} - ${date}</h3>
                    <div class="history-actions">
                        <button class="btn-edit" onclick="editGame('${game.id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteGame('${game.id}')">Delete</button>
                    </div>
                </div>
                <div class="history-rankings">
                    ${sortedResults.map(result => `
                        <div class="history-ranking rank-${result.rank}">
                            <strong>${result.rank}位:</strong> ${result.name}${result.position ? ` (${result.position})` : ''}<br>
                            <small>Score: ${result.finalScore.toLocaleString()} → ${result.leaderboardScore >= 0 ? '+' : ''}${result.leaderboardScore.toFixed(1)}p</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Delete a game and recalculate stats
function deleteGame(gameId) {
    if (!confirm('Are you sure you want to delete this game? This will recalculate all player statistics.')) {
        return;
    }
    
    const gameIndex = games.findIndex(g => g.id === gameId);
    if (gameIndex === -1) return;
    
    const game = games[gameIndex];
    
    // Remove the game's impact from player stats
    game.results.forEach(result => {
        const player = players.find(p => p.name === result.name);
        if (player) {
            player.totalPoints -= result.leaderboardScore;
            player.gamesPlayed -= 1;
            player.rankCounts[result.rank] -= 1;
            
            // Recalculate average rank
            if (player.gamesPlayed > 0) {
                const totalRankPoints = Object.keys(player.rankCounts).reduce((sum, rank) => {
                    return sum + (parseInt(rank) * player.rankCounts[rank]);
                }, 0);
                player.averageRank = totalRankPoints / player.gamesPlayed;
            } else {
                player.averageRank = 0;
            }
        }
    });
    
    // Remove the game
    games.splice(gameIndex, 1);
    
    saveData();
    renderLeaderboard();
    renderGameHistory();
}

// Edit a game
let editingGameId = null;

function editGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    editingGameId = gameId;
    const gameIndex = games.indexOf(game);
    
    // Remove the game's impact from stats first (we'll re-add it with new values)
    game.results.forEach(result => {
        const player = players.find(p => p.name === result.name);
        if (player) {
            player.totalPoints -= result.leaderboardScore;
            player.gamesPlayed -= 1;
            player.rankCounts[result.rank] -= 1;
        }
    });
    
    // Create edit form
    const historyItem = document.querySelector(`[data-game-id="${gameId}"]`);
    const sortedResults = [...game.results].sort((a, b) => {
        const posOrder = ['东', '南', '西', '北'];
        return posOrder.indexOf(a.position) - posOrder.indexOf(b.position);
    });
    
    historyItem.innerHTML = `
        <div class="history-header">
            <h3>Editing Game ${gameIndex + 1} - ${new Date(game.date).toLocaleString()}</h3>
            <div class="history-actions">
                <button class="btn-save" onclick="saveEditedGame('${gameId}')">Save</button>
                <button class="btn-cancel" onclick="cancelEdit('${gameId}')">Cancel</button>
            </div>
        </div>
        <div class="edit-game-form">
            ${sortedResults.map((result, idx) => `
                <div class="edit-player-row">
                    <label>${result.position} (${result.name}):</label>
                    <input type="number" 
                           id="edit-score-${gameId}-${idx}" 
                           value="${result.finalScore}" 
                           min="0" 
                           step="100" 
                           placeholder="Final score" />
                </div>
            `).join('')}
        </div>
    `;
}

// Save edited game
function saveEditedGame(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    const sortedResults = [...game.results].sort((a, b) => {
        const posOrder = ['东', '南', '西', '北'];
        return posOrder.indexOf(a.position) - posOrder.indexOf(b.position);
    });
    
    // Get new scores with validation
    const newResults = [];
    let hasError = false;
    
    for (let idx = 0; idx < sortedResults.length; idx++) {
        const result = sortedResults[idx];
        const scoreInput = document.getElementById(`edit-score-${gameId}-${idx}`);
        
        if (!scoreInput) {
            alert(`Missing score input for ${result.position} (${result.name})`);
            hasError = true;
            break;
        }
        
        const newScore = parseFloat(scoreInput.value);
        if (isNaN(newScore) || newScore < 0) {
            alert(`Please enter a valid score for ${result.position} (${result.name})`);
            hasError = true;
            break;
        }
        
        newResults.push({
            name: result.name,
            position: result.position,
            finalScore: newScore
        });
    }
    
    if (hasError || newResults.length !== 4) {
        // Restore stats on error
        game.results.forEach(result => {
            const player = players.find(p => p.name === result.name);
            if (player) {
                player.totalPoints += result.leaderboardScore;
                player.gamesPlayed += 1;
                player.rankCounts[result.rank] += 1;
                
                // Recalculate average rank
                const totalRankPoints = Object.keys(player.rankCounts).reduce((sum, rank) => {
                    return sum + (parseInt(rank) * player.rankCounts[rank]);
                }, 0);
                player.averageRank = totalRankPoints / player.gamesPlayed;
            }
        });
        editingGameId = null;
        renderLeaderboard();
        renderGameHistory();
        return;
    }
    
    // Sort by score to determine new ranks
    newResults.sort((a, b) => b.finalScore - a.finalScore);
    newResults.forEach((result, index) => {
        result.rank = index + 1;
        result.leaderboardScore = calculateLeaderboardScore(result.finalScore, result.rank);
    });
    
    // Update player stats with new values
    newResults.forEach(result => {
        const player = players.find(p => p.name === result.name);
        if (player) {
            player.totalPoints += result.leaderboardScore;
            player.gamesPlayed += 1;
            player.rankCounts[result.rank] += 1;
            
            // Recalculate average rank
            const totalRankPoints = Object.keys(player.rankCounts).reduce((sum, rank) => {
                return sum + (parseInt(rank) * player.rankCounts[rank]);
            }, 0);
            player.averageRank = totalRankPoints / player.gamesPlayed;
        }
    });
    
    // Update game data
    game.results = newResults;
    
    editingGameId = null;
    saveData();
    renderLeaderboard();
    renderGameHistory();
}

// Cancel editing
function cancelEdit(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return;
    
    // Restore stats
    game.results.forEach(result => {
        const player = players.find(p => p.name === result.name);
        if (player) {
            player.totalPoints += result.leaderboardScore;
            player.gamesPlayed += 1;
            player.rankCounts[result.rank] += 1;
            
            // Recalculate average rank
            const totalRankPoints = Object.keys(player.rankCounts).reduce((sum, rank) => {
                return sum + (parseInt(rank) * player.rankCounts[rank]);
            }, 0);
            player.averageRank = totalRankPoints / player.gamesPlayed;
        }
    });
    
    editingGameId = null;
    renderLeaderboard();
    renderGameHistory();
}

