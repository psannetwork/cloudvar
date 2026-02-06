module.exports = {
    port: process.env.PORT || 8080,
    token: process.env.TOKEN || 'default-password',
    
    // サーバー間同期の設定 (Redisを使用)
    // null の場合は単一サーバーとして動作
    redis: process.env.REDIS_URL || null, 

    // ルームが空になってから削除されるまでの時間 (ミリ秒)
    roomExpirationMs: 1000 * 60 * 5, // 5分
    
    // セキュリティ設定
    maxVariableSize: 1024, // 1KB
    rateLimitMs: 50,       // 送信間隔
    
    // クライアントが他人のIDリストを取得できるか
    allowIDList: true,
    
    // 変数の保存（永続化）を有効にするか
    persistence: false
};
