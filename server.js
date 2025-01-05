const WebSocket = require('ws');
const express = require('express');
const path = require('path');

// Expressアプリのセットアップ
const app = express();
const port = 5032;

// 公開ディレクトリの設定
app.use(express.static(path.join(__dirname, 'public')));

// Expressサーバーを起動
const server = app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});

// WebSocketサーバーをExpressサーバーに統合
const wss = new WebSocket.Server({ server });

let clients = {};

wss.on('connection', (ws) => {
  let systemId = null;

  // クライアントからメッセージを受け取ったときの処理
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // システムIDがまだ設定されていない場合、最初にシステムIDを保存
    if (!systemId) {
      systemId = data.systemId;
      
      // システムIDごとのクライアントリストを作成
      if (!clients[systemId]) {
        clients[systemId] = [];
      }
      clients[systemId].push(ws);

      console.log(`Client connected with System ID: ${systemId}`);
    } else {
      // システムIDが決まっている場合、データを同じシステムIDを持つすべてのクライアントに送信
      const messageToSend = JSON.stringify(data);
      clients[systemId].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(messageToSend);
        }
      });
    }
  });

  // クライアントが切断されたときの処理
  ws.on('close', () => {
    if (systemId && clients[systemId]) {
      // クライアントの切断をリストから削除
      clients[systemId] = clients[systemId].filter(client => client !== ws);

      // システムIDに関連するクライアントがいなくなった場合、そのIDを削除
      if (clients[systemId].length === 0) {
        delete clients[systemId];
      }

      console.log(`Client with System ID: ${systemId} disconnected.`);
    }
  });
});

