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
        // P2P (WebRTC) Mesh Network のセットアップ (将来的な拡張)
        // 信号のやり取りには依然として WebSocket を使用する
        console.log('[INFO] P2P Mode enabled. WebRTC mesh setup in progress...');
    }

    handleMessage(msg) {
        if (msg.sender && this.sdk.blockList.has(msg.sender)) return;

        // WebRTC 信号メッセージの処理
        if (msg.type === 'rtc_signal') {
            this.handleRTCSignal(msg);
            return;
        }

        this.sdk._onNetworkMessage(msg);
    }

    handleRTCSignal(msg) {
        // WebRTC 信号処理ロジック
    }

    send(data) {
        // P2Pモードが有効で、かつピアが接続されている場合はP2P経由で送る
        if (this.mode === 'p2p' && this.peers.size > 0 && data.type === 'set') {
            this.broadcastP2P(data);
            return;
        }

        // 基本は WebSocket 経由で送信
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

if (typeof module !== 'undefined') {
    module.exports = Network;
}
if (typeof window !== 'undefined') {
    window.CloudVarNetwork = Network;
}