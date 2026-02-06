# クイックスタートガイド

## 1. サーバーの準備
```bash
git clone ...
cd cloudvar
npm install
npm start
```
サーバーが `localhost:8080` で起動します。

## 2. クライアントの実装
HTMLで `src/client.js` を読み込みます。

```html
<script src="src/client.js"></script>
<script>
  // 1. サーバーに接続（インスタンス名は 'cv' がおすすめ）
  const cv = new CloudVar('ws://localhost:8080');

  // 2. ルームに参加
  cv.join('my-cool-game');

  // 3. ルーム参加後に変数を作成（宣言）
  cv.onChange('_joined', () => {
    cv.playerX = 100; // 最初の宣言
    
    // 4. 以降は、普通の変数として読み書きするだけ！
    playerX = 200;
    console.log(playerX);
  });
</script>
```

## 3. 動作確認
同じHTMLを2つのタブで開いてください。片方のタブで `playerX` を書き換えると、もう片方のタブでも自動的に値が変わります。
