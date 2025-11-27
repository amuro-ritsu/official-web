// ===== Radio Admin =====

let episodes = [];
let topics = [];

// 同期制御
let isSyncing = false;
let lastSyncTime = 0;
let pendingSync = false;
let autoSyncInterval = null;

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
    loadGithubSettings();
    await loadEpisodesFromGithub();
    initEventListeners();
    renderAdminEpisodes();
    startAutoSync();
});

// ===== GitHub設定 =====
function loadGithubSettings() {
    const settings = JSON.parse(localStorage.getItem('blogBearGithub') || '{}');
    if (settings.username) document.getElementById('githubUsername').value = settings.username;
    if (settings.repo) document.getElementById('githubRepo').value = settings.repo;
    if (settings.branch) document.getElementById('githubBranch').value = settings.branch;
    if (settings.token) document.getElementById('githubToken').value = settings.token;
}

function saveGithubSettings() {
    const settings = {
        username: document.getElementById('githubUsername').value.trim(),
        repo: document.getElementById('githubRepo').value.trim(),
        branch: document.getElementById('githubBranch').value.trim() || 'main',
        token: document.getElementById('githubToken').value.trim()
    };
    localStorage.setItem('blogBearGithub', JSON.stringify(settings));
    showToast('GitHub設定を保存しました', 'success');
}

// ===== GitHubからエピソード読み込み =====
async function loadEpisodesFromGithub() {
    const settings = JSON.parse(localStorage.getItem('blogBearGithub') || '{}');
    if (!settings.username || !settings.repo || !settings.token) {
        return;
    }
    
    try {
        const response = await fetch(
            `https://api.github.com/repos/${settings.username}/${settings.repo}/contents/radio.json?ref=${settings.branch}`,
            {
                headers: {
                    'Authorization': `token ${settings.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            const content = atob(data.content);
            episodes = JSON.parse(content);
            renderAdminEpisodes();
        }
    } catch (error) {
        console.log('GitHubからの読み込みエラー:', error);
    }
}

// ===== GitHubに保存 =====
async function pushToGithub(retryCount = 0) {
    const settings = JSON.parse(localStorage.getItem('blogBearGithub') || '{}');
    if (!settings.username || !settings.repo || !settings.token) {
        showToast('GitHub設定を入力してください', 'error');
        return false;
    }
    
    const { username, repo, branch, token } = settings;
    
    try {
        // 現在のファイルのSHAを取得
        let sha = null;
        const getResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/radio.json?ref=${branch}&t=${Date.now()}`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                },
                cache: 'no-store'
            }
        );
        
        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha;
        }
        
        // ファイルを更新/作成
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(episodes, null, 2))));
        const body = {
            message: '📻 Update radio episodes',
            content: content,
            branch: branch
        };
        if (sha) body.sha = sha;
        
        const pushResponse = await fetch(
            `https://api.github.com/repos/${username}/${repo}/contents/radio.json`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }
        );
        
        if (pushResponse.ok) {
            return true;
        } else if (pushResponse.status === 409 && retryCount < 3) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return pushToGithub(retryCount + 1);
        } else {
            const error = await pushResponse.json();
            console.error('GitHub push error:', error);
            showToast('GitHubへの保存に失敗しました', 'error');
            return false;
        }
    } catch (error) {
        console.error('GitHub error:', error);
        showToast('GitHubへの接続に失敗しました', 'error');
        return false;
    }
}

// ===== 自動同期 =====
function startAutoSync() {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => {
        if (pendingSync && !isSyncing) {
            performSync();
        }
    }, 10000);
}

function requestSync() {
    pendingSync = true;
    if (!isSyncing) {
        performSync();
    }
}

async function performSync() {
    if (isSyncing) return;
    
    const now = Date.now();
    if (now - lastSyncTime < 2000) {
        setTimeout(() => performSync(), 2000);
        return;
    }
    
    isSyncing = true;
    lastSyncTime = now;
    
    const success = await pushToGithub();
    
    isSyncing = false;
    
    if (success) {
        pendingSync = false;
        showToast('保存完了！', 'success');
    }
}

