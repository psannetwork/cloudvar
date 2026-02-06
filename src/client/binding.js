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

if (typeof module !== 'undefined') module.exports = Binding;
else window.CloudVarBinding = Binding;