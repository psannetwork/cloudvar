# 通信プロトコル仕様 (Protocol)

CloudVarのクライアントとサーバー間のメッセージ仕様です。通常、SDK利用者が意識する必要はありません。

## クライアント -> サーバー

### `join` (ルーム参加)
```json
{
  "type": "join",
  "roomId": "string",
  "password": "string|null",
  "token": "string"
}
```

### `set` (変数の更新)
```json
{
  "type": "set",
  "key": "string",
  "value": "any",
  "target": "clientId|null"
}
```

## サーバー -> クライアント

### `join_ok` (参加成功)
参加時のルームの全データと、現在の参加者リストが送られます。
```json
{
  "type": "join_ok",
  "id": "myClientId",
  "data": { "key": "value", ... },
  "clients": ["id1", "id2", ...]
}
```

### `update` (他者の更新)
```json
{
  "type": "update",
  "key": "string",
  "value": "any",
  "sender": "clientId"
}
```

## ルームの消滅について
サーバー側で全員が退出したことが検知されると、タイマーが開始されます。タイマー満了前に誰も再接続しなかった場合、その `roomId` に紐付くデータはメモリ上から破棄されます。