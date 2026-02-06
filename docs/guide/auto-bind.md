# オートバインド (cv-bind) と HTMLロジック

JavaScriptを書かずに、HTML属性だけでアプリケーションのロジックを構築できます。

## 1. データの表示・同期
`cv-bind` を使うと、変数の値が表示され、入力フォームでは双方向に同期されます。

```html
<h1 cv-bind="score">0</h1>
<input cv-bind="username">
```

## 2. 表示の切り替え (cv-show / cv-hide)
変数の値（真偽値）によって、要素を表示したり隠したりします。

```html
<!-- isGameover が true の時だけ表示 -->
<div cv-show="isGameover">
    GAME OVER
</div>

<!-- isLogin が true の時は隠す -->
<button cv-hide="isLogin">ログイン</button>
```

## 3. スタイルの切り替え (cv-class)
変数が `true` の時だけ、指定したCSSクラスを適用します。

```html
<!-- isActive が true なら "active-btn" クラスをつける -->
<button cv-class="isActive: active-btn">押してね</button>
```

## 4. イベント処理 (cv-on)
**これぞ究極の手抜き！** JavaScriptの `onclick` すら書かずに変数を操作できます。

### 構文
`cv-on="イベント名: 式"`

### 使える式の例
- `score++`: 数値を1増やす
- `score--`: 数値を1減らす
- `isActive = true`: 値を代入する
- `!isActive`: true/falseを反転（トグル）

```html
<!-- クリックでスコア加算 -->
<button cv-on="click: score++">点数アップ</button>

<!-- クリックで表示切り替え -->
<button cv-on="click: !isVisible">表示トグル</button>

<!-- 送信で名前セット -->
<form cv-on="submit: isSent = true">
    ...
</form>
```