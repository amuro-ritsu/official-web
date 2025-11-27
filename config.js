// ===== Blog Bear 設定ファイル =====

const blogConfig = {
    // ブログ情報
    blogName: 'Blog Bear',
    blogDescription: 'GitHubで更新できるブログ',
    
    // プロフィール
    profile: {
        name: 'ブログ管理者',
        bio: 'ブログの説明文がここに入ります。管理画面から変更できます。',
        icon: 'default-icon.png',
        links: [
            // { name: 'Twitter', url: 'https://twitter.com/yourname', icon: '🐦' },
            // { name: 'YouTube', url: 'https://youtube.com/@yourname', icon: '📺' },
        ]
    },
    
    // カテゴリアイコン（管理画面で選択可能）
    categoryIcons: {
        '日記': '📝',
        'お知らせ': '📢',
        '技術': '💻',
        'レビュー': '⭐',
        '趣味': '🎮',
        'その他': '📌'
    },
    
    // 1ページあたりの記事数
    articlesPerPage: 10,
    
    // 最近の記事の表示数
    recentArticlesCount: 5
};

// デフォルトカテゴリのリスト
const defaultCategories = [
    '日記',
    'お知らせ',
    '技術',
    'レビュー',
    '趣味',
    'その他'
];
