/**
 * CloudVar Client SDK
 * Build Date: 2026-02-06T22:03:52.950Z
 */

// --- index.js ---
(function(){
/**
 * CloudVar 共通ユーティリティ
 */

const utils = {
    /**
     * ランダムなIDを生成する (7文字)
     */
    generateId: () => Math.random().toString(36).substring(2, 9),

    /**
     * オブジェクトや値のサイズ（バイト）を概算する
     */
    byteSize: (obj) => {
        const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
        return new TextEncoder().encode(str).length;
    },

    /**
     * ロギング（将来的に環境によって出力を変えるなどの拡張が可能）
     */
    log: (msg, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${msg}`);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    
} else {
    window.CloudVarUtils = utils;
}

})();

// --- network.js ---
(function(){
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

if (typeof module !== 'undefined') 
else window.CloudVarNetwork = Network;

})();

// --- binding.js ---
(function(){
class Binding {
    constructor(sdk) {
        this.sdk = sdk;
        this.setup();
    }

    setup() {
        if (typeof document === 'undefined') return;

        // 全変数の変更を監視してUI更新
        this.sdk.onChange('*', (key, value) => {
            this.updateAll(key, value);
        });

        // 入力を変数に反映 (双方向)
        document.addEventListener('input', (e) => {
            const key = e.target.getAttribute('cv-bind');
            if (key) this.sdk[key] = e.target.value;
        });

        // 🌟 cv-on イベントリスナー (クリックなどで変数を操作)
        // 例: cv-on="click: score++"
        document.addEventListener('click', (e) => this.handleEvent(e, 'click'));
        document.addEventListener('submit', (e) => this.handleEvent(e, 'submit'));

        window.addEventListener('DOMContentLoaded', () => this.scan());
    }

    // イベントハンドリング (簡易的な式評価)
    handleEvent(e, eventName) {
        const target = e.target.closest(`[cv-on^="${eventName}:"]`);
        if (!target) return;

        const attr = target.getAttribute('cv-on'); // "click: score++"
        const expression = attr.split(':')[1].trim(); // "score++"

        e.preventDefault();
        this.evaluate(expression);
    }

    // 簡易式評価エンジン
    evaluate(expr) {
        // score++ / score--
        if (expr.endsWith('++')) {
            const key = expr.slice(0, -2).trim();
            this.sdk[key] = (Number(this.sdk[key]) || 0) + 1;
            return;
        }
        if (expr.endsWith('--')) {
            const key = expr.slice(0, -2).trim();
            this.sdk[key] = (Number(this.sdk[key]) || 0) - 1;
            return;
        }
        // key = value
        if (expr.includes('=')) {
            const [key, val] = expr.split('=').map(s => s.trim());
            // 文字列の場合はクォートを外す簡易処理
            const cleanVal = val.replace(/^['"]|['"]$/g, ''); 
            // 数字なら数字に変換
            this.sdk[key] = isNaN(Number(cleanVal)) ? cleanVal : Number(cleanVal);
            return;
        }
        // toggle key (真偽値反転)
        if (expr.startsWith('!')) {
            const key = expr.slice(1).trim();
            this.sdk[key] = !this.sdk[key];
        }
    }

    scan() {
        // 既存の変数を全て画面に反映
        Object.keys(this.sdk._rawVars).forEach(key => this.updateAll(key, this.sdk._rawVars[key]));
    }

    updateAll(key, value) {
        this.updateBind(key, value);
        this.updateShowHide(key, value);
        this.updateClass(key, value);
    }

    // cv-bind: テキストや入力値の同期
    updateBind(key, value) {
        document.querySelectorAll(`[cv-bind="${key}"]`).forEach(el => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
                if (el.value !== String(value)) el.value = value;
            } else {
                if (el.innerText !== String(value)) el.innerText = value;
            }
        });
    }

    // cv-show / cv-hide: 表示・非表示
    updateShowHide(key, value) {
        // cv-show="key" -> trueなら表示
        document.querySelectorAll(`[cv-show="${key}"]`).forEach(el => {
            el.style.display = value ? '' : 'none';
        });
        // cv-hide="key" -> trueなら消す
        document.querySelectorAll(`[cv-hide="${key}"]`).forEach(el => {
            el.style.display = value ? 'none' : '';
        });
    }

    // cv-class="key: className" -> trueならクラスをつける
    updateClass(key, value) {
        document.querySelectorAll(`[cv-class^="${key}:"]`).forEach(el => {
            const className = el.getAttribute('cv-class').split(':')[1].trim();
            if (value) el.classList.add(className);
            else el.classList.remove(className);
        });
    }
}

if (typeof module !== 'undefined') 
else window.CloudVarBinding = Binding;
})();

// --- index.js ---
(function(){
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

        // モジュール初期化
        this._utils = typeof CloudVarUtils !== 'undefined' ? CloudVarUtils : require('../utils');
        this._network = new (typeof CloudVarNetwork !== 'undefined' ? CloudVarNetwork : require('./network'))(this);
        this._binding = new (typeof CloudVarBinding !== 'undefined' ? CloudVarBinding : require('./binding'))(this);

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

if (typeof module !== 'undefined' && module.exports) 
else window.CloudVar = CloudVar;

})();