// ===== イベントリスナー =====
function initEventListeners() {
    // タブ切り替え
    document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // サムネイル
    document.getElementById('thumbnailPreview').addEventListener('click', () => {
        document.getElementById('thumbnailInput').click();
    });
    document.getElementById('thumbnailInput').addEventListener('change', handleThumbnailSelect);
    document.getElementById('removeThumbnail').addEventListener('click', () => {
        document.getElementById('thumbnailInput').value = '';
        document.getElementById('thumbnailPreview').innerHTML = '<span>クリックして画像を選択</span>';
        document.getElementById('removeThumbnail').style.display = 'none';
    });
    
    // トピック追加
    document.getElementById('topicInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTopic();
        }
    });
    document.getElementById('addTopicBtn').addEventListener('click', addTopic);
    
    // 公開・クリア
    document.getElementById('publishBtn').addEventListener('click', publishEpisode);
    document.getElementById('clearBtn').addEventListener('click', clearEditor);
    
    // 設定保存
    document.getElementById('saveGithubSettings').addEventListener('click', saveGithubSettings);
    document.getElementById('saveRadioSettings').addEventListener('click', saveRadioSettings);
    document.getElementById('refreshDataBtn').addEventListener('click', async () => {
        await loadEpisodesFromGithub();
        showToast('データを更新しました', 'success');
    });
    
    // 検索
    document.getElementById('adminSearchInput').addEventListener('input', renderAdminEpisodes);
}

// ===== タブ切り替え =====
function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-tab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.admin-section').forEach(section => section.style.display = 'none');
    document.getElementById(`${tab}Section`).style.display = 'block';
}

// ===== サムネイル選択 =====
function handleThumbnailSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const preview = document.getElementById('thumbnailPreview');
        preview.innerHTML = `<img src="${event.target.result}" alt="サムネイル">`;
        document.getElementById('removeThumbnail').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ===== トピック管理 =====
function addTopic() {
    const input = document.getElementById('topicInput');
    const topic = input.value.trim();
    
    if (!topic) return;
    if (topics.includes(topic)) {
        showToast('同じテーマが既にあります', 'error');
        return;
    }
    
    topics.push(topic);
    renderTopics();
    input.value = '';
    input.focus();
}

function removeTopic(index) {
    topics.splice(index, 1);
    renderTopics();
}

function renderTopics() {
    const list = document.getElementById('topicsList');
    list.innerHTML = topics.map((topic, index) => `
        <span class="topic-tag">
            ${escapeHtml(topic)}
            <button class="topic-remove" onclick="removeTopic(${index})">×</button>
        </span>
    `).join('');
}

