# LIFF開発環境セットアップガイド

## 問題: LIFFアプリはHTTPSが必須

LIFFアプリのエンドポイントURLは**HTTPS**のみ対応しています。
ローカル開発環境（http://localhost:3000）では動作しません。

## 解決方法: ngrokを使用してHTTPSトンネルを作成

### ステップ1: ngrokアカウントの作成

1. [ngrok公式サイト](https://ngrok.com/) にアクセス
2. 無料アカウントを作成（GitHubアカウントでログイン可能）
3. ダッシュボードにアクセス

### ステップ2: ngrokのインストール（既にインストール済み）

```bash
# インストール確認
which ngrok
# /Users/kabutokoji/.volta/bin/ngrok
```

### ステップ3: 認証トークンの設定

1. [ngrokダッシュボード](https://dashboard.ngrok.com/get-started/your-authtoken) にアクセス
2. 「Your Authtoken」セクションからトークンをコピー
3. ターミナルで以下のコマンドを実行:

```bash
ngrok config add-authtoken YOUR_ACTUAL_TOKEN_HERE
```

**例**:
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl0mnop1qrs2
```

### ステップ4: Next.js開発サーバーの起動

```bash
npm run dev
```

サーバーが起動したら `http://localhost:3000` で動作していることを確認。

### ステップ5: ngrokトンネルの作成

**別のターミナルウィンドウ**を開いて、以下のコマンドを実行:

```bash
ngrok http 3000
```

成功すると、以下のような出力が表示されます:

```
ngrok                                                           (Ctrl+C to quit)
                                                                                
Session Status                online                                            
Account                       your-email@example.com (Plan: Free)              
Version                       3.x.x                                             
Region                        Japan (jp)                                        
Latency                       -                                                 
Web Interface                 http://127.0.0.1:4040                            
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90       
                              0       0       0.00    0.00    0.00    0.00
```

**重要**: `https://abc123def456.ngrok.io` の部分があなたの公開HTTPSURLです！

### ステップ6: LIFFアプリの設定

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. チャネル → LIFF タブを開く
3. LIFFアプリを作成または編集:

**エンドポイントURL（お客様向け画面）**:
```
https://abc123def456.ngrok.io/customer
```

**エンドポイントURL（管理画面 - オプション）**:
```
https://abc123def456.ngrok.io/admin
```

4. 保存

### ステップ7: 動作確認

1. LINE公式アカウントを友だち追加
2. LIFFアプリを開く
3. ngrokのURLで動作確認

## 注意事項

### ⚠️ ngrok無料プランの制限

- **セッション時間**: 2時間で自動切断
- **URL変更**: 再起動するたびにURLが変わる
- **対策**: 開発中は同じセッションを維持するか、毎回LIFFアプリのURLを更新

### 💡 ngrok有料プラン（推奨）

月額$8から利用可能:
- 固定URL（カスタムドメイン）
- セッション時間無制限
- 複数の同時トンネル

### 🔧 ngrokの便利な機能

**Web Interface**: http://127.0.0.1:4040
- リアルタイムでリクエストを確認
- デバッグに便利

## トラブルシューティング

### エラー: ERR_NGROK_106 (認証失敗)

```bash
# 認証トークンを再設定
ngrok config add-authtoken YOUR_ACTUAL_TOKEN_HERE
```

### エラー: Address already in use

別のngrokセッションが実行中です:

```bash
# プロセスを確認
ps aux | grep ngrok

# プロセスを終了
kill -9 <PID>
```

### LIFFアプリが開けない

1. ngrokのURLが正しいか確認
2. Next.js開発サーバーが起動しているか確認
3. LIFFアプリのエンドポイントURLが正しく設定されているか確認

## 代替方法

### 方法1: Vercel Preview Deployment

```bash
# Vercelにデプロイ
npm install -g vercel
vercel
```

- 自動的にHTTPS URL発行
- プレビュー環境で開発可能
- 無料プランあり

### 方法2: Cloudflare Tunnel

```bash
# Cloudflared のインストール
brew install cloudflare/cloudflare/cloudflared

# トンネル作成
cloudflared tunnel --url http://localhost:3000
```

### 方法3: localhost.run

ngrokの代替（認証不要）:

```bash
ssh -R 80:localhost:3000 nokey@localhost.run
```

## 本番環境へのデプロイ

開発が完了したら、Vercelなどにデプロイして固定URLを取得:

```bash
npm run build
vercel --prod
```

本番URLをLIFFアプリのエンドポイントURLに設定してください。

---

**推奨フロー**:
1. 開発中: ngrok（またはCloudflare Tunnel）
2. 本番: Vercel/Netlify/Firebase Hosting
