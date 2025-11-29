// ===== Blog Bear Viewer =====

let articles = [];
let currentPage = 1;
let currentCategory = null;
let searchQuery = '';
let reactionsData = {}; // リアクションデータのキャッシュ

// ===== LINE友だち追加URL（ここを変更してください） =====
const LINE_ADD_FRIEND_URL = 'https://lin.ee/I4nooXy';

// ===== リアクションの種類（Post-Bearと同じスタンプを使用） =====
const REACTIONS = [
    { emoji: 'iine', name: 'いいね', image: 'stamps/iine.png' },
    { emoji: 'suki', name: 'すき', image: 'stamps/suki.png' },
    { emoji: 'omedetou', name: 'おめでと', image: 'stamps/omedetou.png' },
    { emoji: 'gannbare', name: 'がんば', image: 'stamps/gannbare.png' },
    { emoji: 'otukare', name: 'おつかれ', image: 'stamps/otukare.png' },
    { emoji: 'kitai', name: '期待', image: 'stamps/kitai.png' },
    { emoji: 'wakaru', name: 'わかる', image: 'stamps/wakaru.png' },
    { emoji: 'www', name: 'www', image: 'stamps/www.png' },
    { emoji: 'ok', name: 'OK!', image: 'stamps/ok.png' }
];

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', async () => {
    await loadSiteSettings();
    initProfile();
    await loadArticles();
    initEventListeners();
});

// ===== サイト設定読み込み =====
async function loadSiteSettings() {
    try {
        const response = await fetch('site-settings.json?t=' + Date.now());
        if (response.ok) {
            const settings = await response.json();
            
            // ヘッダーバナー（画像またはビデオ）
            if (settings.headerBanner && (settings.headerBanner.image || settings.headerBanner.video)) {
                const banner = document.getElementById('headerBanner');
                const bannerImg = document.getElementById('headerBannerImg');
                const bannerVideo = document.getElementById('headerBannerVideo');
                const bannerTitle = document.getElementById('bannerTitle');
                const bannerSubtitle = document.getElementById('bannerSubtitle');
                
                // ビデオがある場合はビデオを優先
                if (settings.headerBanner.video) {
                    bannerVideo.src = settings.headerBanner.video;
                    bannerVideo.classList.add('active');
                    bannerVideo.play().catch(e => console.log('自動再生がブロックされました'));
                    bannerImg.classList.remove('active');
                } else if (settings.headerBanner.image) {
                    bannerImg.src = settings.headerBanner.image;
                    bannerImg.classList.add('active');
                    bannerVideo.classList.remove('active');
                }
                
                banner.classList.add('active');
                
                if (settings.headerBanner.title) {
                    const titleLink = document.getElementById('bannerTitleLink');
                    titleLink.textContent = settings.headerBanner.title;
                    
                    // タイトルリンクURL
                    if (settings.headerBanner.titleUrl) {
                        titleLink.href = settings.headerBanner.titleUrl;
                    } else {
                        titleLink.removeAttribute('href');
                        titleLink.style.cursor = 'default';
                    }
                }
                if (settings.headerBanner.subtitle) {
                    bannerSubtitle.textContent = settings.headerBanner.subtitle;
                }
                if (!settings.headerBanner.showText) {
                    document.querySelector('.header-banner-content').style.display = 'none';
                }
            }
            
            // プロフィール上書き
            if (settings.profile) {
                if (settings.profile.name) {
                    blogConfig.profile.name = settings.profile.name;
                }
                if (settings.profile.bio) {
                    blogConfig.profile.bio = settings.profile.bio;
                }
                if (settings.profile.icon) {
                    blogConfig.profile.icon = settings.profile.icon;
                }
                if (settings.profile.links) {
                    blogConfig.profile.links = settings.profile.links;
                }
            }
            
            // カテゴリアイコン上書き
            if (settings.categories) {
                blogConfig.categoryIcons = {};
                settings.categories.forEach(cat => {
                    blogConfig.categoryIcons[cat.name] = cat.icon;
                });
            }
        }
    } catch (error) {
        console.log('サイト設定の読み込みをスキップ:', error);
    }
}

