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
        // フォーム送信時はページ遷移を防止して式を評価
        document.addEventListener('submit', (e) => this.handleEvent(e, 'submit'));

        window.addEventListener('DOMContentLoaded', () => this.scan());
    }

    handleEvent(e, eventName) {
        const target = e.target.closest(`[cv-on^="${eventName}:"]`);
        if (!target) return;

        const attr = target.getAttribute('cv-on');
        const expressions = attr.split(':')[1].split(';'); // セミコロンで分割

        e.preventDefault();
        expressions.forEach(expr => this.evaluate(expr.trim()));
    }

    evaluate(expr) {
        if (!expr) return;

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

        // toggle !key
        if (expr.startsWith('!')) {
            const key = expr.slice(1).trim();
            this.sdk[key] = !this.sdk[key];
        }
    }

    // 文字列、数値、または他の変数名を解決
    resolveValue(valExpr) {
        // 文字列定数 'hello' "world"
        if (/^['"].*['"]$/.test(valExpr)) {
            return valExpr.replace(/^['"]|['"]$/g, '');
        }
        // 他の変数名
        if (this.sdk._rawVars[valExpr] !== undefined) {
            return this.sdk._rawVars[valExpr];
        }
        // 数値
        if (!isNaN(Number(valExpr))) {
            return Number(valExpr);
        }
        return valExpr;
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
        document.querySelectorAll(`[cv-show="${key}"]`).forEach(el => {
            el.style.display = value ? '' : 'none';
        });
        document.querySelectorAll(`[cv-hide="${key}"]`).forEach(el => {
            el.style.display = value ? 'none' : '';
        });
    }

    updateClass(key, value) {
        document.querySelectorAll(`[cv-class^="${key}:"]`).forEach(el => {
            const className = el.getAttribute('cv-class').split(':')[1].trim();
            if (value) el.classList.add(className);
            else el.classList.remove(className);
        });
    }
}

if (typeof module !== 'undefined') {
    module.exports = Binding;
}
window.CloudVarBinding = Binding;
