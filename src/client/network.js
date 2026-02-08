class Network {
    constructor(sdk) {
        this.sdk = sdk;
        this.ws = null;
        this.peers = new Map();
        this.mode = sdk.config.mode || 'ws'; // 'ws' or 'p2p'
    }

    connect() {
        this.ws = new WebSocket(this.sdk.config.url);
        this.ws.onopen = () => {
            if (this.sdk.roomId) this.sdk.join(this.sdk.roomId);
        };
        this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
        this.ws.onclose = () => setTimeout(() => this.connect(), 2000);

        if (this.mode === 'p2p') {
            this.setupWebRTC();
        }
    }

    setupWebRTC() {
        console.log('[INFO] P2P Mode enabled. WebRTC mesh setup in progress...');
    }

    handleMessage(msg) {
        if (msg.sender && this.sdk.blockList && this.sdk.blockList.has(msg.sender)) return;

        if (msg.type === 'rtc_signal') {
            this.handleRTCSignal(msg);
            return;
        }

        this.sdk._onNetworkMessage(msg);
    }

    handleRTCSignal(msg) {
    }

    send(data) {
        if (this.mode === 'p2p' && this.peers.size > 0 && data.type === 'set') {
            this.broadcastP2P(data);
            return;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    broadcastP2P(data) {
        const payload = JSON.stringify(data);
        this.peers.forEach(peer => {
            if (peer.channel && peer.channel.readyState === 'open') {
                peer.channel.send(payload);
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.CloudVarNetwork = Network;
}
