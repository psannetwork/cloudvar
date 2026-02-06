# ルームとセキュリティ管理

## ルームの仕組み
CloudVarはルームごとにデータを完全に分離します。
`Room A` での `score` の変更は、`Room B` には一切影響しません。

## パスワード保護
ルーム作成時にパスワードを指定すると、同じパスワードを知っている人だけがそのルームに参加できます。
```javascript
cv.join('secret-room', 'p@ssword');
```

## 共有拒否 (ブロック)
荒らし対策として、特定のユーザーを無視できます。
```javascript
cv.onChange('_client_join', (id) => {
  if (isAnnoying(id)) {
    cv.block(id);
  }
});
```
ブロックされたユーザーからの変数の書き換えは、あなたのブラウザには反映されなくなります。