// ===== プロフィール初期化 =====
function initProfile() {
    const profileIcon = document.getElementById('profileIcon');
    const profileName = document.getElementById('profileName');
    const profileBio = document.getElementById('profileBio');
    
    if (blogConfig.profile) {
        if (profileIcon) profileIcon.src = blogConfig.profile.icon || 'default-icon.png';
        if (profileName) profileName.textContent = blogConfig.profile.name || 'ブログ管理者';
        if (profileBio) profileBio.textContent = blogConfig.profile.bio || '';
    }
}

// ===== 記事読み込み =====
async function loadArticles() {
    const articlesList = document.getElementById('articlesList');
    
    // ローディング表示
    articlesList.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>記事を読み込み中...</span>
        </div>
    `;
    
    try {
        const response = await fetch('articles.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            articles = data.articles || [];
            // 日付順にソート（新しい順）
            articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            articles = [];
        }
    } catch (error) {
        console.log('記事の読み込みに失敗:', error);
        articles = [];
    }
    
    renderArticles();
    renderCategories();
    renderRecentArticles();
}

// ===== 記事一覧表示 =====
function renderArticles() {
    const articlesList = document.getElementById('articlesList');
    const pageTitle = document.getElementById('pageTitle');
    
    // フィルタリング
    let filteredArticles = articles.filter(article => {
        // 下書きは除外
        if (article.isDraft) return false;
        
        // カテゴリフィルタ
        if (currentCategory && article.category !== currentCategory) return false;
        
        // 検索フィルタ
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchTitle = article.title.toLowerCase().includes(query);
            const matchContent = article.content.toLowerCase().includes(query);
            const matchTags = article.tags && article.tags.some(tag => 
                tag.toLowerCase().includes(query)
            );
            if (!matchTitle && !matchContent && !matchTags) return false;
        }
        
        return true;
    });
    
    // ページタイトル更新
    if (currentCategory) {
        const icon = blogConfig.categoryIcons[currentCategory] || '📁';
        pageTitle.innerHTML = `${icon} ${currentCategory}`;
    } else if (searchQuery) {
        pageTitle.innerHTML = `🔍 "${searchQuery}" の検索結果`;
    } else {
        pageTitle.innerHTML = 'すべての記事';
    }
    
    // 記事がない場合
    if (filteredArticles.length === 0) {
        articlesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🐻</div>
                <p class="empty-state-text">記事がありません</p>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // ページネーション計算
    const totalPages = Math.ceil(filteredArticles.length / blogConfig.articlesPerPage);
    const startIndex = (currentPage - 1) * blogConfig.articlesPerPage;
    const endIndex = startIndex + blogConfig.articlesPerPage;
    const pageArticles = filteredArticles.slice(startIndex, endIndex);
    
    // 記事カード生成
    articlesList.innerHTML = pageArticles.map(article => {
        const excerpt = extractExcerpt(article.content, 100);
        const readingTime = calculateReadingTime(article.content);
        const categoryIcon = blogConfig.categoryIcons[article.category] || '📁';
        
        let thumbnailHtml;
        if (article.thumbnail) {
            thumbnailHtml = `<img src="${article.thumbnail}" alt="${article.title}" class="article-thumbnail">`;
        } else {
            thumbnailHtml = `<div class="article-thumbnail no-image">${categoryIcon}</div>`;
        }
        
        return `
            <div class="article-card" data-id="${article.id}">
                ${thumbnailHtml}
                <div class="article-info">
                    <span class="article-category">${categoryIcon} ${article.category}</span>
                    <h2 class="article-title">${escapeHtml(article.title)}</h2>
                    <p class="article-excerpt">${escapeHtml(excerpt)}</p>
                    <div class="article-meta">
                        <span class="article-date">${formatDate(article.createdAt)}</span>
                        <span class="article-time">${formatTime(article.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // ページネーション生成
    renderPagination(totalPages);
    
    // カードクリックイベント
    document.querySelectorAll('.article-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id;
            openArticle(id);
        });
    });
}

