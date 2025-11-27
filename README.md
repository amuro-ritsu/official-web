# 🐻 Blog Bear

GitHub Pagesで動作するシンプルなブログシステムです。  
管理画面から記事を投稿すると、自動でGitHubにpushされて公開されます。

## ✨ 特徴

- 📝 **Markdownエディタ** - 見出し、太字、リスト、コードブロックなど
- 🏷️ **カテゴリ・タグ** - 記事を整理
- 📷 **サムネイル画像** - 記事に画像を設定
- 📋 **下書き機能** - 公開前に保存
- 🔍 **検索機能** - 記事を検索
- 📱 **レスポンシブ** - スマホ対応
- 🍫 **チョコレートテーマ** - かわいいデザイン

## 🚀 セットアップ

### 1. リポジトリにファイルをアップロード

このフォルダ内のすべてのファイルをGitHubリポジトリにアップロードします。

### 2. GitHub Pagesを有効化

- リポジトリの Settings → Pages
- Source: `main` ブランチを選択
- Save をクリック

### 3. Personal Access Token を取得

1. https://github.com/settings/tokens にアクセス
2. 「Generate new token (classic)」をクリック
3. Note: `Blog Bear` など分かりやすい名前
4. Expiration: `No expiration`（またはお好みで）
5. ✅ `repo` にチェック
6. 「Generate token」をクリック
7. 表示されたトークンをコピー（一度しか表示されません！）

### 4. 管理画面で設定

1. `https://あなたのユーザー名.github.io/リポジトリ名/admin/` にアクセス
2. 「設定」タブを開く
3. GitHub設定を入力:
   - **リポジトリ名**: `ユーザー名/リポジトリ名`
   - **ブランチ名**: `main`
   - **Personal Access Token**: コピーしたトークン
4. 「GitHub設定を保存」をクリック

## 📖 使い方

### 記事を書く

1. 管理画面の「記事作成」タブ
2. タイトルを入力
3. Markdownで本文を書く
4. カテゴリ・タグを設定
5. 「公開する」をクリック

### Markdown記法

```markdown
## 見出し2
### 見出し3

**太字** と *斜体*

- リスト項目1
- リスト項目2

> 引用文

`インラインコード`

[リンクテキスト](URL)

![画像の説明](画像URL)
```

### 記事の編集・削除

「記事一覧」タブから編集・削除できます。

## 📁 ファイル構成

```
blog-bear/
├── index.html          # ブログトップページ
├── style.css           # スタイル
├── config.js           # 設定
├── viewer.js           # 表示用スクリプト
├── articles.json       # 記事データ（自動生成）
├── default-icon.svg    # デフォルトアイコン
├── admin/
│   ├── index.html      # 管理画面
│   ├── admin.js        # 管理用スクリプト
│   └── admin-style.css # 管理画面スタイル
└── README.md           # この説明
```

## 🔒 セキュリティ

- Personal Access TokenはブラウザのlocalStorageに保存されます
- 共有PCでは使用しないでください
- トークンが漏洩した場合はGitHubで即座に削除してください

## 🎨 カスタマイズ

### プロフィール

管理画面の「設定」タブから変更できます。

### カテゴリアイコン

`config.js` の `categoryIcons` を編集してください。

### カラーテーマ

`style.css` の `:root` セクションのCSS変数を変更してください。

---

🐻 Happy Blogging!
