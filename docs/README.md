# CloudVar ☁️ 総合ドキュメント

CloudVarへようこそ！このドキュメントでは、Scratchのようなクラウド変数をJavaScriptで実現するためのすべてを解説します。

## 📚 コンテンツ
- **[5分で導入！クイックスタート](./guide/getting-started.md)**: 最初の変数を同期させるまで。
- **[ルーム管理ガイド](./guide/rooms.md)**: ゲームごとの部屋分けとパスワード保護。
- **[P2Pモードについて](./guide/p2p-mode.md)**: サーバーを介さない超高速通信の設定。
- **[クライアントAPIリファレンス](./api/client-sdk.md)**: `CloudVar`クラスの全機能。
- **[サーバー設定ガイド](./api/server-config.md)**: Redis同期やポート番号の設定。

## 🚀 CloudVarの「魔法」
CloudVarは、普通のJavaScriptの変数に代入するだけで、世界中のブラウザと値を同期します。
```javascript
// これだけで同期開始！
score = 100; 
```
