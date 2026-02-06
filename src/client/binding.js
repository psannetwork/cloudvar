class Binding {
    constructor(sdk) {
        this.sdk = sdk;
        this.setup();
    }

    setup() {
        if (typeof document === 'undefined') return;

        // 値の変化をHTMLに反映
        this.sdk.onChange('*', (key, value) => {
            this.updateElements(key, value);
        });

        // 入力を変数に反映 (双方向)
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

if (typeof module !== 'undefined') module.exports = Binding;
else window.CloudVarBinding = Binding;
