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
            this.sdk.onChange('*', (key, value) => this.updateAll(key, value));
            document.addEventListener('input', (e) => {
                const key = e.target.getAttribute('cv-bind');
                if (key) this.sdk[key] = e.target.value;
            });
            document.addEventListener('click', (e) => this.handleEvent(e, 'click'));
            document.addEventListener('submit', (e) => this.handleEvent(e, 'submit'));
            window.addEventListener('DOMContentLoaded', () => this.scan());
        }
        handleEvent(e, eventName) {
            const target = e.target.closest(`[cv-on^="${eventName}:"]`);
            if (!target) return;
            const expr = target.getAttribute('cv-on').split(':')[1].trim();
            e.preventDefault();
            this.evaluate(expr);
        }
        evaluate(expr) {
            if (expr.endsWith('++')) {
                const key = expr.slice(0, -2).trim();
                this.sdk[key] = (Number(this.sdk[key]) || 0) + 1;
            } else if (expr.endsWith('--')) {
                const key = expr.slice(0, -2).trim();
                this.sdk[key] = (Number(this.sdk[key]) || 0) - 1;
            } else if (expr.includes('=')) {
                const [key, val] = expr.split('=').map(s => s.trim());
                const cleanVal = val.replace(/^['"]|['"]$/g, '');
                this.sdk[key] = isNaN(Number(cleanVal)) ? cleanVal : Number(cleanVal);
            } else if (expr.startsWith('!')) {
                const key = expr.slice(1).trim();
                this.sdk[key] = !this.sdk[key];
            }
        }
        scan() {
            Object.keys(this.sdk._rawVars).forEach(key => this.updateAll(key, this.sdk._rawVars[key]));
        }
        updateAll(key, value) {
            this.updateBind(key, value);
            this.updateShowHide(key, value);
            this.updateClass(key, value);
        }
        updateBind(key, value) {
            document.querySelectorAll(`[cv-bind="${key}"]`).forEach(el => {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                    if (el.value !== String(value)) el.value = value;
                } else {
                    if (el.innerText !== String(value)) el.innerText = value;
                }
            });
        }
        updateShowHide(key, value) {
            document.querySelectorAll(`[cv-show="${key}"]`).forEach(el => el.style.display = value ? '' : 'none');
            document.querySelectorAll(`[cv-hide="${key}"]`).forEach(el => el.style.display = value ? 'none' : '');
        }
        updateClass(key, value) {
            document.querySelectorAll(`[cv-class^="${key}:"]`).forEach(el => {
                const className = el.getAttribute('cv-class').split(':')[1].trim();
                if (value) el.classList.add(className);
                else el.classList.remove(className);
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
