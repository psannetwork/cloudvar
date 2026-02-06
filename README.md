# CloudVar ☁️

世界で最も簡単に、HTMLと変数をリアルタイム同期させる。

## 究極の「2行」導入
```html
<!-- 1. HTMLに書く -->
Score: <span cv-bind="score">0</span>

<!-- 2. JSで代入する -->
<script src="src/client.js"></script>
<script>
    const cv = new CloudVar('ws://localhost:8080', { room: 'game' });
    score = 100; // これだけでHTMLが書き換わり、世界に同期される
</script>
```

## 特徴
- 🪄 **オートバインド**: HTML属性 `cv-bind` で表示を自動更新。
- ⚡ **ノンブロッキング**: 接続完了を待たずに即代入OK。
- 🏠 **ルーム管理**: パスワード付きルームで安全に分離。
- 🏎️ **P2P対応**: WebRTCによる極限の低遅延。

## ドキュメント
詳細な使い方は **[docsディレクトリ](./docs/README.md)** をご覧ください。

- **[5分で導入ガイド (オートバインド編)](./docs/guide/getting-started.md)**
- **[APIリファレンス](./docs/api/client-sdk.md)**
- **[オートバインドの仕組み](./docs/guide/auto-bind.md)**
- **[サーバー設定](./docs/api/server-config.md)**