// ===== エピソード公開 =====
async function publishEpisode() {
    const title = document.getElementById('episodeTitle').value.trim();
    const driveFileId = document.getElementById('driveFileId').value.trim();
    const duration = document.getElementById('episodeDuration').value.trim();
    const description = document.getElementById('episodeDescription').value.trim();
    const editingId = document.getElementById('editingId').value;
    
    if (!title) {
        showToast('タイトルを入力してください', 'error');
        return;
    }
    
    if (!driveFileId) {
        showToast('GoogleドライブファイルIDを入力してください', 'error');
        return;
    }
    
    // サムネイル取得
    let thumbnail = '';
    const thumbnailImg = document.getElementById('thumbnailPreview').querySelector('img');
    if (thumbnailImg) {
        thumbnail = thumbnailImg.src;
    }
    
    // エピソードデータ作成
    const episode = {
        id: editingId || Date.now().toString(),
        title,
        driveFileId,
        duration,
        description,
        topics: [...topics],
        thumbnail,
        createdAt: editingId ? (episodes.find(e => e.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // 既存エピソードの更新または新規追加
    if (editingId) {
        const index = episodes.findIndex(e => e.id === editingId);
        if (index !== -1) {
            episodes[index] = episode;
        }
    } else {
        episodes.unshift(episode);
    }
    
    // UIクリア
    showToast('エピソードを公開中...', 'success');
    clearEditor();
    renderAdminEpisodes();
    
    // GitHubに同期
    requestSync();
}

// ===== エディタクリア =====
function clearEditor() {
    document.getElementById('episodeTitle').value = '';
    document.getElementById('driveFileId').value = '';
    document.getElementById('episodeDuration').value = '';
    document.getElementById('episodeDescription').value = '';
    document.getElementById('editingId').value = '';
    document.getElementById('thumbnailInput').value = '';
    document.getElementById('thumbnailPreview').innerHTML = '<span>クリックして画像を選択</span>';
    document.getElementById('removeThumbnail').style.display = 'none';
    topics = [];
    renderTopics();
}

// ===== エピソード編集 =====
function editEpisode(id) {
    const episode = episodes.find(e => e.id === id);
    if (!episode) return;
    
    document.getElementById('episodeTitle').value = episode.title;
    document.getElementById('driveFileId').value = episode.driveFileId || '';
    document.getElementById('episodeDuration').value = episode.duration || '';
    document.getElementById('episodeDescription').value = episode.description || '';
    document.getElementById('editingId').value = episode.id;
    
    topics = episode.topics ? [...episode.topics] : [];
    renderTopics();
    
    if (episode.thumbnail) {
        document.getElementById('thumbnailPreview').innerHTML = `<img src="${episode.thumbnail}" alt="サムネイル">`;
        document.getElementById('removeThumbnail').style.display = 'block';
    }
    
    switchTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('エピソードを読み込みました', 'success');
}

// ===== エピソード削除 =====
async function deleteEpisode(id) {
    if (!confirm('このエピソードを削除しますか？')) return;
    
    episodes = episodes.filter(e => e.id !== id);
    renderAdminEpisodes();
    showToast('エピソードを削除中...', 'success');
    requestSync();
}

// ===== エピソード一覧表示 =====
function renderAdminEpisodes() {
    const list = document.getElementById('adminEpisodesList');
    const searchQuery = document.getElementById('adminSearchInput').value.toLowerCase();
    
    let filteredEpisodes = episodes;
    if (searchQuery) {
        filteredEpisodes = episodes.filter(e => 
            e.title.toLowerCase().includes(searchQuery) ||
            (e.description && e.description.toLowerCase().includes(searchQuery)) ||
            (e.topics && e.topics.some(t => t.toLowerCase().includes(searchQuery)))
        );
    }
    
    if (filteredEpisodes.length === 0) {
        list.innerHTML = `
            <div class="episodes-empty">
                <div class="episodes-empty-icon">📻</div>
                <p>エピソードがありません</p>
            </div>
        `;
        return;
    }
    
    // 新しい順にソート
    const sortedEpisodes = [...filteredEpisodes].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    list.innerHTML = sortedEpisodes.map((episode, index) => {
        const episodeNumber = sortedEpisodes.length - index;
        
        let thumbHtml = '';
        if (episode.thumbnail) {
            thumbHtml = `<img src="${episode.thumbnail}" alt="" class="admin-episode-thumb">`;
        } else {
            thumbHtml = `<div class="admin-episode-thumb-placeholder">🎙️</div>`;
        }
        
        let topicsHtml = '';
        if (episode.topics && episode.topics.length > 0) {
            topicsHtml = `
                <div class="admin-episode-topics">
                    ${episode.topics.map(t => `<span class="admin-episode-topic">${escapeHtml(t)}</span>`).join('')}
                </div>
            `;
        }
        
        return `
            <div class="admin-episode-item">
                ${thumbHtml}
                <div class="admin-episode-info">
                    <h3>EP.${episodeNumber} ${escapeHtml(episode.title)}</h3>
                    <div class="admin-episode-meta">
                        <span>📅 ${formatDate(episode.createdAt)}</span>
                        ${episode.duration ? `<span>⏱️ ${episode.duration}</span>` : ''}
                    </div>
                    ${topicsHtml}
                </div>
                <div class="admin-episode-actions">
                    <button class="btn-secondary" onclick="editEpisode('${episode.id}')">✏️ 編集</button>
                    <button class="btn-danger" onclick="deleteEpisode('${episode.id}')">🗑️ 削除</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ラジオ設定保存 =====
function saveRadioSettings() {
    // 将来的にradio.htmlの設定を変更できるようにする
    showToast('設定を保存しました', 'success');
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
    return `${year}/${month}/${day}`;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
