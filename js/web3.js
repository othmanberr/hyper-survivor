// ============ WEB3 / HYPERLIQUID EVM INTEGRATION ============
// Wallet connection, on-chain leaderboard, NFT achievements
// Uses the LeaderboardData.setProvider() abstraction from game.js

const HYPEREVM_CHAIN = {
    chainId: '0x3E6', // 998 testnet
    chainName: 'Hyperliquid EVM Testnet',
    rpcUrls: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
    blockExplorerUrls: ['https://testnet.hyperevmscan.io']
};

// ─── Contract — UPDATE after deployment! ───
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

const CONTRACT_ABI = [
    'function submitScore(uint256 stage, uint256 kills) external',
    'function getLeaderboard() external view returns (tuple(address player, uint256 stage, uint256 kills, uint256 timestamp)[])',
    'function getLeaderboardLength() external view returns (uint256)',
    'function mintAchievement(uint256 bossId, uint256 kills) external',
    'function getPlayerAchievements(address player) external view returns (bool[10])',
    'function hasMintedBoss(address, uint256) external view returns (bool)',
    'function playerBest(address) external view returns (address player, uint256 stage, uint256 kills, uint256 timestamp)',
    'event ScoreSubmitted(address indexed player, uint256 stage, uint256 kills)',
    'event AchievementMinted(address indexed player, uint256 tokenId, uint256 bossId)'
];

let w3Provider = null, w3Signer = null, w3Contract = null, w3Address = null;

// ─── Wallet Connection ───
async function w3Connect() {
    const btn = document.getElementById('btn-wallet');
    if (!btn) return;

    // Disconnect
    if (w3Address) {
        w3Provider = null; w3Signer = null; w3Contract = null; w3Address = null;
        btn.innerHTML = '<span class="ico-link"></span> CONNECT WALLET';
        btn.classList.remove('connected');
        // Revert to local provider
        if (typeof LeaderboardData !== 'undefined') LeaderboardData.setProvider(null);
        _w3UpdateUI();
        return;
    }

    if (!window.ethereum) {
        alert('Please install MetaMask to use Web3 features!');
        return;
    }

    try {
        btn.innerHTML = '⏳ CONNECTING...';
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Switch to HyperEVM
        try {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: HYPEREVM_CHAIN.chainId }] });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [HYPEREVM_CHAIN] });
            } else throw switchError;
        }

        w3Provider = new ethers.BrowserProvider(window.ethereum);
        w3Signer = await w3Provider.getSigner();
        w3Address = await w3Signer.getAddress();
        w3Contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, w3Signer);

        const short = w3Address.slice(0, 6) + '...' + w3Address.slice(-4);
        btn.innerHTML = '🟢 ' + short;
        btn.classList.add('connected');

        // Swap leaderboard provider to blockchain
        if (typeof LeaderboardData !== 'undefined' && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
            LeaderboardData.setProvider(_blockchainProvider);
        }

        _w3UpdateUI();
        console.log('[Web3] Connected:', w3Address);
    } catch (err) {
        console.error('[Web3] Connection failed:', err);
        btn.innerHTML = '<span class="ico-link"></span> CONNECT WALLET';
        alert('Connection failed: ' + (err.message || err));
    }
}

// ─── Blockchain Leaderboard Provider ───
// Implements the same interface as localProvider in game.js
const _blockchainProvider = {
    async getAllScores() {
        try {
            const scores = await w3Contract.getLeaderboard();
            return scores.map(s => ({
                wave: Number(s.stage),
                kills: Number(s.kills),
                time: 0,
                combo: 0,
                gold: 0,
                mode: 'adventure',
                date: Number(s.timestamp) * 1000,
                player: s.player
            }));
        } catch (err) {
            console.error('[Web3] Failed to fetch leaderboard:', err);
            return [];
        }
    },

    async saveScore(entry) {
        // On-chain: submit score as a transaction
        try {
            const stage = entry.wave || 1;
            const kills = entry.kills || 0;
            const tx = await w3Contract.submitScore(stage, kills);
            _w3ShowStatus('Score submitted! Confirming...', 'pending');
            await tx.wait();
            _w3ShowStatus('✅ Score recorded on-chain!', 'success');
        } catch (err) {
            console.error('[Web3] Submit score failed:', err);
            _w3ShowStatus('❌ ' + (err.reason || err.message || 'Failed'), 'error');
            // Fallback: save locally too
            try {
                const scores = JSON.parse(localStorage.getItem('hl_survivor_scores') || '[]');
                scores.push(entry);
                scores.sort((a, b) => b.wave - a.wave || b.kills - a.kills);
                if (scores.length > 500) scores.length = 500;
                localStorage.setItem('hl_survivor_scores', JSON.stringify(scores));
            } catch (e) { }
        }
    },

    async getLifetimeStats() {
        // Lifetime stats stay local (too expensive on-chain for cumulative stats)
        try {
            const raw = JSON.parse(localStorage.getItem('hl_survivor_stats') || '{}');
            return {
                totalKills: raw.totalKills || 0, totalGames: raw.totalGames || 0,
                totalTime: raw.totalTime || 0, bestWave: raw.bestWave || 0,
                bestCombo: raw.bestCombo || 0,
            };
        } catch (e) {
            return { totalKills: 0, totalGames: 0, totalTime: 0, bestWave: 0, bestCombo: 0 };
        }
    },

    async saveLifetimeStats(stats) {
        localStorage.setItem('hl_survivor_stats', JSON.stringify(stats));
    }
};

