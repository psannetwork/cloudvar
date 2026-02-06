# オートバインド (cv-bind)

JavaScript側で表示を更新するコードを書かなくても、HTMLに属性を追加するだけで変数の値がリアルタイムに反映されます。

## 表示の同期
HTML要素に `cv-bind="変数名"` を追加します。

```html
<p>現在のスコア: <span cv-bind="score">0</span></p>
```
JavaScriptで `score = 100` と実行すると、`<span>` の中身が自動的に `100` に書き換わります。

## 入力フォームの同期 (双方向)
`<input>`, `<textarea>`, `<select>` に `cv-bind` を使うと、ユーザーが入力を変えた瞬間に変数が更新され、他の全ユーザーにも同期されます。

```html
<input type="text" cv-bind="chatMessage" placeholder="メッセージを入力...">
```

## メリット
- **コードが綺麗になる**: `document.getElementById` や `innerText` の記述が不要になります。
- **直感的**: 「このHTML要素はこの変数を表示する」という関係がHTML上で一目でわかります。
- **高速**: 必要な要素だけをピンポイントで更新するため、パフォーマンスも良好です。
