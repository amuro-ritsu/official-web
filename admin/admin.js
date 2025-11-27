// ===== Blog Bear Admin =====

let articles = [];
let currentSha = null;
let configSha = null;
let settingsSha = null;

// 同期制御
let isSyncing = false;
let lastSyncTime = 0;
let pendingSync = false;
let autoSyncInterval = null;

// サイト設定
let siteSettings = {
    headerBanner: {
        image: '',
        video: '',
        title: 'Blog Bear',
        titleUrl: '',
        subtitle: 'GitHubで更新できるブログ',
        showText: true
    },
    profile: {
        name: '',
        bio: '',
        icon: '',
        links: []
    },
    categories: [
        { name: '日記', icon: '📝' },
        { name: 'お知らせ', icon: '📢' },
        { name: '技術', icon: '💻' },
        { name: 'レビュー', icon: '⭐' },
        { name: '趣味', icon: '🎮' },
        { name: 'その他', icon: '📌' }
    ]
};

// GitHub設定
let githubConfig = {
    repo: '',
    branch: 'main',
    token: ''
};

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    loadGithubSettings();
    loadProfileSettings();
    loadBannerSettings();
    loadCategorySettings();
    initEventListeners();
    syncWithGithub();
    startAutoSync();
});

// ===== 自動同期開始 =====
function startAutoSync() {
    // 10秒ごとに自動同期
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    autoSyncInterval = setInterval(() => {
        if (pendingSync && !isSyncing) {
            performSync();
        }
    }, 10000);
}

// ===== 同期リクエスト =====
function requestSync() {
    pendingSync = true;
    // すぐに同期を試みる
    if (!isSyncing) {
        performSync();
    }
}

// ===== 同期実行 =====
async function performSync() {
    if (isSyncing) return;
    
    // 前回の同期から2秒以内なら少し待つ
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
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // エディタモード切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            switchEditorMode(mode);
        });
    });
    
    // ツールバーボタン
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            applyMarkdown(action);
        });
    });
    
    // サムネイル選択
    document.getElementById('thumbnailPreview').addEventListener('click', () => {
        document.getElementById('thumbnailInput').click();
    });
    
    document.getElementById('thumbnailInput').addEventListener('change', handleThumbnailSelect);
    
    document.getElementById('removeThumbnail').addEventListener('click', () => {
        document.getElementById('thumbnailInput').value = '';
        document.getElementById('thumbnailPreview').innerHTML = '<span>クリックして画像を選択</span>';
        document.getElementById('removeThumbnail').style.display = 'none';
    });
    
    // 公開ボタン
    document.getElementById('publishBtn').addEventListener('click', publishArticle);
    
    // プレビューボタン
    document.getElementById('previewBtn').addEventListener('click', showPreviewModal);
    
    // クリアボタン
    document.getElementById('clearBtn').addEventListener('click', clearEditor);
    
    // プレビューモーダル
    document.getElementById('previewClose').addEventListener('click', closePreviewModal);
    document.querySelector('#previewModal .modal-overlay').addEventListener('click', closePreviewModal);
    
    // 設定保存
    document.getElementById('saveGithubSettings').addEventListener('click', saveGithubSettings);
    document.getElementById('saveProfileSettings').addEventListener('click', saveProfileSettings);
    document.getElementById('saveSocialLinks').addEventListener('click', saveSocialLinks);
    document.getElementById('saveBannerSettings').addEventListener('click', saveBannerSettings);
    document.getElementById('saveCategorySettings').addEventListener('click', saveCategorySettings);
    
    // カテゴリ追加
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('newCategoryName').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCategory();
    });
    
    // ヘッダーバナー
    document.getElementById('bannerPreview').addEventListener('click', () => {
        document.getElementById('bannerInput').click();
    });
    document.getElementById('bannerInput').addEventListener('change', handleBannerSelect);
    document.getElementById('removeBanner').addEventListener('click', removeBanner);
    
    // ヘッダービデオ
    document.getElementById('videoPreview').addEventListener('click', () => {
        document.getElementById('videoInput').click();
    });
    document.getElementById('videoInput').addEventListener('change', handleVideoSelect);
    document.getElementById('removeVideo').addEventListener('click', removeVideo);
    
    // プロフィールアイコン
    document.getElementById('selectProfileIcon').addEventListener('click', () => {
        document.getElementById('profileIconInput').click();
    });
    document.getElementById('profileIconInput').addEventListener('change', handleProfileIconSelect);
    
    // ソーシャルリンク追加
    document.getElementById('addSocialLink').addEventListener('click', addSocialLinkField);
    
    // データエクスポート/インポート
    document.getElementById('exportData').addEventListener('click', exportData);
    document.getElementById('importData').addEventListener('click', () => {
        document.getElementById('importInput').click();
    });
    document.getElementById('importInput').addEventListener('change', importData);
    
    // 同期ボタン
    document.getElementById('syncNow').addEventListener('click', syncWithGithub);
    
    // 検索（記事一覧）
    document.getElementById('adminSearchInput').addEventListener('input', renderAdminArticles);
    document.getElementById('filterCategory').addEventListener('change', renderAdminArticles);
    document.getElementById('filterStatus').addEventListener('change', renderAdminArticles);
    
    // リアルタイムプレビュー
    document.getElementById('articleContent').addEventListener('input', updateLivePreview);
}

