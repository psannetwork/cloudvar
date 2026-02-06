# サーバー設定ガイド

`src/config.js` を書き換えることでサーバーの挙動をカスタマイズできます。

## 起動方法
サーバーのメインエントリは `src/server/index.js` です。
```bash
npm start
# または
node src/server/index.js
```

## 主要な項目
- `port`: サーバーが待機するポート。
- `token`: サーバー全体の接続パスワード。
- `redis`: RedisサーバーのURL。設定すると複数サーバー間で同期します。
- `roomExpirationMs`: ルームが空になってから、データがメモリから削除されるまでの時間（ミリ秒）。
- `rateLimitMs`: 同一ユーザーからの送信間隔（ミリ秒）。連投による負荷を抑えます。
- `maxVariableSize`: 1つの変数に入れられるデータの最大サイズ（バイト）。

## 環境変数
`.env` ファイルを作成して上書きすることも可能です。
```env
PORT=9000
TOKEN=my-secure-token
REDIS_URL=redis://localhost:6379
```
