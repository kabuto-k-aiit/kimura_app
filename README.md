# 木村鮮魚店 - LIFFアプリ

木村鮮魚店の整理券発行システムです。LINEミニアプリ(LIFF)を使用して、お客様が整理券を発行し、呼び出し番号と本日の獲れたてをリアルタイムで確認できます。

## 機能

### お客様向け画面 (`/customer`)
- LINEユーザーIDの自動取得
- 現在の呼び出し番号のリアルタイム表示
- 本日の獲れたてのリアルタイム表示
- 整理券の発行機能

### 管理画面 (`/admin`)
- 呼び出し番号の管理
- 本日の獲れたて情報の編集
- 整理券の一覧表示と管理

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

### 5. 開発サーバーの起動

```bash
npm run dev
```

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
