# Client SDK API

## Constructor
`new CloudVar(url, options)`
- `url`: WebSocketサーバーのURL (例: `ws://localhost:5032`)
- `options`:
    - `token`: サーバー認証トークン
    - `mode`: `'ws'` (デフォルト) または `'p2p'`

## Methods
### `join(roomId, password)`
指定したルームに参加します。ルームが存在しない場合は新規作成されます。

### `onChange(key, callback)`
変数の変更を監視します。
- `_joined`: ルーム参加成功時に発火
- `_client_join`: 他のユーザーが参加した時に発火

### `block(id)` / `unblock(id)`
特定ユーザーをブロック/解除します。