// ===== タブ切り替え =====
function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.getElementById('editorSection').style.display = tab === 'editor' ? 'block' : 'none';
    document.getElementById('articlesSection').style.display = tab === 'articles' ? 'block' : 'none';
    document.getElementById('settingsSection').style.display = tab === 'settings' ? 'block' : 'none';
    
    if (tab === 'articles') {
        renderAdminArticles();
    }
    
    if (tab === 'settings') {
        loadSocialLinks();
    }
}

// ===== エディタモード切り替え =====
function switchEditorMode(mode) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const textarea = document.getElementById('articleContent');
    const preview = document.getElementById('previewPane');
    
    if (mode === 'write') {
        textarea.style.display = 'block';
        preview.style.display = 'none';
        textarea.style.flex = '1';
    } else if (mode === 'preview') {
        textarea.style.display = 'none';
        preview.style.display = 'block';
        preview.style.flex = '1';
        updateLivePreview();
    } else if (mode === 'split') {
        textarea.style.display = 'block';
        preview.style.display = 'block';
        textarea.style.flex = '1';
        preview.style.flex = '1';
        updateLivePreview();
    }
}

// ===== リアルタイムプレビュー更新 =====
function updateLivePreview() {
    const content = document.getElementById('articleContent').value;
    const preview = document.getElementById('previewPane');
    preview.innerHTML = marked.parse(content);
}