// ===== ページネーション表示 =====
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // 前へボタン
    html += `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">← 前へ</button>`;
    
    // ページ番号
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || 
            i === totalPages || 
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            html += `<button class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<button disabled>...</button>`;
        }
    }
    
    // 次へボタン
    html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">次へ →</button>`;
    
    pagination.innerHTML = html;
    
    // クリックイベント
    pagination.querySelectorAll('button:not(:disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderArticles();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ===== カテゴリ一覧表示 =====
function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    const categoriesGrid = document.getElementById('categoriesGrid');
    
    // カテゴリと記事数を集計
    const categoryCounts = {};
    articles.forEach(article => {
        if (!article.isDraft) {
            const cat = article.category || 'その他';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
    });
    
    // サイドバーのカテゴリリスト
    if (categoryList) {
        // 全記事リンク
        let html = `
            <li>
                <a href="#" class="category-link ${!currentCategory ? 'active' : ''}" data-category="">
                    📚 すべて
                    <span class="category-count">${articles.filter(a => !a.isDraft).length}</span>
                </a>
            </li>
        `;
        
        Object.keys(categoryCounts).forEach(category => {
            const icon = blogConfig.categoryIcons[category] || '📁';
            html += `
                <li>
                    <a href="#" class="category-link ${currentCategory === category ? 'active' : ''}" data-category="${category}">
                        ${icon} ${category}
                        <span class="category-count">${categoryCounts[category]}</span>
                    </a>
                </li>
            `;
        });
        
        categoryList.innerHTML = html;
        
        // クリックイベント
        categoryList.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                currentCategory = link.dataset.category || null;
                currentPage = 1;
                renderArticles();
            });
        });
    }
    
    // モーダルのカテゴリグリッド
    if (categoriesGrid) {
        let html = `
            <div class="category-card" data-category="">
                <div class="category-card-icon">📚</div>
                <div class="category-card-name">すべて</div>
                <div class="category-card-count">${articles.filter(a => !a.isDraft).length}件</div>
            </div>
        `;
        
        Object.keys(categoryCounts).forEach(category => {
            const icon = blogConfig.categoryIcons[category] || '📁';
            html += `
                <div class="category-card" data-category="${category}">
                    <div class="category-card-icon">${icon}</div>
                    <div class="category-card-name">${category}</div>
                    <div class="category-card-count">${categoryCounts[category]}件</div>
                </div>
            `;
        });
        
        categoriesGrid.innerHTML = html;
        
        // クリックイベント
        categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                currentCategory = card.dataset.category || null;
                currentPage = 1;
                closeCategoriesModal();
                renderArticles();
            });
        });
    }
}

// ===== 最近の記事表示 =====
function renderRecentArticles() {
    const recentList = document.getElementById('recentList');
    if (!recentList) return;
    
    const recentArticles = articles
        .filter(a => !a.isDraft)
        .slice(0, blogConfig.recentArticlesCount);
    
    if (recentArticles.length === 0) {
        recentList.innerHTML = '<li><span style="color: var(--text-muted);">記事がありません</span></li>';
        return;
    }
    
    recentList.innerHTML = recentArticles.map(article => `
        <li>
            <a href="#" class="recent-link" data-id="${article.id}">
                ${escapeHtml(article.title.substring(0, 25))}${article.title.length > 25 ? '...' : ''}
            </a>
        </li>
    `).join('');
    
    // クリックイベント
    recentList.querySelectorAll('.recent-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openArticle(link.dataset.id);
        });
    });
}

