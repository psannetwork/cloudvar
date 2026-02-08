# サーバー設定ガイド

CloudVar Serverは、単体起動とライブラリ組み込みの両方に対応しています。

## 単体起動 (CLI)
```bash
npm install -g cloudvar
cloudvar-server --port 5032
```

## ライブラリとして使用 (Node.js)
```javascript
const CloudVarServer = require('cloudvar');

const server = new CloudVarServer({
  port: 5032,
  // 既存のhttpサーバーを利用する場合
  // server: myHttpServer 
});

server.start();
```

## 設定項目 (src/config.js)
| 項目 | デフォルト | 説明 |
|:---|:---|:---|
| `port` | 5032 | 待ち受けポート |
| `roomExpirationMs` | 300,000 | 誰もいなくなった部屋を消すまでの時間(5分) |
| `maxPayloadSize` | 1024 | 1つの変数の最大サイズ(1KB) |

## Redisによるスケーリング
`config.js` にRedisのURLを記述することで、複数のサーバー間でデータを同期させることが可能です（将来対応予定）。