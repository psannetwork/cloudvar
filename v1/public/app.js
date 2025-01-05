
let ws;

let systemId = null;

function getWebSocketURL() {
  const protocol = 'wss://';
  const host = 'cloudvar.psannetwork.net';
  return `${protocol}${host}`;
}

function serverInit(initialSystemId) {
  const wsURL = getWebSocketURL(); 
  ws = new WebSocket(wsURL);

  ws.onopen = () => {
    console.log('Connected to server:', wsURL);
    
    if (initialSystemId) {
      systemId = initialSystemId;  
      console.log('Using systemId:', systemId);

      sendMessage('Hello from client!', 'This is message 2');
    }
  };

  ws.onmessage = (event) => {
    const receivedData = JSON.parse(event.data);
    const { systemId, data1, data2 } = receivedData;

    if (data1 && data2) {
      eval(`window.${data1} = "${data2}"`);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('Connection closed');
  };
}

function sendMessage(message1, message2) {
  if (!systemId) {
    console.log('System ID is not set. Cannot send message.');
    return;
  }

  const message = {
    systemId: systemId,  
    data1: message1,     
    data2: message2      
  };

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.log('WebSocket is not open, cannot send message');
  }
}

(function() {
  setInterval(() => {
      const globalVariables = Object.keys(window || globalThis);

      const cloudVariables = globalVariables.filter(varName => varName.startsWith("cloudvar_"));

      cloudVariables.forEach(varName => {
          const value = window[varName] || globalThis[varName];

          sendMessage(varName, value);
      });
  }, 500); 
})();



//const initialSystemId = 'system123';  
//serverInit(initialSystemId);
//sendMessage("a", "a")
  
