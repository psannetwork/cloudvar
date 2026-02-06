# クイックスタートガイド

CloudVarは、JavaScriptだけでなく、HTMLとも直接同期します。

## 🌟 ゼロコード・シンク (Auto Bind)
JavaScriptで `document.getElementById` や `innerText` を書く必要はありません。

### 手順
1. **HTMLに `cv-bind` 属性を書く**
```html
<h1 cv-bind="score">0</h1>
<input cv-bind="username">
```

2. **JavaScriptで値を代入するだけ**
```javascript
const cv = new CloudVar('ws://localhost:8080', { room: 'game1' });

score = 100; // これだけでHTMLの <h1> が "100" に変わります
```

## 双方向バインディング
`<input>` 要素に `cv-bind` を設定すると、ユーザーが文字を入力した瞬間にその変数が書き換わり、世界中の他のユーザーの画面も同時に更新されます。

## 監視したい場合 (任意)
特殊な処理（音を鳴らす、エフェクトを出すなど）が必要な場合のみ、`onChange` を使用してください。
```javascript
cv.onChange('score', val => {
  playSound();
});
```
