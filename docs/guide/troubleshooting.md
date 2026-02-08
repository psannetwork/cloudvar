# トラブルシューティング

うまく動かない場合のチェックリストです。

## Q. 変数が反映されない
1. **HTMLに書いていますか？**
   CloudVarはHTML内の `cv-bind` などをスキャンして変数を認識します。HTMLに一度も出てこない変数は同期されません。
   JSだけで使う変数は、最初に `cv.myVar = 0` のように `cv.` を付けて代入してください。

2. **ブラウザ標準の変数名を使っていませんか？**
   `name`, `location`, `top` などの変数はブラウザが予約しているため、動作が不安定になることがあります。`playerName` や `score` など、ユニークな名前を使ってください。

## Q. 改行が反映されない
HTML属性の中で `
` を書くと無視されることがあります。代わりに **`BR`** キーワードを使ってください。
```html
<!-- ❌ 動かない -->
<button cv-on="click: log += '
'">改行</button>

<!-- ✅ 動く -->
<button cv-on="click: log += BR">改行</button>
```

## Q. 接続人数 (COUNT) が 0 のまま
`cv-bind="COUNT"` を使っている要素が、正しい `cv-app` スコープ内にあるか確認してください。
また、複数の CloudVar インスタンスを使っている場合、どのインスタンスの人数を表示したいのかを意識してください。

## Q. `CloudVar is not defined` と出る
スクリプトの読み込み順序を確認してください。
必ず、あなたがコードを書く `<script>` タグの **前** に `cloudvar.js` を読み込んでください。

```html
<!-- ✅ 正しい順序 -->
<script src="cloudvar.js"></script>
<script>
  const cv = new CloudVar(...);
</script>
```
