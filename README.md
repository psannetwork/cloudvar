# CloudVar ☁️

世界で最も簡単に、HTMLと変数をリアルタイム同期させる。

## 🪄 マジック属性で「JSを書かない」開発
HTMLに属性を書くだけで、リアルタイムアプリが完成します。

```html
<!-- 1. 表示を同期 -->
Score: <h1 cv-bind="score">0</h1>

<!-- 2. クリックで加算 (JS不要！) -->
<button cv-on="click: score++">加点</button>

<!-- 3. 変数で表示を切り替え -->
<div cv-show="isGameover">GAME OVER</div>
```

## 特徴
- ✨ **マジック属性**: `cv-bind`, `cv-on`, `cv-show`, `cv-class` でHTMLを動的に。
- ⚡ **ノンブロッキング**: 接続完了を待たずに即代入OK。
- 🏠 **ルーム管理**: パスワード付きルームで安全に分離。
- 🏎️ **P2P対応**: WebRTCによる極限の低遅延。

## クイックリンク
- **[5分で導入ガイド (マジック属性編)](./docs/guide/getting-started.md)**
- **[マジック属性 リファレンス](./docs/guide/auto-bind.md)**
- **[API詳細 (JavaScript)](./docs/api/client-sdk.md)**
- **[サーバー設定](./docs/api/server-config.md)**