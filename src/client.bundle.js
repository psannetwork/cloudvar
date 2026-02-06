/**
 * CloudVar Client Bundle (All-in-One)
 * すべてのクライアント機能を1つのファイルに集約
 */

// 1. Utils
(function() {
    window.CloudVarUtils = {
        generateId: () => Math.random().toString(36).substring(2, 9),
        byteSize: (obj) => {
            const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
            return new TextEncoder().encode(str).length;
        },
        log: (msg, type = 'info') => {
            console.log(`[${new Date().toLocaleTimeString()}] [${type.toUpperCase()}] ${msg}`);
        }
    };
})();

// 2. Network
(function() {
    class Network {
        constructor(sdk) {
            this.sdk = sdk;
            this.ws = null;
        }
        connect() {
            this.ws = new WebSocket(this.sdk.config.url);
            this.ws.onopen = () => { if (this.sdk.roomId) this.sdk.join(this.sdk.roomId); };
            this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
            this.ws.onclose = () => setTimeout(() => this.connect(), 2000);
        }
        handleMessage(msg) {
            if (msg.sender && this.sdk.blockList.has(msg.sender)) return;
            this.sdk._onNetworkMessage(msg);
        }
        send(data) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data));
        }
    }
    window.CloudVarNetwork = Network;
})();

// 3. Binding
(function() {
    class Binding {
        constructor(sdk) {
            this.sdk = sdk;
            this.setup();
        }
        setup() {
            if (typeof document === 'undefined') return;
            this.sdk.onChange('*', (key, value) => this.updateElements(key, value));
            document.addEventListener('input', (e) => {
                const key = e.target.getAttribute('cv-bind');
                if (key) this.sdk[key] = e.target.value;
            });
            window.addEventListener('DOMContentLoaded', () => this.scan());
        }
        scan() {
            document.querySelectorAll('[cv-bind]').forEach(el => {
                const key = el.getAttribute('cv-bind');
                const val = this.sdk._rawVars[key];
                if (val !== undefined) this.updateElements(key, val);
            });
        }
        updateElements(key, value) {
            const elements = document.querySelectorAll(`[cv-bind="${key}"]`);
            elements.forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                    if (el.value !== String(value)) el.value = value;
                } else {
                    if (el.innerText !== String(value)) el.innerText = value;
                }
            });
        }
    }
    window.CloudVarBinding = Binding;
})();

// 4. Main SDK (CloudVar)
(function() {
    class CloudVar {
        constructor(url, options = {}) {
            this.config = { url, token: options.token || 'default', mode: options.mode || 'ws', room: options.room || null };
            this.id = null;
            this.roomId = this.config.room;
            this.joined = false;
            this.clientList = [];
            this.blockList = new Set();
            this._rawVars = {};
            this._pendingSets = [];
            this._listeners = new Map();

            // Bundle内ではグローバルから取得
            this._utils = window.CloudVarUtils;
            this._network = new window.CloudVarNetwork(this);
            this._binding = new window.CloudVarBinding(this);

            this._network.connect();

            return new Proxy(this, {
                get: (target, key) => {
                    if (key in target || typeof key === 'symbol') return target[key];
                    return target._rawVars[key];
                },
                set: (target, key, value) => {
                    if (typeof key === 'string' && (key.startsWith('_') || key in target)) {
                        target[key] = value; return true;
                    }
                    if (!(key in window) && typeof key === 'string') target._linkToGlobal(key);
                    target._set(key, value);
                    return true;
                }
            });
        }

        join(roomId, password = null) {
            this.roomId = roomId;
            this._network.send({ type: 'join', roomId, password, token: this.config.token });
        }

        _set(key, value) {
            this._rawVars[key] = value;
            const payload = { type: 'set', key, value, roomId: this.roomId };
            if (!this.joined) this._pendingSets.push(payload);
            else this._network.send(payload);
            this._emit(key, value);
            this._emit('*', value, key);
        }

        _onNetworkMessage(msg) {
            switch(msg.type) {
                case 'join_ok':
                    this.joined = true;
                    this.id = msg.id;
                    this.clientList = msg.clients;
                    Object.assign(this._rawVars, msg.data);
                    while (this._pendingSets.length > 0) this._network.send(this._pendingSets.shift());
                    Object.keys(this._rawVars).forEach(k => {
                        if(!(k in window)) this._linkToGlobal(k);
                        this._emit(k, this._rawVars[k]);
                        this._emit('*', this._rawVars[k], k);
                    });
                    this._emit('_joined', msg.roomId);
                    break;
                case 'update':
                    if (!(msg.key in window)) this._linkToGlobal(msg.key);
                    this._rawVars[msg.key] = msg.value;
                    this._emit(msg.key, msg.value);
                    this._emit('*', msg.value, msg.key);
                    break;
                case 'client_join':
                    if (!this.clientList.includes(msg.id)) this.clientList.push(msg.id);
                    this._emit('_client_join', msg.id);
                    break;
                case 'client_leave':
                    this.clientList = this.clientList.filter(id => id !== msg.id);
                    this._emit('_client_leave', msg.id);
                    break;
            }
        }

        _linkToGlobal(key) {
            Object.defineProperty(window, key, {
                get: () => this._rawVars[key],
                set: (val) => this._set(key, val),
                configurable: true
            });
        }

        _emit(key, value, extra) {
            if (this._listeners.has(key)) {
                this._listeners.get(key).forEach(cb => key === '*' ? cb(extra, value) : cb(value));
            }
        }

        onChange(key, callback) {
            if (!this._listeners.has(key)) this._listeners.set(key, new Set());
            this._listeners.get(key).add(callback);
        }
    }
    window.CloudVar = CloudVar;
})();