// ===== 記事詳細表示 =====
function openArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    
    const modal = document.getElementById('articleModal');
    const detail = document.getElementById('articleDetail');
    
    const categoryIcon = blogConfig.categoryIcons[article.category] || '📁';
    const readingTime = calculateReadingTime(article.content);
    
    // Markdownをパース
    const contentHtml = marked.parse(article.content);
    
    // タグHTML
    let tagsHtml = '';
    if (article.tags && article.tags.length > 0) {
        tagsHtml = `
            <div class="article-detail-tags">
                ${article.tags.map(tag => `<span class="article-tag">#${escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
    }
    
    // サムネイルHTML
    let thumbnailHtml = '';
    if (article.thumbnail) {
        const blurClass = article.isAdult ? 'adult-blur' : '';
        thumbnailHtml = `<img src="${article.thumbnail}" alt="${escapeHtml(article.title)}" class="article-detail-thumbnail ${blurClass}">`;
    }
    
    // LINE友だち追加ボタン
    const lineButtonHtml = `
        <a href="${LINE_ADD_FRIEND_URL}" class="line-add-btn" target="_blank" rel="noopener">
            <img src="https://scdn.line-apps.com/n/line_add_friends/btn/ja.png" alt="更新通知を受け取る" height="28" border="0">
        </a>
    `;
    
    // リアクション状態表示エリア
    const reactionStatusHtml = `
        <div class="reaction-status" id="reaction-status-${id}">
            <!-- 動的に生成される -->
        </div>
    `;
    
    // リアクションパネル
    const reactionsHtml = `
        <div class="article-reactions" id="reactions-${id}">
            <div class="reactions-header">
                <span class="reactions-title">この記事にリアクション</span>
            </div>
            <div class="reactions-grid">
                ${REACTIONS.map(reaction => `
                    <button class="reaction-btn" 
                            data-article-id="${id}" 
                            data-reaction="${reaction.emoji}"
                            title="${reaction.name}">
                        <img src="${reaction.image}" class="reaction-emoji-img" alt="${reaction.name}">
                        <span class="reaction-count" id="count-${id}-${reaction.emoji}">0</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    detail.innerHTML = `
        <div class="article-detail-header">
            <span class="article-detail-category">${categoryIcon} ${article.category}</span>
            <h1 class="article-detail-title">${escapeHtml(article.title)}</h1>
            <div class="article-detail-meta">
                <span class="article-date">${formatDate(article.createdAt)}</span>
                <span class="article-time">${formatTime(article.createdAt)}</span>
                ${lineButtonHtml}
            </div>
            ${reactionStatusHtml}
        </div>
        ${thumbnailHtml}
        <div class="article-detail-content ${article.isAdult ? 'adult-content' : ''}">
            ${contentHtml}
        </div>
        ${tagsHtml}
        ${reactionsHtml}
    `;
    
    // 成人向けコンテンツの場合、画像にぼかしを適用
    if (article.isAdult) {
        detail.querySelectorAll('.article-detail-content img').forEach(img => {
            img.classList.add('adult-blur');
        });
        
        // ぼかし画像クリックで解除
        detail.querySelectorAll('.adult-blur').forEach(img => {
            img.addEventListener('click', function() {
                this.classList.remove('adult-blur');
            });
            img.style.cursor = 'pointer';
            img.title = 'クリックで表示';
        });
        
        // 警告ポップアップを表示
        showAdultWarning();
    }
    
    // リアクションボタンのイベントリスナーを設定
    detail.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', handleReactionClick);
    });
    
    // リアクション数を読み込み
    loadReactions(id);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== リアクション機能 =====

// リアクション読み込み
async function loadReactions(articleId) {
    try {
        // Firebaseが利用可能かチェック
        if (typeof db !== 'undefined') {
            const docRef = db.collection('blog-reactions').doc(articleId);
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                reactionsData[articleId] = data;
                
                // 各リアクションの数を表示
                REACTIONS.forEach(reaction => {
                    const count = data[reaction.emoji] || 0;
                    const countEl = document.getElementById(`count-${articleId}-${reaction.emoji}`);
                    if (countEl) {
                        countEl.textContent = count;
                        
                        // 自分が押したリアクションをハイライト
                        if (hasUserReacted(articleId, reaction.emoji)) {
                            countEl.closest('.reaction-btn').classList.add('reacted');
                        }
                    }
                });
            } else {
                // データがない場合は初期化
                reactionsData[articleId] = {};
                REACTIONS.forEach(reaction => {
                    reactionsData[articleId][reaction.emoji] = 0;
                });
            }
        } else {
            // Firebaseがない場合はローカルストレージのみ使用
            const localData = JSON.parse(localStorage.getItem('blogReactions') || '{}');
            reactionsData[articleId] = localData[articleId] || {};
            
            REACTIONS.forEach(reaction => {
                const count = reactionsData[articleId][reaction.emoji] || 0;
                const countEl = document.getElementById(`count-${articleId}-${reaction.emoji}`);
                if (countEl) {
                    countEl.textContent = count;
                    
                    if (hasUserReacted(articleId, reaction.emoji)) {
                        countEl.closest('.reaction-btn').classList.add('reacted');
                    }
                }
            });
        }
        
        // リアクション状態を更新
        updateReactionStatus(articleId);
    } catch (error) {
        console.error('リアクション読み込みエラー:', error);
        // エラー時はローカルデータで表示
        REACTIONS.forEach(reaction => {
            const countEl = document.getElementById(`count-${articleId}-${reaction.emoji}`);
            if (countEl) {
                countEl.textContent = '0';
            }
        });
        updateReactionStatus(articleId);
    }
}

