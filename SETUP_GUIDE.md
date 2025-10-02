# 木村鮮魚店 LIFFアプリ セットアップガイド

## 概要

このアプリは、木村鮮魚店のお客様向け整理券発行システムです。LINE公式アカウントと連携し、LIFFアプリとして動作します。

## 主な機能

### お客様向け機能 (`/customer`)
- ✅ LIFF起動時にLINEユーザーIDを自動取得
- ✅ 現在の呼び出し番号をリアルタイム表示
- ✅ 本日の獲れたて情報をリアルタイム表示
- ✅ 整理券発行ボタン(LINEユーザーIDと整理券番号をFirestoreに保存)

### 管理者向け機能 (`/admin`)
- ✅ 呼び出し番号の管理
- ✅ 本日の獲れたて情報の編集
- ✅ 整理券の一覧表示
- ✅ 整理券の状態管理(待機中/呼び出し済み/完了)
- ✅ 整理券の削除

## セットアップ手順

### 1. 必要な環境

- Node.js 20以上
- npm または yarn
- Firebaseプロジェクト
- LINE Developersアカウント

### 2. プロジェクトのクローンと依存関係のインストール

```bash
cd /Users/kabutokoji/Desktop/workspace/hobby/kimura_app
npm install
```

### 3. Firebase設定

`.env.local` ファイルにFirebase設定が既に記載されています。

### 4. LINE Developers Consoleでの設定

#### 4.1 LINE公式アカウントの作成

1. [LINE Official Account Manager](https://manager.line.biz/) にアクセス
2. 新しいアカウントを作成

#### 4.2 Messaging APIチャネルの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 新しいプロバイダーを作成(または既存のプロバイダーを選択)
3. 「Messaging API」チャネルを作成
   - チャネル名: 木村鮮魚店
   - チャネル説明: 整理券発行システム

#### 4.3 LIFFアプリの作成

1. 作成したチャネルの「LIFF」タブを開く
2. 「追加」ボタンをクリック
3. 以下の設定で追加:
   - **LIFFアプリ名**: 木村鮮魚店 整理券
   - **サイズ**: Full
   - **エンドポイントURL**: 
     - 開発時: `http://localhost:3000/customer`
     - 本番: `https://your-domain.com/customer`
   - **スコープ**: 
     - ✅ `profile` (必須)
   - **ボットリンク機能**: オプション(お好みで)
   - **Scan QR**: オフ

4. 「追加」をクリック
5. 作成されたLIFF IDをコピー(例: `1234567890-AbCdEfGh`)

#### 4.4 LIFF IDを環境変数に設定

`.env.local` ファイルの `NEXT_PUBLIC_LIFF_ID` に取得したLIFF IDを設定:

```bash
NEXT_PUBLIC_LIFF_ID="1234567890-AbCdEfGh"
```

### 5. Firestoreの初期設定

```bash
npx tsx scripts/setupFirestore.ts
```

このスクリプトは以下を実行します:
- `storeInfo/current` ドキュメントに初期データを設定
  - `callNumber`: 0
  - `todaySpecial`: デフォルトメッセージ

### 6. 開発サーバーの起動

```bash
npm run dev
```

サーバーが起動したら:
- お客様向けページ: http://localhost:3000/customer
- 管理画面: http://localhost:3000/admin

### 7. LIFFアプリのテスト

#### 方法1: LINE公式アカウントでテスト(推奨)

1. LINE Developers Consoleの「Messaging API」タブを開く
2. QRコードをスキャンしてボットを友だち追加
3. 「リッチメニュー」などから LIFF URL を設定してアクセス

LIFF URLの形式:
```
https://liff.line.me/{LIFF_ID}
```

#### 方法2: ブラウザでテスト(開発時のみ)

ローカル環境でテストする場合は、ngrokなどのトンネリングサービスを使用:

```bash
# ngrokをインストール
npm install -g ngrok

# トンネルを開く
ngrok http 3000
```

取得したHTTPS URLをLIFFアプリのエンドポイントURLに設定します。

## Firestoreのデータ構造

### `storeInfo/current` コレクション

店舗の現在の状態を保存:

```typescript
{
  callNumber: number,        // 現在の呼び出し番号
  todaySpecial: string,      // 本日の獲れたて情報
  updatedAt: Timestamp       // 最終更新日時
}
```

### `tickets` コレクション

発行された整理券を保存:

```typescript
{
  lineUserId: string,        // LINEユーザーID
  ticketNumber: number,      // 整理券番号
  issuedAt: Timestamp,       // 発行日時
  status: string             // 状態: 'waiting' | 'called' | 'completed'
}
```

## 使用方法

### 管理者の操作手順

1. `/admin` ページにアクセス
2. 「本日の獲れたて情報」を入力して更新
3. お客様を呼び出すときは「次の番号へ」ボタンをクリック
4. 整理券一覧で各整理券の状態を管理

### お客様の操作手順

1. LINE公式アカウントを友だち追加
2. LIFFアプリを起動(`/customer`)
3. 現在の呼び出し番号と本日の獲れたてを確認
4. 「整理券を発行」ボタンをタップ
5. 整理券番号が表示される

## 本番環境へのデプロイ

### Vercelへのデプロイ(推奨)

1. Vercelアカウントを作成
2. GitHubリポジトリと連携
3. 環境変数を設定:
   - `NEXT_PUBLIC_FIREBASE_*`: Firebaseの設定
   - `NEXT_PUBLIC_LIFF_ID`: LIFF ID

```bash
npm run build
```

4. デプロイ後、取得したURLをLIFFアプリのエンドポイントURLに設定

## トラブルシューティング

### LIFF初期化エラー

- LIFF IDが正しく設定されているか確認
- `.env.local` ファイルを編集した場合は、開発サーバーを再起動

### Firestoreエラー

- Firebase設定が正しいか確認
- Firestoreのルールが適切に設定されているか確認

### LINEログインできない

- LIFFアプリのスコープに`profile`が含まれているか確認
- エンドポイントURLが正しいか確認

## セキュリティ設定

### Firestoreセキュリティルール(推奨)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 店舗情報は誰でも読み取り可能、管理者のみ書き込み可能
    match /storeInfo/{document=**} {
      allow read: if true;
      allow write: if false; // 管理画面からのみ更新する場合
    }
    
    // 整理券は誰でも作成可能、読み取りは管理者のみ
    match /tickets/{document=**} {
      allow create: if true;
      allow read, update, delete: if false; // 管理画面からのみ操作する場合
    }
  }
}
```

## ライセンス

このプロジェクトは個人用です。

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。
