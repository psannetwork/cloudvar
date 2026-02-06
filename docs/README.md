# CloudVar ☁️ 総合ドキュメント

CloudVarは、**「コードを一行も書かずにリアルタイム同期」**を目指した、最も直感的な変数同期システムです。

## 📂 プロジェクト構造
- **src/client/**: クライアントSDKのソース（Network, Binding, Coreに分割）。
- **src/server/**: サーバーサイドのソース（Room管理, SyncEngineに分割）。
- **src/utils/**: サーバー・クライアント共通のユーティリティ。
- **src/client.bundle.js**: ブラウザで1ファイル読み込むだけで使える統合版。

## 📚 クイックリンク
- **[導入ガイド (5分)](./guide/getting-started.md)**: `client.bundle.js` を使った最速の導入。
- **[APIリファレンス](./api/client-sdk.md)**: メソッドやプロパティの一覧。
- **[オートバインド詳細](./guide/auto-bind.md)**: HTMLと変数を繋ぐ仕組み。
- **[サーバー設定](./api/server-config.md)**: 自分のサーバーをカスタマイズ。