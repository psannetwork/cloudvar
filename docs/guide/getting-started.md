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

# サーバー起動 (デフォルトは 8080番ポート)
npm start
```

## 2. クライアントの実装
`src/client.js` をHTMLで読み込むだけで、魔法のような同期が始まります。

### HTML (index.html)
表示したい部分に `cv-bind` 属性を付けるだけ。JSで表示を書き換えるコードは不要です。

```html
<script src="src/client.js"></script>

<!-- 表示用 -->
<h1>Score: <span cv-bind="score">0</span></h1>

<!-- 入力用（自動で双方向同期） -->
<input type="text" cv-bind="nickname" placeholder="なまえ">

<script>
  // インスタンス作成と同時にルームに参加
  const cv = new CloudVar('ws://localhost:8080', { room: 'my-game' });

  // 🌟 接続を待たずに、いきなり変数として使える
  score = score || 0;
  nickname = nickname || "ななし";

  // クリックで加算（これだけで全員の画面が変わる）
  document.onclick = () => score++;
</script>
```

## 3. 動作確認
1. ブラウザで `index.html` を2つのタブで開きます。
2. 片方で入力を変えたり、画面をクリックしたりしてください。
3. もう片方の画面が **「一行も表示更新コードを書いていないのに」** 変わることを確認してください！