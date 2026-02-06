# クライアントSDK 詳細リファレンス

## コンストラクタ
`new CloudVar(url, options)`
- `options.room`: 自動参加するルーム名。

---

## メソッド

### `onChange(key, callback)`
- `key` に `"*"` を指定すると、**すべての変数の更新**を監視できます。
    - `callback(key, value)` という形式で引数を受け取ります。

## マジック属性 (Magic Attributes)
HTML属性だけでロジックを完結させることができます。

### `cv-bind="variableName"`
- **対象**: 全要素
- **挙動**: 変数の値を要素に同期します。
    - `innerText` を更新: `<div>`, `<span>`, `<h1>` など
    - `value` を更新: `<input>`, `<textarea>`, `<select>`
- **双方向同期**: フォーム要素に入力された値は即座に変数へ反映されます。

### `cv-show="variableName"` / `cv-hide="variableName"`
- **挙動**: 変数が真値（truthy）の時に、要素の `display` スタイルを制御します。

### `cv-class="variableName: className"`
- **挙動**: 変数が真値の時に指定したCSSクラスを付与し、偽値の時に削除します。

### `cv-on="eventName: expression"`
- **対応イベント**: `click`, `submit` など
- **利用可能な式 (Expression)**:
    - `key++` / `key--`: 数値を1増減
    - `key = value`: 値の代入
    - `!key`: 真偽値の反転（トグル）

---

## メソッド
