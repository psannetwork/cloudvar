# クライアントSDK リファレンス

## `new CloudVar(url, options)`
### Options
- `token`: (String) `config.js`で設定したパスワード。
- `mode`: (String) `'ws'` (標準) または `'p2p'` (低遅延)。

---

## メソッド

### `join(roomId, password)`
指定したルームに参加します。
- `roomId`: 重複しない名前（ゲーム名など）。
- `password`: (任意) ルームへの鍵。

### `onChange(key, callback)`
特定の値が変わった時に実行する関数を登録します。
- **特別なキー**:
  - `_joined`: ルーム参加成功時。
  - `_client_join`: 他の誰かが入室した時。
  - `_client_leave`: 誰かが退室した時。

### `block(clientId)`
特定のユーザーからのデータをすべて拒否します。

---

## プロパティ

### `id`
自分の固有ID。

### `clientList`
現在同じルームにいるユーザーのIDリスト。

### `target`
この値にIDを代入すると、以降の更新はその相手にだけ送信されます（`null`で全員）。
