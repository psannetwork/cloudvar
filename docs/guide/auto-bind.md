# マジック属性 (Magic Attributes)

CloudVarの核心であるHTML属性の使い方です。これらを組み合わせるだけで、JavaScriptを書かずにアプリを作れます。

## `cv-bind`
変数の値を要素に同期します。双方向バインディング（入力⇔変数）と単方向バインディング（変数⇒表示）の両方に対応しています。

```html
<!-- 入力フォーム: 入力した内容が変数 'message' に即座に反映されます -->
<input type="text" cv-bind="message">

<!-- テキスト表示: 変数 'message' の内容が表示されます -->
<p>入力内容: <span cv-bind="message"></span></p>
```

## `cv-local`
`cv-bind` と同じですが、**サーバーへの送信を行いません**。
入力中の下書きや、自分だけの状態管理に使用します。

```html
<!-- 入力中は送信されず、送信ボタンを押した時だけ送る例 -->
<input type="text" cv-local="draft">
<button cv-on="click: message = draft; draft = ''">送信</button>
```

## `cv-on`
イベントが発生したときに、属性内の式を実行します。
形式: `イベント名: 式1; 式2; ...`

```html
<!-- クリックでスコアを加算 -->
<button cv-on="click: score++">点数アップ</button>

<!-- フォーム送信時にチャットログに追加して送信 -->
<form cv-on="submit: log += msg + BR; msg = ''">...</form>
```

### 使える式とキーワード
- **代入・計算**: `=`, `+=`, `++`, `--`, `!`
- **システム定数**:
  - `ID`: 自分のID
  - `COUNT`: 接続人数
  - `TIME`: 現在時刻 (ミリ秒)
  - `RAND`: 0〜1のランダム値
  - `BR`: 改行コード
- **命令**:
  - `ALERT('msg')`: アラート表示
  - `LOG('msg')`: コンソールログ
  - `UNSYNC('key')`: 同期解除

## `cv-show` / `cv-hide`
変数の値が真（True/値あり）か偽（False/空）かによって、要素の表示/非表示を切り替えます。

```html
<!-- 管理者フラグがONのときだけ表示 -->
<div cv-show="isAdmin">管理者メニュー</div>

<!-- ロード中は隠す -->
<div cv-hide="isLoading">コンテンツ</div>
```

## `cv-class`
条件によってCSSクラスを付け外しします。
形式: `条件変数: クラス名`

```html
<!-- isOnline が真なら 'active' クラスをつける -->
<div class="status-dot" cv-class="isOnline: active"></div>
```

## `cv-app`
複数の CloudVar インスタンスを使い分ける場合に使用します。

```html
<!-- 'game' インスタンスの変数を扱う -->
<div cv-app="game">
  <span cv-bind="score"></span>
</div>
```
