class Network {
    constructor(sdk) {
        this.sdk = sdk;
        this.ws = null;
        this.peers = new Map();
    }

    connect() {
        this.ws = new WebSocket(this.sdk.config.url);
        this.ws.onopen = () => {
            if (this.sdk.roomId) this.sdk.join(this.sdk.roomId);
        };
        this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
        this.ws.onclose = () => setTimeout(() => this.connect(), 2000);
    }

    handleMessage(msg) {
        if (msg.sender && this.sdk.blockList.has(msg.sender)) return;
        this.sdk._onNetworkMessage(msg);
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = Network;
}
if (typeof window !== 'undefined') {
    window.CloudVarNetwork = Network;
}
