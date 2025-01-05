// WebSocketのインスタンスを作成
let ws;

// システムID（動的に設定）
let systemId = null;

// serverInit関数でサーバー接続の準備を行う
function serverInit(initialSystemId) {
  // WebSocketのインスタンスを作成
  ws = new WebSocket('ws://localhost:5032');

  // WebSocket接続が成功したときの処理
  ws.onopen = () => {
    console.log('Connected to server');
    
    // システムIDが最初に設定されていない場合、設定
    if (initialSystemId) {
      systemId = initialSystemId;  // systemId をここで設定
      console.log('Using systemId:', systemId);

      // 最初のメッセージでシステムIDをサーバーに送信する
      sendMessage('Hello from client!', 'This is message 2');
    }
  };

  // メッセージを受信したときの処理
  ws.onmessage = (event) => {
    const receivedData = JSON.parse(event.data);
    console.log('Received data:', receivedData);

    // サーバーから返された新しいsystemIdを受け取って設定することもできます
    if (receivedData.systemId) {
      systemId = receivedData.systemId;
      console.log('Received new systemId:', systemId);
    }
  };

  // エラー処理
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  // 接続が閉じられたときの処理
  ws.onclose = () => {
    console.log('Connection closed');
  };
}

// sendMessage関数の定義
function sendMessage(message1, message2) {
  if (!systemId) {
    console.log('System ID is not set. Cannot send message.');
    return;
  }

  const message = {
    systemId: systemId,  // システムID
    data1: message1,     // メッセージ1
    data2: message2      // メッセージ2
  };

  // メッセージをサーバーに送信
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log('Sent messages:', message1, message2);
  } else {
    console.log('WebSocket is not open, cannot send message');
  }
}

// 任意のsystemIdでサーバー接続を開始
const initialSystemId = 'system123';  // 任意のシステムIDを設定
serverInit(initialSystemId);
