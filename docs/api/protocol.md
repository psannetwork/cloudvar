# Protocol Specification

## Messages
### Client -> Server
- `join`: ルームへの参加リクエスト
- `set`: 変数の更新
- `signal`: P2P確立のためのシグナリング

### Server -> Client
- `join_ok`: 参加成功通知と初期データ
- `update`: 他クライアントからの変数更新通知
- `client_join` / `client_leave`: 在室ユーザーの変化