// リアクションクリック処理
async function handleReactionClick(e) {
    const btn = e.currentTarget;
    const articleId = btn.dataset.articleId;
    const reaction = btn.dataset.reaction;
    
    // スパム防止：連打防止
    if (btn.disabled) return;
    btn.disabled = true;
    
    try {
        const hasReacted = hasUserReacted(articleId, reaction);
        
        if (hasReacted) {
            // リアクション取り消し
            await removeReaction(articleId, reaction);
            btn.classList.remove('reacted');
        } else {
            // リアクション追加
            await addReaction(articleId, reaction);
            btn.classList.add('reacted');
            
            // アニメーション効果
            showReactionAnimation(btn, reaction);
        }
        
        // リアクション数を再読み込み
        await loadReactions(articleId);
    } catch (error) {
        console.error('リアクションエラー:', error);
        showReactionError();
    } finally {
        setTimeout(() => {
            btn.disabled = false;
        }, 500);
    }
}

// リアクション追加
async function addReaction(articleId, reaction) {
    if (typeof db !== 'undefined') {
        const docRef = db.collection('blog-reactions').doc(articleId);
        
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            
            let data = {};
            if (doc.exists) {
                data = doc.data();
            }
            
            // カウントを増やす
            data[reaction] = (data[reaction] || 0) + 1;
            
            transaction.set(docRef, data);
        });
    } else {
        // Firebaseがない場合はローカルストレージに保存
        const localData = JSON.parse(localStorage.getItem('blogReactions') || '{}');
        if (!localData[articleId]) localData[articleId] = {};
        localData[articleId][reaction] = (localData[articleId][reaction] || 0) + 1;
        localStorage.setItem('blogReactions', JSON.stringify(localData));
        reactionsData[articleId] = localData[articleId];
    }
    
    // ユーザーのリアクションを記録
    saveUserReaction(articleId, reaction, true);
    
    // リアクション状態を更新
    updateReactionStatus(articleId);
}

// リアクション削除
async function removeReaction(articleId, reaction) {
    if (typeof db !== 'undefined') {
        const docRef = db.collection('blog-reactions').doc(articleId);
        
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(docRef);
            
            if (doc.exists) {
                const data = doc.data();
                data[reaction] = Math.max(0, (data[reaction] || 0) - 1);
                transaction.set(docRef, data);
            }
        });
    } else {
        // Firebaseがない場合はローカルストレージから削除
        const localData = JSON.parse(localStorage.getItem('blogReactions') || '{}');
        if (localData[articleId] && localData[articleId][reaction]) {
            localData[articleId][reaction] = Math.max(0, localData[articleId][reaction] - 1);
            localStorage.setItem('blogReactions', JSON.stringify(localData));
            reactionsData[articleId] = localData[articleId];
        }
    }
    
    // ユーザーのリアクションを削除
    saveUserReaction(articleId, reaction, false);
    
    // リアクション状態を更新
    updateReactionStatus(articleId);
}

// ユーザーがリアクション済みか確認
function hasUserReacted(articleId, reaction) {
    const userReactions = JSON.parse(localStorage.getItem('userBlogReactions') || '{}');
    return userReactions[articleId] && userReactions[articleId][reaction];
}

// ユーザーのリアクションを記録
function saveUserReaction(articleId, reaction, reacted) {
    const userReactions = JSON.parse(localStorage.getItem('userBlogReactions') || '{}');
    
    if (!userReactions[articleId]) {
        userReactions[articleId] = {};
    }
    
    userReactions[articleId][reaction] = reacted;
    localStorage.setItem('userBlogReactions', JSON.stringify(userReactions));
}

// リアクション状態表示更新
function updateReactionStatus(articleId) {
    const statusElement = document.getElementById(`reaction-status-${articleId}`);
    if (!statusElement) return;
    
    let statusHTML = '';
    
    // 各リアクションの数をチェック
    REACTIONS.forEach(reaction => {
        const countElement = document.getElementById(`count-${articleId}-${reaction.emoji}`);
        const count = countElement ? parseInt(countElement.textContent) : 0;
        
        if (count > 0) {
            statusHTML += `
                <div class="reaction-status-item">
                    <img src="${reaction.image}" class="reaction-status-icon" alt="${reaction.name}">
                    <span class="reaction-status-count">${count}</span>
                </div>
            `;
        }
    });
    
    statusElement.innerHTML = statusHTML;
}

