# 📖 CloudVar ドキュメント

CloudVarは、一切のコードを書かずにリアルタイム体験を作るためのフレームワークです。

## 🧭 ガイド
1. [クイックスタート](./guide/getting-started.md) - 5分でチャットを作る
2. [マジック属性の使い方](./guide/auto-bind.md) - 属性による「魔法」の詳細
3. [ルームとデータ分離](./guide/rooms.md) - 部屋の概念とデータの独立性
4. [P2PとWebSocket](./guide/getting-started.md#⚡️-同期モードの切り替え) - 通信モードの選択

## 🛠 APIリファレンス
- [Client SDK API](./api/client-sdk.md) - JSからの操作
- [Server Config](./api/server-config.md) - サーバーの設定と構築

## 💡 逆引きレシピ

### 特定のイベントで音を鳴らしたい
```javascript
cv.onChange('score', () => new Audio('pop.mp3').play());
```

### 自分だけに表示する「入力中...」を作りたい
`cv-local` 属性を使います。
```html
<input type="text" cv-local="typing">
<p cv-show="typing">入力しています...</p>
```

### 配列のようにデータを扱いたい
現在のCloudVarは文字列ベースの同期に最適化されています。`+=` を活用してください。
```html
<button cv-on="click: log += 'Action!\n'">記録</button>
```

## 🎨 デザインガイド
CloudVarの属性はCSSと相性が抜群です。
```html
<div cv-class="active: is-online"></div>
```
このように書くことで、誰かがオンラインになった瞬間に画面上のドットを緑色にする、といった演出がCSSだけで完結します。
