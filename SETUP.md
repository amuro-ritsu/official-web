# アイコン設定ガイド

index.htmlの`<head>`内に以下を追加してください：

```html
<!-- ファビコン -->
<link rel="icon" type="image/x-icon" href="icons/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="icons/favicon-16.png">

<!-- iOS用 -->
<link rel="apple-touch-icon" sizes="180x180" href="icons/apple-touch-icon.png">

<!-- PWA -->
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#6cc4b0">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Blog Bear">
```

## 含まれるアイコン

- `icons/icon-512.png` - PWA用（512×512）
- `icons/icon-192.png` - PWA用（192×192）
- `icons/apple-touch-icon.png` - iOS用（180×180）
- `icons/favicon-32.png` - ブラウザタブ用
- `icons/favicon-16.png` - ブラウザタブ用
- `icons/favicon.ico` - 従来のファビコン

## Firebase設定

`</body>`の前に以下を追加：

```html
<!-- Firebase -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
```

firebase-config.jsはPost-Bearと同じものを使用してください。