// リアクションアニメーション
function showReactionAnimation(btn, reactionEmoji) {
    const reactionData = REACTIONS.find(r => r.emoji === reactionEmoji);
    if (!reactionData) return;
    
    const floater = document.createElement('div');
    floater.className = 'reaction-floater';
    floater.innerHTML = `<img src="${reactionData.image}" alt="${reactionData.name}">`;
    
    const rect = btn.getBoundingClientRect();
    floater.style.left = `${rect.left + rect.width / 2}px`;
    floater.style.top = `${rect.top}px`;
    
    document.body.appendChild(floater);
    
    setTimeout(() => {
        floater.remove();
    }, 1000);
}

// エラー表示
function showReactionError() {
    const toast = document.createElement('div');
    toast.className = 'reaction-toast';
    toast.textContent = 'リアクションの送信に失敗しました';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== 成人向け警告ポップアップ =====
function showAdultWarning() {
    const warning = document.createElement('div');
    warning.className = 'adult-warning-popup';
    warning.innerHTML = `
        <div class="adult-warning-content">
            <span class="adult-warning-icon">⚠️</span>
            <span class="adult-warning-text">この記事には性的表現が含まれております。</span>
        </div>
    `;
    document.body.appendChild(warning);
    
    // フェードイン
    setTimeout(() => {
        warning.classList.add('show');
    }, 10);
    
    // 1秒後にフェードアウト
    setTimeout(() => {
        warning.classList.remove('show');
        setTimeout(() => {
            warning.remove();
        }, 500);
    }, 1500);
}

// ===== モーダルを閉じる =====
function closeArticleModal() {
    const modal = document.getElementById('articleModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeCategoriesModal() {
    const modal = document.getElementById('categoriesModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ===== イベントリスナー初期化 =====
function initEventListeners() {
    // 記事モーダル
    document.getElementById('modalClose').addEventListener('click', closeArticleModal);
    document.querySelector('#articleModal .modal-overlay').addEventListener('click', closeArticleModal);
    
    // カテゴリモーダル
    document.getElementById('categoriesBtn').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('categoriesModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    document.getElementById('categoriesClose').addEventListener('click', closeCategoriesModal);
    document.querySelector('#categoriesModal .modal-overlay').addEventListener('click', closeCategoriesModal);
    
    // Aboutモーダル
    document.getElementById('aboutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        renderAbout();
        document.getElementById('aboutModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    document.getElementById('aboutClose').addEventListener('click', closeAboutModal);
    document.querySelector('#aboutModal .modal-overlay').addEventListener('click', closeAboutModal);
    
    // 検索
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            renderArticles();
        }, 300);
    });
    
    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeArticleModal();
            closeCategoriesModal();
            closeAboutModal();
        }
    });
}

// ===== About表示 =====
function renderAbout() {
    const aboutDetail = document.getElementById('aboutDetail');
    const profile = blogConfig.profile;
    
    let linksHtml = '';
    if (profile.links && profile.links.length > 0) {
        linksHtml = `
            <div class="about-links">
                ${profile.links.map(link => `
                    <a href="${link.url}" target="_blank" rel="noopener" class="about-link">
                        <span>${link.icon || '🔗'}</span>
                        <span>${link.name}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }
    
    aboutDetail.innerHTML = `
        <img src="${profile.icon || 'default-icon.png'}" alt="${profile.name}" class="about-icon">
        <h2 class="about-name">${profile.name}</h2>
        <p class="about-bio">${profile.bio}</p>
        ${linksHtml}
    `;
}

// ===== ユーティリティ関数 =====

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 日付フォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

// 時間フォーマット
function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 抜粋を抽出
function extractExcerpt(content, maxLength) {
    // Markdown記法を除去
    let text = content
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        .replace(/>\s/g, '')
        .replace(/[-*+]\s/g, '')
        .replace(/\n/g, ' ')
        .trim();
    
    if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '...';
    }
    
    return text;
}

// 読了時間計算
function calculateReadingTime(content) {
    const wordsPerMinute = 400; // 日本語の場合
    const charCount = content.length;
    const minutes = Math.ceil(charCount / wordsPerMinute);
    return Math.max(1, minutes);
}
