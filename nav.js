// ===== 共通ナビゲーション =====

// ナビゲーションを生成
function initNavigation() {
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    
    const header = document.querySelector('.site-header');
    if (!header) return;
    
    header.innerHTML = `
        <div class="header-inner">
            <div class="site-logo">
                <a href="./">
                    <span class="logo-icon"></span>
                </a>
                <span class="logo-text"><a href="https://www.dlsite.com/girls/circle/profile/=/maker_id/RG01057835.html" target="_blank" class="logo-text-link">不変少年+</a></span>
            </div>
            <nav class="site-nav">
                <a href="./" class="nav-link ${currentPage === '' || currentPage === 'index.html' ? 'active' : ''}">ホーム</a>
                <a href="#" class="nav-link" id="aboutBtn">About</a>
                <a href="#" class="nav-link" id="categoriesBtn">カテゴリ</a>
                <a href="work.html" class="nav-link ${currentPage === 'work.html' ? 'active' : ''}">お仕事</a>
                
                <a href="https://www.dlsite.com/girls/circle/profile/=/maker_id/RG01057835.html" class="nav-link" target="_blank">DLsite</a>
                <a href="https://ci-en.dlsite.com/creator/33200" class="nav-link" target="_blank">Ci-en</a>
            </nav>
        </div>
    `;
    
    // ロゴテキストアニメーション
    const logoLink = document.querySelector('.logo-text-link');
    if (logoLink) {
        const text = logoLink.textContent;
        logoLink.innerHTML = text.split('').map((char, i) => 
            `<span style="animation-delay: ${i * 0.1}s">${char}</span>`
        ).join('');
    }
}

// DOM読み込み時に実行
document.addEventListener('DOMContentLoaded', initNavigation);
