# Firebase Cloud Functions - LINE通知機能

## 概要

Firestoreの呼び出し番号が更新されたときに、3番前の整理券を持つユーザーにLINE通知を送る機能です。

## 機能

### 1. notifyUpcomingTurn
- **トリガー**: Firestoreの`callNumbers`コレクションの更新
- **処理内容**:
  - 呼び出し番号が更新されたことを検知
  - 現在の呼び出し番号+3の整理券を持つユーザーを検索
  - 該当ユーザーのLINE IDに「まもなく順番です」メッセージを送信

### 2. sendTestNotification
- **トリガー**: HTTPリクエスト
- **用途**: 開発・テスト用
- **使い方**: `https://[region]-[project-id].cloudfunctions.net/sendTestNotification?userId=LINE_USER_ID`

## セットアップ

### 1. 依存関係のインストール

\`\`\`bash
cd functions
npm install
\`\`\`

### 2. 環境変数の設定

\`\`\`bash
# .envファイルを作成
cp .env.example .env

# LINEチャンネルアクセストークンを設定
# .envファイルを編集して、LINE_CHANNEL_ACCESS_TOKENを設定
\`\`\`

### 3. Firebase CLIでの環境変数設定

\`\`\`bash
firebase functions:config:set line.channel_access_token="YOUR_LINE_CHANNEL_ACCESS_TOKEN"
\`\`\`

または、Functions v2を使用している場合は`.env`ファイルを使用できます。

### 4. ビルド

\`\`\`bash
npm run build
\`\`\`

### 5. ローカルテスト（オプション）

\`\`\`bash
npm run serve
\`\`\`

### 6. デプロイ

\`\`\`bash
# プロジェクトルートから
firebase deploy --only functions

# または、functionsディレクトリから
npm run deploy
\`\`\`

## Firestoreのデータ構造

### callNumbers コレクション
\`\`\`typescript
{
  currentNumber: number,  // 現在の呼び出し番号
  updatedAt: Timestamp    // 更新日時
}
\`\`\`

### tickets コレクション
\`\`\`typescript
{
  ticketNumber: number,   // 整理券番号
  lineUserId: string,     // LINE ユーザーID
  status: string,         // "waiting" | "called" | "completed"
  notified: boolean,      // 通知済みフラグ
  notifiedAt: Timestamp,  // 通知日時
  createdAt: Timestamp    // 作成日時
}
\`\`\`

## テスト方法

### 1. テスト通知を送る（HTTP関数）

\`\`\`bash
curl "https://asia-northeast1-[YOUR-PROJECT-ID].cloudfunctions.net/sendTestNotification?userId=YOUR_LINE_USER_ID"
\`\`\`

### 2. Firestoreで呼び出し番号を更新

Firebase Consoleまたはコードから`callNumbers`コレクションの`currentNumber`を更新すると、
自動的に3番前の整理券ユーザーに通知が送られます。

## 注意事項

1. LINE Messaging APIのチャンネルアクセストークンは、絶対に公開リポジトリにコミットしないでください
2. `tickets`コレクションには、適切なインデックスを作成してください（`ticketNumber`と`status`）
3. 本番環境では、エラーハンドリングとログ監視を強化してください
4. レート制限に注意してください（LINEのAPI制限）

## トラブルシューティング

- **通知が届かない**: LINE ユーザーIDが正しいか、ボットがブロックされていないか確認
- **関数がトリガーされない**: Firestoreのドキュメントパスが正しいか確認
- **権限エラー**: Firebase Admin SDKの権限設定を確認
