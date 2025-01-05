//const initialSystemId = 'system123';  
//serverInit(initialSystemId);
**CloudVar**

**クラウド変数を簡単に設定できる**

**セットアップ**

1. 以下のファイルをダウンロードし、自分のプロジェクトにファイルを配置
2. 配置したファイルを読み込む ex)
```html <script src='cloudvar.js'></script>```

**使い方**

使う前に、まずサーバーに接続処理を行う

```javascript serverInit(自分のID);```

これで、サーバーに接続できる。

IDは、その変数を共有したい人で共通したIDで接続してください。

**変数の共有**

変数を共有するには、一般の変数と同じように記述すればよい

変数名の先頭に、cloudvar_ をつけると、クラウド変数になります。

```javascript var cloudvar_name = 'psan'```

