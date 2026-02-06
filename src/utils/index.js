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
    module.exports = utils;
} else {
    window.CloudVarUtils = utils;
}
