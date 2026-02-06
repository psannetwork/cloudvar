# CloudVar ☁️

JavaScriptの変数に代入するだけで、世界中とリアルタイム同期。
WebSocket & WebRTC (P2P) ハイブリッド対応。

## 特徴
- 📦 **超簡単**: `score = 100` と書くだけで同期。
- 🏠 **ルーム管理**: パスワード付きの部屋でデータを分離。
- ⚡ **超低遅延**: P2Pモードでサーバーを介さず通信。
- 🛡️ **セキュア**: トークン認証とユーザーブロック機能。
- 🌐 **スケーラブル**: Redisを使って複数サーバーを同期。

## ドキュメント
詳細な使い方は **[docsディレクトリ](./docs/README.md)** をご覧ください。

- **[5分で導入ガイド](./docs/guide/getting-started.md)**
- **[APIリファレンス](./docs/api/client-sdk.md)**
- **[サーバー設定](./docs/api/server-config.md)**

## クイックプレビュー
```javascript
const cv = new CloudVar('ws://localhost:8080');
cv.join('game-1');

cv.onChange('_joined', () => {
    // 宣言後は、普通の変数として扱える
    score = score || 0;
    score++; 
});
```