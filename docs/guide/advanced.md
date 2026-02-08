# 高度な使い方と式評価エンジン

CloudVarの `cv-on` 属性内で使用できる「式評価エンジン」の完全な仕様を解説します。

## 式評価の基本ルール

`cv-on` 内には、JavaScriptに近い直感的なコードを書くことができます。複数の命令を書く場合は `;`（セミコロン）で区切ります。

```html
<button cv-on="click: score++; totalClicks++; log += 'Clicked! ' + BR">実行</button>
```

### サポートされている演算子
- **代入 (`=`)**: `score = 100`
- **追記 (`+=`)**: `chatLog += 'Hello' + BR` (文字列の結合と代入)
- **インクリメント/デクリメント (`++`, `--`)**: `score++`, `lives--`
- **論理反転 (`!`)**: `isOpen = !isOpen` (トグル処理に最適)
- **文字列結合 (`+`)**: `'Level: ' + currentLevel`

### 特殊キーワード (マジック・チップ)
属性内で変数のように使える予約語です。

| チップ | 説明 | 例 |
|:---|:---|:---|
| `BR` | 改行コード (`\n`) | `msg += 'Hi' + BR` |
| `ID` | 自分のクライアントID | `log += ID + ' joined' + BR` |
| `ROOM` | 現在のルーム名 | `title = 'Room: ' + ROOM` |
| `TIME` | 現在のタイムスタンプ | `lastUpdated = TIME` |
| `RAND` | 0〜1のランダムな数値 | `dice = RAND` |
| `COUNT` | 現在の接続人数 | `stats = COUNT + ' people online'` |
| `TRUE` / `FALSE` | 真偽値 | `isOpen = TRUE` |

### 命令チップ (Function Chips)
特定の動作を実行するための関数のようなチップです。

- **`ALERT(msg)`**: アラートを表示します。
  - `cv-on="click: ALERT('Hello ' + nickname)"`
- **`LOG(msg)`**: コンソールにログを出力します。
  - `cv-on="click: LOG('Debug: ' + score)"`
- **`UNSYNC(varName)`**: 指定した変数の同期を解除します。
  - `cv-on="click: UNSYNC('secretData')"`

## 状態による表示の制御 (Reactive UI)

CloudVarは変数の値が変わった瞬間、関係するすべての属性を自動的に再計算します。

### `cv-show` / `cv-hide`
変数が「真 (true, 1, 文字列あり)」か「偽 (false, 0, null, 空文字)」かによって表示を切り替えます。
```html
<p cv-show="isAdmin">管理者メニュー</p>
```

### `cv-class`
条件によってCSSクラスを動的に付け外しします。
```html
<!-- isOnlineが真のときに 'online-dot' クラスを付与 -->
<div class="dot" cv-class="isOnline: online-dot"></div>
```

## JavaScript API による拡張

HTML属性だけでは足りない複雑な処理は、JavaScriptから直接SDKを操作します。

### 更新の監視 (`onChange`)
特定の変数が（自分または他人の操作で）変わった瞬間にコードを実行します。
```javascript
cv.onChange('level', (newLevel) => {
    alert('レベルアップ！: ' + newLevel);
});
```

### 同期の制御 (`unSync`)
特定の変数を一時的に、または永続的にクラウド同期から切り離し、ローカル変数として扱いたい場合に使用します。
```javascript
// 以降、playerNameへの代入はサーバーへ送られず、自分だけの画面に反映される
cv.unSync('playerName');
```

## 通信の仕組み (Technical Detail)

### ネットワーク・キュー
接続が不安定なときや、まだサーバーに繋がっていない状態で変数に代入しても、CloudVarはそれを内部キューに保存します。接続が完了した瞬間に、最新の値をまとめてサーバーへ送信します。

### データの優先順位
新しくルームに参加した際、**サーバー上のデータが常に優先**されます。ローカルで設定していた初期値は、サーバーに既に値がある場合は上書きされます。これにより、後から入ってきた人が既存のゲームスコアやチャット履歴を壊すことを防いでいます。
