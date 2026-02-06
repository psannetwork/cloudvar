class CloudVar {
    constructor(url, options = {}) {
        this.config = {
            url: url,
            token: options.token || 'default-password',
            mode: options.mode || 'ws'
        };

        this.id = null;
        this.roomId = null;
        this.clientList = [];
        this.blockList = new Set();
        this._rawVars = {};
        this._listeners = new Map();
        this._ws = null;
        this._peers = new Map();

        this._connect();

        return new Proxy(this, {
            get: (target, key) => {
                if (key in target) return target[key];
                return target._rawVars[key];
            },
            set: (target, key, value) => {
                if (typeof key === 'string' && (key.startsWith('_') || key in target)) {
                    target[key] = value;
                    return true;
                }
                if (!(key in window)) this._linkToGlobal(key);
                this._set(key, value);
                return true;
            }
        });
    }

    // --- Public API ---

    join(roomId, password = null) {
        this.roomId = roomId;
        this._sendWS({ type: 'join', roomId, password, token: this.config.token });
    }

    block(id) { this.blockList.add(id); if (this._peers.has(id)) { this._peers.get(id).conn.close(); this._peers.delete(id); } }
    unblock(id) { this.blockList.delete(id); }

    // --- Internal ---

    _linkToGlobal(key) {
        Object.defineProperty(window, key, {
            get: () => this._rawVars[key],
            set: (val) => this._set(key, val),
            configurable: true
        });
    }

    _set(key, value) {
        if (!this.roomId || this._rawVars[key] === value) return;
        this._rawVars[key] = value;
        const payload = { type: 'set', key, value, roomId: this.roomId };
        if (this.config.mode === 'p2p') this._broadcastP2P(payload);
        this._sendWS(payload);
        this._emit(key, value);
    }

    _connect() {
        this._ws = new WebSocket(this.config.url);
        this._ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.sender && this.blockList.has(msg.sender)) return;

            switch(msg.type) {
                case 'join_ok':
                    this.id = msg.id;
                    this.clientList = msg.clients;
                    Object.assign(this._rawVars, msg.data);
                    Object.keys(msg.data).forEach(k => { if(!(k in window)) this._linkToGlobal(k); this._emit(k, msg.data[k]); });
                    this._emit('_joined', msg.roomId);
                    if (this.config.mode === 'p2p') this.clientList.forEach(p => p !== this.id && this._connectP2P(p, true));
                    break;
                case 'update':
                    if (!(msg.key in window)) this._linkToGlobal(msg.key);
                    this._rawVars[msg.key] = msg.value;
                    this._emit(msg.key, msg.value);
                    break;
                case 'client_join':
                    if (!this.clientList.includes(msg.id)) this.clientList.push(msg.id);
                    this._emit('_client_join', msg.id);
                    if (this.config.mode === 'p2p') this._connectP2P(msg.id, true);
                    break;
                case 'client_leave':
                    this.clientList = this.clientList.filter(i => i !== msg.id);
                    this._emit('_client_leave', msg.id);
                    break;
                case 'signal':
                    if (this.config.mode === 'p2p') this._handleSignal(msg.from, msg.data);
                    break;
            }
        };
        this._ws.onclose = () => setTimeout(() => this._connect(), 2000);
    }

    _sendWS(data) { if (this._ws.readyState === WebSocket.OPEN) this._ws.send(JSON.stringify(data)); }

    _emit(key, value) { if (this._listeners.has(key)) this._listeners.get(key).forEach(cb => cb(value)); }
    onChange(key, callback) {
        if (!this._listeners.has(key)) this._listeners.set(key, new Set());
        this._listeners.get(key).add(callback);
    }

    // P2P Logic (簡略化)
    _connectP2P(peerId, init) { /* WebRTC Connection Logic */ }
    _handleSignal(peerId, data) { /* Signal Logic */ }
    _broadcastP2P(data) { /* Broadcast Logic */ }
}