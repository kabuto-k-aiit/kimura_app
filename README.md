# 木村鮮魚店 - LIFFアプリ

木村鮮魚店の整理券発行システムです。LINEミニアプリ(LIFF)を使用して、お客様が整理券を発行し、呼び出し番号と本日の獲れたてをリアルタイムで確認できます。

## 機能

### お客様向け画面 (`/customer`)
- LINEユーザーIDの自動取得
- 現在の呼び出し番号のリアルタイム表示
- 本日の獲れたてのリアルタイム表示
- 整理券の発行機能
- **順番が近づいたときのLINE通知** (3番前に通知)

### 管理画面 (`/admin`)
- 呼び出し番号の管理
- 本日の獲れたて情報の編集
- 整理券の一覧表示と管理

### Firebase Cloud Functions
- 呼び出し番号の更新を監視
- 3番前の整理券保持者に自動でLINE通知を送信
- テスト用HTTP関数も提供

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルに以下を設定してください:

- Firebase設定(既に設定済み)
- `NEXT_PUBLIC_LIFF_ID`: LINE Developers ConsoleでLIFFアプリを作成し、LIFF IDを取得して設定

### 3. LIFFアプリの作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーとチャネルを作成(Messaging API)
3. 「LIFF」タブから新しいLIFFアプリを追加
   - エンドポイントURL: `http://localhost:3000/customer` (開発時) または本番のURL
   - サイズ: Full
   - スコープ: `profile` を選択
4. 取得したLIFF IDを `.env.local` に設定

### 4. Firestoreの初期設定

```bash
npx tsx scripts/setupFirestore.ts
```

### 5. Firebase Cloud Functionsのセットアップ (LINE通知機能)

#### 5.1 依存パッケージのインストール
```bash
cd functions
npm install
```

#### 5.2 環境変数の設定
`functions/.env` ファイルに以下を設定:
```bash
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here
```

#### 5.3 Firebase CLIのインストールとデプロイ
```bash
# Firebase CLIをグローバルインストール(未インストールの場合)
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Cloud Functionsをデプロイ
firebase deploy --only functions
```

詳細は `functions/README.md` を参照してください。

### 6. 開発サーバーの起動

```bash
npm run dev
```

## プロジェクト構造

```
kimura_app/
├── src/
│   ├── app/
│   │   ├── admin/         # 管理画面
│   │   ├── customer/      # お客様向け画面
│   │   └── ...
│   ├── types/
│   │   └── firestore.ts   # Firestore型定義
│   └── utils/
│       ├── firebase.ts    # Firebase設定
│       └── ticketUtils.ts # 整理券管理ユーティリティ
├── functions/             # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts      # LINE通知機能
│   ├── .env              # 環境変数(LINEトークン)
│   └── README.md         # Functions詳細ドキュメント
├── docs/
│   └── FIRESTORE_SCHEMA.md # Firestoreスキーマ設計書
├── scripts/
│   └── setupFirestore.ts # Firestore初期化スクリプト
├── firestore.rules       # Firestoreセキュリティルール
├── firestore.indexes.json # Firestoreインデックス定義
└── ...
```

## Firestoreデータ構造

### 主要コレクション

1. **`stores`** - 店舗の状況管理
   - `kimura`: 店舗情報ドキュメント
     - `currentTicketNumber`: 現在呼び出し中の整理券番号
     - `lastIssuedTicketNumber`: 最後に発行した整理券番号
     - `waitingGroups`: 現在待っている組数
     - `isAccepting`: 整理券の発行受付状態

2. **`tickets`** - 整理券管理
   - 各ドキュメント: 発行された整理券
     - `ticketNumber`: 整理券番号
     - `status`: 状態 (waiting/called/completed/cancelled)
     - `userId`: LINEユーザーID
     - `numberOfPeople`: 利用人数

3. **`callNumbers`** - 呼び出し番号管理 (Cloud Functions用)
   - `current`: 現在の呼び出し番号

詳細は [Firestoreスキーマ設計書](./docs/FIRESTORE_SCHEMA.md) を参照してください。

## ドキュメント

- [セットアップガイド](./SETUP_GUIDE.md) - 詳細なセットアップ手順
- [Functions README](./functions/README.md) - Cloud Functions詳細

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
