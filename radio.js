// ===== Radio Page =====

let episodes = [];

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadEpisodes();
    initEventListeners();
});

// ===== エピソード読み込み =====
async function loadEpisodes() {
    const episodesList = document.getElementById('episodesList');
    
    // ローディング表示
    episodesList.innerHTML = `
        <div class="episodes-loading">
            <div class="episodes-loading-spinner"></div>
            <span>エピソードを読み込み中...</span>
        </div>
    `;
    
    try {
        const response = await fetch('radio.json?t=' + Date.now());
        if (response.ok) {
            episodes = await response.json();
            renderEpisodes();
        } else {
            episodes = [];
            renderEpisodes();
        }
    } catch (error) {
        console.log('ラジオデータの読み込みエラー:', error);
        episodes = [];
        renderEpisodes();
    }
}

// ===== エピソード一覧表示 =====
function renderEpisodes() {
    const episodesList = document.getElementById('episodesList');
    
    if (episodes.length === 0) {
        episodesList.innerHTML = `
            <div class="episodes-empty">
                <div class="episodes-empty-icon">📻</div>
                <p class="episodes-empty-text">まだエピソードがありません</p>
            </div>
        `;
        return;
    }
    
    // 新しい順にソート
    const sortedEpisodes = [...episodes].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    episodesList.innerHTML = sortedEpisodes.map((episode, index) => {
        const episodeNumber = sortedEpisodes.length - index;
        
        // サムネイル
        let thumbnailHtml = '';
        if (episode.thumbnail) {
            thumbnailHtml = `<img src="${episode.thumbnail}" alt="${escapeHtml(episode.title)}" class="episode-thumbnail">`;
        } else {
            thumbnailHtml = `<div class="episode-thumbnail-placeholder">🎙️</div>`;
        }
        
        // トークテーマ
        let topicsHtml = '';
        if (episode.topics && episode.topics.length > 0) {
            topicsHtml = `
                <div class="episode-topics">
                    ${episode.topics.slice(0, 3).map(topic => `<span class="episode-topic">${escapeHtml(topic)}</span>`).join('')}
                    ${episode.topics.length > 3 ? `<span class="episode-topic">+${episode.topics.length - 3}</span>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="episode-card" data-id="${episode.id}">
                ${thumbnailHtml}
                <div class="episode-info">
                    <span class="episode-number">EP.${episodeNumber}</span>
                    <h2 class="episode-card-title">${escapeHtml(episode.title)}</h2>
                    <div class="episode-meta">
                        <span class="episode-date">${formatDate(episode.createdAt)}</span>
                        ${episode.duration ? `<span class="episode-duration">${episode.duration}</span>` : ''}
                    </div>
                    ${topicsHtml}
                </div>
            </div>
        `;
    }).join('');
    
    // クリックイベント
    episodesList.querySelectorAll('.episode-card').forEach(card => {
        card.addEventListener('click', () => {
            openEpisode(card.dataset.id);
        });
    });
}

// ===== エピソード詳細を開く =====
function openEpisode(id) {
    const episode = episodes.find(e => e.id === id);
    if (!episode) return;
    
    const modal = document.getElementById('episodeModal');
    const detail = document.getElementById('episodeDetail');
    
    // エピソード番号を計算
    const sortedEpisodes = [...episodes].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    const episodeNumber = sortedEpisodes.length - sortedEpisodes.findIndex(e => e.id === id);
    
    // DropboxのURLを変換して再生
    let audioPlayerHtml = '';
    if (episode.audioUrl) {
        // dl=0 を dl=1 に変換
        let audioSrc = episode.audioUrl.replace('dl=0', 'dl=1');
        // www.dropbox.com を dl.dropboxusercontent.com に変換（より確実）
        audioSrc = audioSrc.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        
        audioPlayerHtml = `
            <div class="audio-player-container">
                <div class="audio-player-label">🎧 再生</div>
                <audio class="audio-player" controls>
                    <source src="${audioSrc}" type="audio/mpeg">
                    お使いのブラウザは音声再生に対応していません。
                </audio>
            </div>
        `;
    }
    
    // トークテーマ
    let topicsHtml = '';
    if (episode.topics && episode.topics.length > 0) {
        topicsHtml = `
            <div class="episode-topics-section">
                <h3 class="episode-topics-title">💬 トークテーマ</h3>
                <div class="episode-topics-list">
                    ${episode.topics.map(topic => `<span class="episode-topic-tag">${escapeHtml(topic)}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // 説明文
    let descriptionHtml = '';
    if (episode.description) {
        descriptionHtml = `
            <div class="episode-description-section">
                <h3 class="episode-description-title">📝 説明</h3>
                <p class="episode-description-text">${escapeHtml(episode.description)}</p>
            </div>
        `;
    }
    
    detail.innerHTML = `
        <div class="episode-detail-header">
            <span class="episode-detail-number">EP.${episodeNumber}</span>
            <h1 class="episode-detail-title">${escapeHtml(episode.title)}</h1>
            <div class="episode-detail-meta">
                <span class="episode-date">${formatDate(episode.createdAt)}</span>
                ${episode.duration ? `<span class="episode-duration">${episode.duration}</span>` : ''}
            </div>
        </div>
        ${audioPlayerHtml}
        ${topicsHtml}
        ${descriptionHtml}
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== モーダルを閉じる =====
function closeEpisodeModal() {
    const modal = document.getElementById('episodeModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // 音声を停止
    const audio = modal.querySelector('audio');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

// ===== イベントリスナー =====
function initEventListeners() {
    document.getElementById('episodeClose').addEventListener('click', closeEpisodeModal);
    document.querySelector('#episodeModal .modal-overlay').addEventListener('click', closeEpisodeModal);
    
    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEpisodeModal();
        }
    });
}

// ===== ユーティリティ =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}
