/**
 * CloudVar Client SDK
 * Build Date: 2026-02-07T01:44:51.414Z
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

if (typeof window !== 'undefined') {
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

if (typeof window !== 'undefined') {
    window.CloudVarNetwork = Network;
}

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

        this.sdk.onChange('*', (key, value) => {
            this.updateAll(key, value);
        });

        document.addEventListener('input', (e) => {
            const key = e.target.getAttribute('cv-bind');
            if (key) this.sdk[key] = e.target.value;
        });

        document.addEventListener('click', (e) => this.handleEvent(e, 'click'));
        document.addEventListener('submit', (e) => this.handleEvent(e, 'submit'), true);

        window.addEventListener('DOMContentLoaded', () => this.scan());
    }

    handleEvent(e, eventName) {
        // 🌟 target (実際にクリック等された要素) または currentTarget (formなど) から属性を探す
        const target = (e.target.closest && e.target.closest(`[cv-on^="${eventName}:"]`)) || 
                     (e.currentTarget && e.currentTarget.getAttribute && e.currentTarget.getAttribute('cv-on')?.startsWith(eventName + ':') ? e.currentTarget : null);
        
        if (!target) {
            // もし見つからなければ、さらに親を辿る（バブリング対策）
            let el = e.target;
            while (el && el.getAttribute) {
                const attr = el.getAttribute('cv-on');
                if (attr && attr.startsWith(eventName + ':')) {
                    this._executeEvent(e, el);
                    return;
                }
                el = el.parentElement;
            }
            return;
        }

        this._executeEvent(e, target);
    }

    _executeEvent(e, element) {
        const attr = element.getAttribute('cv-on');
        const firstColonIndex = attr.indexOf(':');
        const expressionPart = attr.substring(firstColonIndex + 1);
        const expressions = expressionPart.split(';');

        e.preventDefault();
        expressions.forEach(expr => this.evaluate(expr.trim()));
    }

    evaluate(expr) {
        if (!expr) return;
        // console.log('Evaluating:', expr); // デバッグ用

        // key += value (追記)
        if (expr.includes('+=')) {
            const [key, valExpr] = expr.split('+=').map(s => s.trim());
            const val = this.resolveValue(valExpr);
            this.sdk[key] = (this.sdk[key] || "") + val;
            return;
        }

        // key = value (代入)
        if (expr.includes('=')) {
            const [key, valExpr] = expr.split('=').map(s => s.trim());
            this.sdk[key] = this.resolveValue(valExpr);
            return;
        }

        // ++ / --
        if (expr.endsWith('++')) {
            const key = expr.slice(0, -2).trim();
            this.sdk[key] = (Number(this.sdk[key]) || 0) + 1;
        } else if (expr.endsWith('--')) {
            const key = expr.slice(0, -2).trim();
            this.sdk[key] = (Number(this.sdk[key]) || 0) - 1;
        } else if (expr.startsWith('!')) {
            const key = expr.slice(1).trim();
            this.sdk[key] = !this.sdk[key];
        }
    }

    resolveValue(valExpr) {
        if (!valExpr) return "";
        
        // 文字列の足し算 'a' + b + 'c'
        if (valExpr.includes('+')) {
            return valExpr.split('+').map(part => this.resolveValue(part.trim())).join('');
        }

        // 文字列定数 'hello' "world"
        if (/^['"].*['"]$/.test(valExpr)) {
            return valExpr.replace(/^['"]|['"]$/g, '');
        }
        // 数値
        if (!isNaN(Number(valExpr)) && valExpr !== '') {
            return Number(valExpr);
        }
        // 他の変数名
        const val = this.sdk[valExpr];
        // 🌟 変数が存在しないか undefined の場合は、
        // 文字列結合なら空文字、数値演算なら0として扱う
        return val !== undefined ? val : "";
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

if (typeof window !== 'undefined') {
    window.CloudVarBinding = Binding;
}
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
        this._utils = typeof CloudVarUtils !== 'undefined' ? CloudVarUtils : null;
        this._network = new (typeof CloudVarNetwork !== 'undefined' ? CloudVarNetwork : null)(this);
        this._binding = new (typeof CloudVarBinding !== 'undefined' ? CloudVarBinding : null)(this);

        this._network.connect();

        // 🌟 HTML内をスキャンして、使われている変数をいきなり使えるようにする
        this._scanAndLink();

        return new Proxy(this, {
            get: (target, key) => {
                if (key in target || typeof key === 'symbol') return target[key];
                return target._rawVars[key];
            },
            set: (target, key, value) => {
                if (typeof key === 'string' && (key.startsWith('_') || key in target)) {
                    target[key] = value; return true;
                }
                if (typeof key === 'string') target._linkToGlobal(key);
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
                    this._linkToGlobal(k);
                    this._emit(k, this._rawVars[k]);
                    this._emit('*', this._rawVars[k], k);
                });
                this._emit('_joined', msg.roomId);
                break;
            case 'update':
                this._linkToGlobal(msg.key);
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
        if (typeof window === 'undefined') return;
        try {
            const desc = Object.getOwnPropertyDescriptor(window, key);
            if (desc && !desc.configurable) return;

            // 既にCloudVarによって定義済みならスキップ
            if (desc && desc.set && desc.set._isCloudVar) return;

            const setter = (val) => this._set(key, val);
            setter._isCloudVar = true;

            Object.defineProperty(window, key, {
                get: () => this._rawVars[key],
                set: setter,
                configurable: true,
                enumerable: true
            });
        } catch (e) {}
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

    _scanAndLink() {
        if (typeof document === 'undefined') return;
        const attrs = ['cv-bind', 'cv-show', 'cv-hide', 'cv-class', 'cv-on'];
        const foundVars = new Set();
        // JSの予約語や既にあるプロパティを除外
        const reserved = new Set(['true', 'false', 'null', 'undefined', 'click', 'submit', 'window', 'document', 'cv']);

        attrs.forEach(attr => {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                const val = el.getAttribute(attr);
                // 🌟 全ての英単語を抽出
                const matches = val.matchAll(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
                for (const match of matches) {
                    const varName = match[0];
                    if (!reserved.has(varName)) foundVars.add(varName);
                }
            });
        });

        foundVars.forEach(varName => {
            this._linkToGlobal(varName);
            if (this._rawVars[varName] === undefined) this._rawVars[varName] = undefined;
        });
    }
}

if (typeof window !== 'undefined') {
    window.CloudVar = CloudVar;
}

})();

