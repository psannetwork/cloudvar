# ☁️ CloudVar
> **「書かない」リアルタイム同期フレームワーク。**  
> 変数を宣言するだけで、世界中のブラウザと同期します。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/psannetwork/cloudvar/releases)

---

**JavaScriptを書くのは、もう終わりにしましょう。**  
CloudVarは、HTML属性（マジック属性）だけでリアルタイム通信を実現する、次世代の同期エンジンです。  
WebSocketの実装も、イベントリスナーも、状態管理も、もう必要ありません。

## ✨ 魔法のような体験

```html
<!-- たったこれだけ。入力した文字が、世界中の画面で同期されます -->
<input type="text" cv-bind="message">
<h1><span cv-bind="message"></span></h1>
```

あなたが `input` に文字を打った瞬間、地球の裏側にいる誰かの画面の `h1` が書き換わります。  
**JavaScriptは1行も書いていません。**

## 🚀 なぜ CloudVar なのか？

- **ゼロ・コンフィグ**: サーバー設定も、変数の定義も不要。HTMLに書いた変数が自動的にクラウド化されます。
- **超高速開発**: チャットアプリが3分、マルチプレイヤーゲームが10分で作れます。
- **ハイブリッド設計**: サーバー経由の安定した通信（WebSocket）と、超低遅延なP2P通信（WebRTC）をサポート。
- **どこでも動く**: Vanilla JS、React、Vue、jQuery... どんな環境でも `<script>` タグ1つで動作します。

## 📦 インストール

### 方法 A: CDNで今すぐ使う (推奨)
```html
<script src="https://github.com/psannetwork/cloudvar/releases/download/V2.0/cloudvar.js"></script>
```

### 方法 B: npm でインストール
```bash
npm install cloudvar
```

## 🛠 クイックスタート

5分で「共有ToDoリスト」を作ってみましょう。

```html
<!DOCTYPE html>
<html>
<body>
    <!-- SDKを読み込む -->
    <script src="https://github.com/psannetwork/cloudvar/releases/download/V2.0/cloudvar.js"></script>

    <!-- 表示エリア -->
    <pre cv-bind="todoList"></pre>

    <!-- 入力エリア（cv-localは同期しない自分だけの変数） -->
    <input cv-local="task" placeholder="タスクを入力">
    
    <!-- ボタン（BRは改行を表す特殊キーワード） -->
    <button cv-on="click: todoList += '・' + task + BR; task = ''">追加</button>

    <script>
        // サーバーに接続（これだけで完了！）
        const cv = new CloudVar('wss://cloudvar.psannetwork.net', { room: 'my-todo' });
        
        // 初期値の設定（任意）
        todoList = todoList || "--- ToDoリスト ---\n";
    </script>
</body>
</html>
```

## 📚 ドキュメント & サンプル

- [**公式ドキュメント**](./docs/README.md): 全機能の解説とAPIリファレンス
- [**サンプル集**](./examples/index.html): チャット、ゲーム、ホワイトボードなどの実装例
- [**逆引きレシピ**](./docs/README.md#💡-逆引きレシピ): 「これどうやるの？」への回答

## 🤝 貢献 (Contribution)

CloudVar はオープンソースプロジェクトです。  
バグ報告、機能提案、プルリクエストを歓迎します！  
詳しくは [CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

## 📜 ライセンス
MIT (See [LICENSE](./LICENSE))

---
Copyright (c) 2026 PSAN Network