// ─── Score Submission (explicit button) ───
async function w3SubmitScore() {
    if (!w3Address) { alert('Connect your wallet first!'); return; }
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        _w3ShowStatus('Contract not deployed yet!', 'error'); return;
    }
    const wave = typeof G !== 'undefined' ? G.wave : 1;
    const kills = typeof G !== 'undefined' ? G.kills : 0;
    _w3ShowStatus('Submitting score on-chain...', 'pending');
    try {
        const tx = await w3Contract.submitScore(wave, kills);
        _w3ShowStatus('Tx sent! Confirming...', 'pending');
        await tx.wait();
        _w3ShowStatus(`✅ Score recorded! Wave ${wave}, ${kills} kills`, 'success');
    } catch (err) {
        console.error('[Web3] Submit score failed:', err);
        _w3ShowStatus('❌ ' + (err.reason || err.message || 'Transaction failed'), 'error');
    }
}

// ─── NFT Achievement Minting ───
async function w3MintAchievement(bossId) {
    if (!w3Address) { alert('Connect your wallet first!'); return; }
    if (CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        _w3ShowStatus('Contract not deployed yet!', 'error'); return;
    }
    _w3ShowStatus('Minting achievement NFT...', 'pending');
    try {
        const already = await w3Contract.hasMintedBoss(w3Address, bossId);
        if (already) { _w3ShowStatus('Already minted this achievement!', 'error'); return; }
        const kills = typeof G !== 'undefined' ? G.kills : 0;
        const tx = await w3Contract.mintAchievement(bossId, kills);
        _w3ShowStatus('Tx sent! Minting...', 'pending');
        await tx.wait();
        const bossNames = ['LOUD MOUTH', 'HASH BEAST', 'SPIRAL KING', 'NORTH STAR', 'UNBANKER', 'VULTURE TWINS', 'PROPHET', 'MATH SORCERER', 'GREY GUARDIAN', 'IRON EMPEROR'];
        _w3ShowStatus(`🎖️ NFT Minted: ${bossNames[bossId] || 'Boss'} Defeated!`, 'success');
    } catch (err) {
        console.error('[Web3] Mint failed:', err);
        _w3ShowStatus('❌ ' + (err.reason || err.message || 'Mint failed'), 'error');
    }
}

// ─── UI Helpers ───
function _w3ShowStatus(msg, cls) {
    document.querySelectorAll('.w3-status').forEach(el => {
        el.textContent = msg;
        el.className = 'w3-status w3-' + cls;
    });
}

function _w3UpdateUI() {
    const connected = !!w3Address;
    // Show/hide Web3 buttons based on connection status
    document.querySelectorAll('.w3-connected-only').forEach(el => {
        el.style.display = connected ? '' : 'none';
    });
}

// ─── Account/Chain Change Listeners ───
if (typeof window !== 'undefined' && window.ethereum) {
    window.ethereum.on('accountsChanged', () => {
        w3Address = null; w3Signer = null; w3Contract = null;
        const btn = document.getElementById('btn-wallet');
        if (btn) { btn.innerHTML = '<span class="ico-link"></span> CONNECT WALLET'; btn.classList.remove('connected'); }
        _w3UpdateUI();
    });
    window.ethereum.on('chainChanged', () => location.reload());
}

// Init: hide Web3-only buttons on load
document.addEventListener('DOMContentLoaded', _w3UpdateUI);
