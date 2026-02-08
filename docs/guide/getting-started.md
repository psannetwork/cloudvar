# クイックスタートガイド

CloudVarを使い始めるための最短ルートです。

## 1. サーバーのセットアップ
まずは自分のサーバーを起動しましょう。

```bash
# リポジトリをクローン
git clone https://github.com/psannetwork/cloudvar.git
cd cloudvar

# 依存関係のインストール
npm install

# サーバー起動 (デフォルトは 5032番ポート)
npm start
```

## 2. クライアントの実装
ビルドされた `dist/cloudvar.js` をHTMLで読み込むだけで、魔法のような同期が始まります。

### HTML (index.html)
表示したい部分に `cv-bind` 属性を付けるだけ。JSで表示を書き換えるコードは不要です。

```html
<!-- ダウンロードした cloudvar.js を読み込む -->
<script src="cloudvar.js"></script>

<!-- 表示用 -->
<h1>Score: <span cv-bind="score">0</span></h1>

<!-- 入力用（自動で双方向同期） -->
<input type="text" cv-bind="nickname" placeholder="なまえ">

<script>
  // インスタンス作成と同時にルームに参加
  const cv = new CloudVar('ws://localhost:5032', { room: 'my-game' });

  // 🌟 接続を待たずに、いきなり変数として使える
  score = score || 0;
  nickname = nickname || "ななし";

  // クリックで加算（これだけで全員の画面が変わる）
  document.onclick = () => score++;
</script>
```

## ⚠️ 重要なルール：変数の作り方
- **HTMLにある変数**: `cv-bind` などで書いた変数は、**最初からJSでそのまま使えます**。
- **HTMLにない変数**: JSだけで使う隠し変数は、**最初の1回だけ `cv.` を付けて宣言**してください。

```javascript
// HTMLにない変数を同期させたい場合
cv.secretKey = "1234"; // 最初だけ cv. をつける

// 2回目からは普通に使えます
secretKey = "5678"; // 同期される！
```

## ⚡️ 同期モードの切り替え
CloudVar は、サーバー経由の WebSocket 同期と、ブラウザ同士で直接通信する P2P (WebRTC) 同期の両方をサポートしています。

### WebSocket モード (デフォルト)
サーバーがすべてのメッセージを仲介します。最も安定しており、ファイアウォールの影響を受けにくい形式です。
```javascript
const cv = new CloudVar('ws://localhost:5032', { mode: 'ws' });
```

### P2P モード
サーバーを信号の交換のみに使用し、実際のデータのやり取りはブラウザ間で行います。サーバーの負荷を抑え、高速な同期が期待できます。
```javascript
const cv = new CloudVar('ws://localhost:5032', { mode: 'p2p' });
```

## 3. 動作確認
1. ブラウザで `index.html` を2つのタブで開きます。
2. 片方で入力を変えたり、画面をクリックしたりしてください。
3. もう片方の画面が **「一行も表示更新コードを書いていないのに」** 変わることを確認してください！