// ===== Markdown適用 =====
function applyMarkdown(action) {
    const textarea = document.getElementById('articleContent');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let before = '';
    let after = '';
    let placeholder = '';
    
    switch (action) {
        case 'h2':
            before = '## ';
            placeholder = '見出し2';
            break;
        case 'h3':
            before = '### ';
            placeholder = '見出し3';
            break;
        case 'bold':
            before = '**';
            after = '**';
            placeholder = '太字テキスト';
            break;
        case 'italic':
            before = '*';
            after = '*';
            placeholder = '斜体テキスト';
            break;
        case 'code':
            if (selectedText.includes('\n')) {
                before = '```\n';
                after = '\n```';
                placeholder = 'コードブロック';
            } else {
                before = '`';
                after = '`';
                placeholder = 'コード';
            }
            break;
        case 'link':
            before = '[';
            after = '](URL)';
            placeholder = 'リンクテキスト';
            break;
        case 'image':
            before = '![';
            after = '](画像URL)';
            placeholder = '画像の説明';
            break;
        case 'list':
            before = '- ';
            placeholder = 'リスト項目';
            break;
        case 'quote':
            before = '> ';
            placeholder = '引用文';
            break;
    }
    
    const insertText = selectedText || placeholder;
    const newText = textarea.value.substring(0, start) + before + insertText + after + textarea.value.substring(end);
    
    textarea.value = newText;
    textarea.focus();
    textarea.setSelectionRange(start + before.length, start + before.length + insertText.length);
    
    updateLivePreview();
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

// ===== 記事公開 =====
async function publishArticle() {
    const title = document.getElementById('articleTitle').value.trim();
    const content = document.getElementById('articleContent').value.trim();
    const category = document.getElementById('articleCategory').value;
    const tagsInput = document.getElementById('articleTags').value;
    const isDraft = document.getElementById('isDraft').checked;
    const editingId = document.getElementById('editingId').value;
    
    if (!title) {
        showToast('タイトルを入力してください', 'error');
        return;
    }
    
    if (!content) {
        showToast('本文を入力してください', 'error');
        return;
    }
    
    // タグをパース
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    
    // サムネイル取得
    let thumbnail = '';
    const thumbnailPreview = document.getElementById('thumbnailPreview').querySelector('img');
    if (thumbnailPreview) {
        thumbnail = thumbnailPreview.src;
    }
    
    // 記事データ作成
    const article = {
        id: editingId || Date.now().toString(),
        title,
        content,
        category,
        tags,
        thumbnail,
        isDraft,
        createdAt: editingId ? (articles.find(a => a.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // 既存記事の更新または新規追加
    if (editingId) {
        const index = articles.findIndex(a => a.id === editingId);
        if (index !== -1) {
            articles[index] = article;
        }
    } else {
        articles.unshift(article);
    }
    
    // 即座にUIをクリア（ユーザー体験向上）
    showToast(isDraft ? '下書きを保存中...' : '記事を公開中...', 'success');
    clearEditor();
    
    // バックグラウンドでGitHubに同期
    requestSync();
}

// ===== エディタクリア =====
function clearEditor() {
    document.getElementById('articleTitle').value = '';
    document.getElementById('articleContent').value = '';
    document.getElementById('articleCategory').value = '日記';
    document.getElementById('articleTags').value = '';
    document.getElementById('isDraft').checked = false;
    document.getElementById('editingId').value = '';
    document.getElementById('thumbnailInput').value = '';
    document.getElementById('thumbnailPreview').innerHTML = '<span>クリックして画像を選択</span>';
    document.getElementById('removeThumbnail').style.display = 'none';
    document.getElementById('previewPane').innerHTML = '';
}

// ===== 記事編集 =====
function editArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    
    document.getElementById('articleTitle').value = article.title;
    document.getElementById('articleContent').value = article.content;
    document.getElementById('articleCategory').value = article.category;
    document.getElementById('articleTags').value = (article.tags || []).join(', ');
    document.getElementById('isDraft').checked = article.isDraft || false;
    document.getElementById('editingId').value = article.id;
    
    if (article.thumbnail) {
        document.getElementById('thumbnailPreview').innerHTML = `<img src="${article.thumbnail}" alt="サムネイル">`;
        document.getElementById('removeThumbnail').style.display = 'block';
    }
    
    switchTab('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('記事を読み込みました', 'success');
}

// ===== 記事削除 =====
async function deleteArticle(id) {
    if (!confirm('この記事を削除しますか？')) return;
    
    articles = articles.filter(a => a.id !== id);
    
    // 即座にUI更新
    renderAdminArticles();
    showToast('記事を削除中...', 'success');
    
    // バックグラウンドで同期
    requestSync();
}

// ===== プレビューモーダル =====
function showPreviewModal() {
    const title = document.getElementById('articleTitle').value || '（タイトルなし）';
    const content = document.getElementById('articleContent').value;
    const category = document.getElementById('articleCategory').value;
    const tagsInput = document.getElementById('articleTags').value;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    
    const categoryIcons = {
        '日記': '📝',
        'お知らせ': '📢',
        '技術': '💻',
        'レビュー': '⭐',
        '趣味': '🎮',
        'その他': '📌'
    };
    
    const categoryIcon = categoryIcons[category] || '📁';
    const contentHtml = marked.parse(content);
    
    let tagsHtml = '';
    if (tags.length > 0) {
        tagsHtml = `
            <div class="article-detail-tags">
                ${tags.map(tag => `<span class="article-tag">#${tag}</span>`).join('')}
            </div>
        `;
    }
    
    let thumbnailHtml = '';
    const thumbnailPreview = document.getElementById('thumbnailPreview').querySelector('img');
    if (thumbnailPreview) {
        thumbnailHtml = `<img src="${thumbnailPreview.src}" alt="${title}" class="article-detail-thumbnail">`;
    }
    
    document.getElementById('previewDetail').innerHTML = `
        <div class="article-detail-header">
            <span class="article-detail-category">${categoryIcon} ${category}</span>
            <h1 class="article-detail-title">${title}</h1>
            <div class="article-detail-meta">
                <span class="article-date">📅 ${new Date().toLocaleDateString('ja-JP')}</span>
            </div>
        </div>
        ${thumbnailHtml}
        <div class="article-detail-content">
            ${contentHtml}
        </div>
        ${tagsHtml}
    `;
    
    document.getElementById('previewModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== 記事一覧表示（管理画面） =====
function renderAdminArticles() {
    const searchQuery = document.getElementById('adminSearchInput').value.toLowerCase();
    const filterCategory = document.getElementById('filterCategory').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    // カテゴリフィルタのオプションを更新
    const categorySelect = document.getElementById('filterCategory');
    const categories = [...new Set(articles.map(a => a.category))];
    const currentValue = categorySelect.value;
    
    categorySelect.innerHTML = '<option value="">すべてのカテゴリ</option>';
    categories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat}" ${cat === currentValue ? 'selected' : ''}>${cat}</option>`;
    });
    
    // フィルタリング
    let filteredArticles = articles.filter(article => {
        if (filterCategory && article.category !== filterCategory) return false;
        if (filterStatus === 'published' && article.isDraft) return false;
        if (filterStatus === 'draft' && !article.isDraft) return false;
        if (searchQuery) {
            const matchTitle = article.title.toLowerCase().includes(searchQuery);
            const matchContent = article.content.toLowerCase().includes(searchQuery);
            if (!matchTitle && !matchContent) return false;
        }
        return true;
    });
    
    const list = document.getElementById('adminArticlesList');
    
    if (filteredArticles.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🐻</div>
                <p class="empty-state-text">記事がありません</p>
            </div>
        `;
        return;
    }
    
    const categoryIcons = {
        '日記': '📝',
        'お知らせ': '📢',
        '技術': '💻',
        'レビュー': '⭐',
        '趣味': '🎮',
        'その他': '📌'
    };
    
    list.innerHTML = filteredArticles.map(article => {
        const categoryIcon = categoryIcons[article.category] || '📁';
        const statusClass = article.isDraft ? 'draft' : 'published';
        const statusText = article.isDraft ? '下書き' : '公開中';
        
        let thumbHtml;
        if (article.thumbnail) {
            thumbHtml = `<img src="${article.thumbnail}" alt="${article.title}" class="admin-article-thumb">`;
        } else {
            thumbHtml = `<div class="admin-article-thumb no-image">${categoryIcon}</div>`;
        }
        
        return `
            <div class="admin-article-item">
                ${thumbHtml}
                <div class="admin-article-info">
                    <h3>${article.title}</h3>
                    <div class="admin-article-meta">
                        <span>${categoryIcon} ${article.category}</span>
                        <span>📅 ${formatDate(article.createdAt)}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <div class="admin-article-actions">
                    <button class="action-btn" onclick="editArticle('${article.id}')" title="編集">✏️</button>
                    <button class="action-btn delete" onclick="deleteArticle('${article.id}')" title="削除">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ヘッダーバナー設定 =====
function loadBannerSettings() {
    const saved = localStorage.getItem('blogBearBannerSettings');
    if (saved) {
        const banner = JSON.parse(saved);
        // 画像・動画以外の設定を読み込み
        siteSettings.headerBanner.title = banner.title || 'Blog Bear';
        siteSettings.headerBanner.titleUrl = banner.titleUrl || '';
        siteSettings.headerBanner.subtitle = banner.subtitle || 'GitHubで更新できるブログ';
        siteSettings.headerBanner.showText = banner.showText !== false;
        
        document.getElementById('showBannerText').checked = siteSettings.headerBanner.showText;
        document.getElementById('bannerTitle').value = siteSettings.headerBanner.title;
        document.getElementById('bannerTitleUrl').value = siteSettings.headerBanner.titleUrl;
        document.getElementById('bannerSubtitle').value = siteSettings.headerBanner.subtitle;
    }
}

function handleBannerSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // ファイルサイズチェック（5MB以下推奨）
    if (file.size > 5 * 1024 * 1024) {
        showToast('画像サイズは5MB以下を推奨します', 'error');
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        // 画像をリサイズして圧縮
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxWidth = 1600;
            const maxHeight = 500;
            
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressedImage = canvas.toDataURL('image/jpeg', 0.85);
            
            document.getElementById('bannerPreview').innerHTML = `<img src="${compressedImage}" alt="ヘッダー">`;
            document.getElementById('removeBanner').style.display = 'block';
            
            siteSettings.headerBanner.image = compressedImage;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function removeBanner() {
    document.getElementById('bannerInput').value = '';
    document.getElementById('bannerPreview').innerHTML = '<span>クリックして画像を選択（推奨: 1200×300px以上）</span>';
    document.getElementById('removeBanner').style.display = 'none';
    siteSettings.headerBanner.image = '';
}

// ===== ヘッダービデオ =====
function handleVideoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // ファイルサイズチェック（10MB以下推奨）
    if (file.size > 10 * 1024 * 1024) {
        showToast('動画サイズは10MB以下を推奨します。GitHubにpushできない可能性があります。', 'error');
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const videoPreview = document.getElementById('videoPreview');
        videoPreview.innerHTML = `
            <video muted loop playsinline autoplay>
                <source src="${event.target.result}" type="${file.type}">
            </video>
        `;
        document.getElementById('removeVideo').style.display = 'block';
        
        siteSettings.headerBanner.video = event.target.result;
    };
    reader.readAsDataURL(file);
}

function removeVideo() {
    document.getElementById('videoInput').value = '';
    document.getElementById('videoPreview').innerHTML = '<span>クリックして動画を選択（WebM/MP4、10MB以下推奨）</span>';
    document.getElementById('removeVideo').style.display = 'none';
    siteSettings.headerBanner.video = '';
}

async function saveBannerSettings() {
    siteSettings.headerBanner.title = document.getElementById('bannerTitle').value.trim();
    siteSettings.headerBanner.titleUrl = document.getElementById('bannerTitleUrl').value.trim();
    siteSettings.headerBanner.subtitle = document.getElementById('bannerSubtitle').value.trim();
    siteSettings.headerBanner.showText = document.getElementById('showBannerText').checked;
    
    // ローカル保存（画像・動画は除外して保存）
    localStorage.setItem('blogBearBannerSettings', JSON.stringify({
        title: siteSettings.headerBanner.title,
        titleUrl: siteSettings.headerBanner.titleUrl,
        subtitle: siteSettings.headerBanner.subtitle,
        showText: siteSettings.headerBanner.showText
    }));
    
    // GitHubにpush
    const success = await pushSiteSettings();
    
    if (success) {
        showToast('ヘッダーバナー設定を保存しました', 'success');
    }
}

// ===== サイト設定をGitHubにpush =====
async function pushSiteSettings() {
    if (!githubConfig.repo || !githubConfig.token) {
        showToast('GitHub設定が必要です', 'error');
        return false;
    }
    
    try {
        // 最新のSHAを取得（ファイルが存在する場合）
        let currentSettingsSha = null;
        
        const getResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/site-settings.json?ref=${githubConfig.branch}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (getResponse.ok) {
            const getData = await getResponse.json();
            currentSettingsSha = getData.sha;
        }
        // 404の場合は新規作成なのでSHAは不要
        
        // プロフィール設定を統合
        const profile = JSON.parse(localStorage.getItem('blogBearProfile') || '{}');
        const socialLinks = JSON.parse(localStorage.getItem('blogBearSocialLinks') || '[]');
        
        siteSettings.profile = {
            name: profile.name || '',
            bio: profile.bio || '',
            icon: profile.icon || '',
            links: socialLinks
        };
        
        // データをBase64エンコード
        const content = JSON.stringify(siteSettings, null, 2);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(content);
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        const base64Content = btoa(binary);
        
        // プッシュ
        const pushBody = {
            message: '🖼️ Update site settings',
            content: base64Content,
            branch: githubConfig.branch
        };
        
        // ファイルが存在する場合のみSHAを追加
        if (currentSettingsSha) {
            pushBody.sha = currentSettingsSha;
        }
        
        const pushResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/site-settings.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pushBody)
        });
        
        if (pushResponse.ok) {
            const pushData = await pushResponse.json();
            settingsSha = pushData.content.sha;
            return true;
        } else {
            const errorData = await pushResponse.json();
            console.error('Push failed:', errorData);
            throw new Error(errorData.message || 'プッシュ失敗');
        }
    } catch (error) {
        console.error('Site settings push error:', error);
        showToast(`設定の保存に失敗しました: ${error.message}`, 'error');
        return false;
    }
}

// ===== カテゴリ管理 =====
function loadCategorySettings() {
    const saved = localStorage.getItem('blogBearCategories');
    if (saved) {
        siteSettings.categories = JSON.parse(saved);
    }
    renderCategoryList();
    updateCategorySelect();
}

function renderCategoryList() {
    const container = document.getElementById('categoryListManager');
    if (!container) return;
    
    if (siteSettings.categories.length === 0) {
        container.innerHTML = '<div class="category-empty">カテゴリがありません</div>';
        return;
    }
    
    // 各カテゴリの記事数をカウント
    const categoryCounts = {};
    articles.forEach(article => {
        const cat = article.category || 'その他';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    container.innerHTML = siteSettings.categories.map((cat, index) => `
        <div class="category-item-manager">
            <span class="category-item-icon">${cat.icon}</span>
            <span class="category-item-name">${cat.name}</span>
            <span class="category-item-count">${categoryCounts[cat.name] || 0}件</span>
            <button class="category-item-remove" onclick="removeCategory(${index})" title="削除">×</button>
        </div>
    `).join('');
}

function addCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const iconInput = document.getElementById('newCategoryIcon');
    
    const name = nameInput.value.trim();
    const icon = iconInput.value.trim() || '📁';
    
    if (!name) {
        showToast('カテゴリ名を入力してください', 'error');
        return;
    }
    
    // 重複チェック
    if (siteSettings.categories.some(c => c.name === name)) {
        showToast('同じ名前のカテゴリが既にあります', 'error');
        return;
    }
    
    siteSettings.categories.push({ name, icon });
    
    nameInput.value = '';
    iconInput.value = '';
    
    renderCategoryList();
    updateCategorySelect();
    showToast(`カテゴリ「${name}」を追加しました`, 'success');
}

function removeCategory(index) {
    const category = siteSettings.categories[index];
    
    // このカテゴリを使っている記事があるか確認
    const usingArticles = articles.filter(a => a.category === category.name);
    
    if (usingArticles.length > 0) {
        if (!confirm(`「${category.name}」は${usingArticles.length}件の記事で使用されています。削除すると、これらの記事のカテゴリは「その他」に変更されます。削除しますか？`)) {
            return;
        }
        // 使用中の記事のカテゴリを「その他」に変更
        usingArticles.forEach(article => {
            article.category = 'その他';
        });
    }
    
    siteSettings.categories.splice(index, 1);
    renderCategoryList();
    updateCategorySelect();
    showToast(`カテゴリ「${category.name}」を削除しました`, 'success');
}

function updateCategorySelect() {
    const select = document.getElementById('articleCategory');
    if (!select) return;
    
    select.innerHTML = siteSettings.categories.map(cat => 
        `<option value="${cat.name}">${cat.icon} ${cat.name}</option>`
    ).join('');
}

async function saveCategorySettings() {
    localStorage.setItem('blogBearCategories', JSON.stringify(siteSettings.categories));
    
    // 記事のカテゴリ変更があった場合も保存
    const success = await pushToGithub();
    const settingsSuccess = await pushSiteSettings();
    
    if (success && settingsSuccess) {
        showToast('カテゴリ設定を保存しました', 'success');
    }
}

// ===== GitHub設定 =====
function loadGithubSettings() {
    const saved = localStorage.getItem('blogBearGithubConfig');
    if (saved) {
        githubConfig = JSON.parse(saved);
        document.getElementById('githubRepo').value = githubConfig.repo || '';
        document.getElementById('githubBranch').value = githubConfig.branch || 'main';
        document.getElementById('githubToken').value = githubConfig.token || '';
    }
}

function saveGithubSettings() {
    githubConfig.repo = document.getElementById('githubRepo').value.trim();
    githubConfig.branch = document.getElementById('githubBranch').value.trim() || 'main';
    githubConfig.token = document.getElementById('githubToken').value.trim();
    
    localStorage.setItem('blogBearGithubConfig', JSON.stringify(githubConfig));
    showToast('GitHub設定を保存しました', 'success');
    
    syncWithGithub();
}

// ===== プロフィール設定 =====
function loadProfileSettings() {
    const saved = localStorage.getItem('blogBearProfile');
    if (saved) {
        const profile = JSON.parse(saved);
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileBio').value = profile.bio || '';
        if (profile.icon) {
            document.getElementById('profileIconPreview').innerHTML = `<img src="${profile.icon}" alt="アイコン">`;
        }
    }
}

function saveProfileSettings() {
    const profile = {
        name: document.getElementById('profileName').value.trim(),
        bio: document.getElementById('profileBio').value.trim(),
        icon: document.getElementById('profileIconPreview').querySelector('img')?.src || '../default-icon.png'
    };
    
    localStorage.setItem('blogBearProfile', JSON.stringify(profile));
    
    // サイト設定も更新
    siteSettings.profile.name = profile.name;
    siteSettings.profile.bio = profile.bio;
    siteSettings.profile.icon = profile.icon;
    
    pushSiteSettings().then(success => {
        if (success) {
            showToast('プロフィール設定を保存しました', 'success');
        }
    });
}

function handleProfileIconSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('profileIconPreview').innerHTML = `<img src="${event.target.result}" alt="アイコン">`;
    };
    reader.readAsDataURL(file);
}

// ===== ソーシャルリンク =====
function loadSocialLinks() {
    const saved = localStorage.getItem('blogBearSocialLinks');
    const links = saved ? JSON.parse(saved) : [];
    
    const container = document.getElementById('socialLinks');
    container.innerHTML = '';
    
    links.forEach((link, index) => {
        addSocialLinkField(link.icon, link.name, link.url);
    });
}

function addSocialLinkField(icon = '', name = '', url = '') {
    const container = document.getElementById('socialLinks');
    const div = document.createElement('div');
    div.className = 'social-link-item';
    div.innerHTML = `
        <input type="text" placeholder="絵文字" value="${icon}" class="social-icon">
        <input type="text" placeholder="名前" value="${name}" class="social-name">
        <input type="text" placeholder="URL" value="${url}" class="social-url">
        <button class="remove-social-btn" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(div);
}

function saveSocialLinks() {
    const items = document.querySelectorAll('.social-link-item');
    const links = [];
    
    items.forEach(item => {
        const icon = item.querySelector('.social-icon').value.trim();
        const name = item.querySelector('.social-name').value.trim();
        const url = item.querySelector('.social-url').value.trim();
        
        if (name && url) {
            links.push({ icon: icon || '🔗', name, url });
        }
    });
    
    localStorage.setItem('blogBearSocialLinks', JSON.stringify(links));
    
    // サイト設定も更新
    siteSettings.profile.links = links;
    
    pushSiteSettings().then(success => {
        if (success) {
            showToast('ソーシャルリンクを保存しました', 'success');
        }
    });
}

// ===== GitHubと同期 =====
async function syncWithGithub() {
    updateSyncStatus('syncing', '同期中...');
    
    if (!githubConfig.repo || !githubConfig.token) {
        updateSyncStatus('error', 'GitHub設定が必要です');
        return;
    }
    
    try {
        // 記事データを読み込み
        const response = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/articles.json?ref=${githubConfig.branch}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentSha = data.sha;
            
            // Base64デコード（UTF-8対応）
            const base64Content = data.content.replace(/\n/g, '');
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(bytes);
            const content = JSON.parse(jsonString);
            
            articles = content.articles || [];
            articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (response.status === 404) {
            articles = [];
            currentSha = null;
        } else {
            throw new Error('同期失敗');
        }
        
        // サイト設定も読み込み
        await syncSiteSettings();
        
        updateSyncStatus('synced', `同期完了（${articles.length}件）`);
    } catch (error) {
        console.error('同期エラー:', error);
        updateSyncStatus('error', '同期に失敗しました');
    }
}

// ===== サイト設定を同期 =====
async function syncSiteSettings() {
    try {
        const response = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/site-settings.json?ref=${githubConfig.branch}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            settingsSha = data.sha;
            
            const base64Content = data.content.replace(/\n/g, '');
            const binaryString = atob(base64Content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder('utf-8');
            const jsonString = decoder.decode(bytes);
            const settings = JSON.parse(jsonString);
            
            siteSettings = { ...siteSettings, ...settings };
            
            // UIに反映
            if (siteSettings.headerBanner) {
                if (siteSettings.headerBanner.image) {
                    document.getElementById('bannerPreview').innerHTML = `<img src="${siteSettings.headerBanner.image}" alt="ヘッダー">`;
                    document.getElementById('removeBanner').style.display = 'block';
                }
                if (siteSettings.headerBanner.video) {
                    document.getElementById('videoPreview').innerHTML = `
                        <video muted loop playsinline autoplay>
                            <source src="${siteSettings.headerBanner.video}">
                        </video>
                    `;
                    document.getElementById('removeVideo').style.display = 'block';
                }
                document.getElementById('showBannerText').checked = siteSettings.headerBanner.showText !== false;
                document.getElementById('bannerTitle').value = siteSettings.headerBanner.title || '';
                document.getElementById('bannerTitleUrl').value = siteSettings.headerBanner.titleUrl || '';
                document.getElementById('bannerSubtitle').value = siteSettings.headerBanner.subtitle || '';
                
                // localStorageには画像・動画を除外して保存（容量制限対策）
                localStorage.setItem('blogBearBannerSettings', JSON.stringify({
                    title: siteSettings.headerBanner.title || '',
                    titleUrl: siteSettings.headerBanner.titleUrl || '',
                    subtitle: siteSettings.headerBanner.subtitle || '',
                    showText: siteSettings.headerBanner.showText
                }));
            }
            
            if (siteSettings.profile) {
                if (siteSettings.profile.name) {
                    document.getElementById('profileName').value = siteSettings.profile.name;
                }
                if (siteSettings.profile.bio) {
                    document.getElementById('profileBio').value = siteSettings.profile.bio;
                }
                if (siteSettings.profile.icon) {
                    document.getElementById('profileIconPreview').innerHTML = `<img src="${siteSettings.profile.icon}" alt="アイコン">`;
                }
                
                localStorage.setItem('blogBearProfile', JSON.stringify({
                    name: siteSettings.profile.name,
                    bio: siteSettings.profile.bio,
                    icon: siteSettings.profile.icon
                }));
                
                if (siteSettings.profile.links) {
                    localStorage.setItem('blogBearSocialLinks', JSON.stringify(siteSettings.profile.links));
                }
            }
            
            // カテゴリを反映
            if (siteSettings.categories) {
                localStorage.setItem('blogBearCategories', JSON.stringify(siteSettings.categories));
                renderCategoryList();
                updateCategorySelect();
            }
        }
    } catch (error) {
        console.log('サイト設定の同期をスキップ:', error);
    }
}

// ===== GitHubにプッシュ =====
async function pushToGithub(retryCount = 0) {
    if (!githubConfig.repo || !githubConfig.token) {
        showToast('GitHub設定が必要です', 'error');
        return false;
    }
    
    updateSyncStatus('syncing', '保存中...');
    
    try {
        // 最新のSHAを取得（毎回取得して競合を防ぐ）
        const getResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/articles.json?ref=${githubConfig.branch}&t=${Date.now()}`, {
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            cache: 'no-store'
        });
        
        let latestSha = null;
        if (getResponse.ok) {
            const getData = await getResponse.json();
            latestSha = getData.sha;
        }
        // 404の場合は新規作成なのでSHAは不要
        
        // データをBase64エンコード
        const content = JSON.stringify({ articles }, null, 2);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(content);
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        const base64Content = btoa(binary);
        
        // プッシュボディ作成
        const pushBody = {
            message: '📝 Update articles',
            content: base64Content,
            branch: githubConfig.branch
        };
        
        // SHAがある場合のみ追加
        if (latestSha) {
            pushBody.sha = latestSha;
        }
        
        // プッシュ
        const pushResponse = await fetch(`https://api.github.com/repos/${githubConfig.repo}/contents/articles.json`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${githubConfig.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pushBody)
        });
        
        if (pushResponse.ok) {
            const pushData = await pushResponse.json();
            currentSha = pushData.content.sha;
            updateSyncStatus('synced', '保存完了');
            return true;
        } else if (pushResponse.status === 409 && retryCount < 3) {
            // 409 Conflictの場合はリトライ
            console.log(`409 Conflict - リトライ中... (${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, 500));
            return pushToGithub(retryCount + 1);
        } else {
            const errorData = await pushResponse.json();
            throw new Error(errorData.message || 'プッシュ失敗');
        }
    } catch (error) {
        console.error('GitHub push error:', error);
        showToast(`保存に失敗しました: ${error.message}`, 'error');
        updateSyncStatus('error', '保存に失敗');
        return false;
    }
}

// ===== 同期ステータス更新 =====
function updateSyncStatus(status, text) {
    const indicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    
    indicator.className = 'status-indicator ' + status;
    statusText.textContent = text;
}

// ===== データエクスポート =====
function exportData() {
    const data = {
        articles,
        profile: JSON.parse(localStorage.getItem('blogBearProfile') || '{}'),
        socialLinks: JSON.parse(localStorage.getItem('blogBearSocialLinks') || '[]'),
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blog-bear-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('データをエクスポートしました', 'success');
}

// ===== データインポート =====
function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            if (data.articles) {
                articles = data.articles;
            }
            if (data.profile) {
                localStorage.setItem('blogBearProfile', JSON.stringify(data.profile));
                loadProfileSettings();
            }
            if (data.socialLinks) {
                localStorage.setItem('blogBearSocialLinks', JSON.stringify(data.socialLinks));
                loadSocialLinks();
            }
            
            await pushToGithub();
            showToast('データをインポートしました', 'success');
        } catch (error) {
            showToast('インポートに失敗しました', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ===== ユーティリティ =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
