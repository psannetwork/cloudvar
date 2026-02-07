# ☁️ CloudVar

**「書かない」リアルタイム同期フレームワーク。**  
HTML属性を書くだけで、JavaScript変数が世界中のブラウザと一瞬で同期します。

## ✨ 特徴

- **マジック属性**: `cv-bind`, `cv-on` など、HTML属性だけでリアルタイム機能を実装。
- **ゼロ・コンフィグ**: 変数の宣言は不要。HTMLに書いた瞬間にグローバル変数として同期対象になります。
- **ノンブロッキング**: ネットワーク接続を待たずに代入可能。接続後に自動で同期されます。
- **ハイブリッド設計**: クライアントSDKとしても、スタンドアロンサーバーとしても、npmライブラリとしても動作。

## 🚀 クイックスタート (Client)

HTMLで `cloudvar.js` を読み込み、変数を書くだけ。

```html
<script src="https://unpkg.com/cloudvar/dist/cloudvar.js"></script>

<!-- 表示と入力が同期 -->
<h1 cv-bind="score">0</h1>
<input type="number" cv-bind="score">

<!-- ボタンで操作 -->
<button cv-on="click: score++">プラス</button>

<script>
  // これだけで接続完了！
  const cv = new CloudVar('ws://your-server:5032', {
    room: 'my-room',
    mode: 'p2p' // 'ws' (デフォルト) または 'p2p' (WebRTC)
  });
  
  // JavaScriptからも普通に触れる
  setInterval(() => score++, 1000);
</script>
```

## 🛠 サーバーの起動

### 方法 A: CLIで起動
```bash
npx cloudvar-server
```

### 方法 B: 既存のNode.jsアプリに組み込む
```javascript
const CloudVarServer = require('cloudvar');
const server = new CloudVarServer({ port: 5032 });
server.start();
```

## 📖 マジック属性リファレンス

| 属性 | 説明 | 例 |
|:---|:---|:---|
| `cv-bind` | テキストまたは入力値と同期 | `cv-bind="name"` |
| `cv-on` | イベント時に式を評価 | `cv-on="click: score++"` |
| `cv-show` | 値が真の時に表示 | `cv-show="isAdmin"` |
| `cv-hide` | 値が真の時に非表示 | `cv-hide="isMuted"` |
| `cv-class` | 値が真の時にクラスを付与 | `cv-class="active: highlight"` |

## 📦 インストール

```bash
npm install cloudvar
```

## 🤝 貢献 (Contribution)

CloudVar はオープンソースプロジェクトです。バグ報告や機能提案、プルリクエストを歓迎します！
詳しくは [CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

## 📜 ライセンス
MIT (See [LICENSE](./LICENSE))
