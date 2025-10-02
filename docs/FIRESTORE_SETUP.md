# Firestore初期セットアップガイド

## セットアップ方法

Firestoreを初期化するには、以下の2つの方法があります。

### 方法1: Firebase Consoleから手動で作成（推奨）

最も簡単で確実な方法です。

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. プロジェクトを選択
3. 左メニューから「Firestore Database」を選択
4. 以下のコレクションとドキュメントを作成:

#### stores コレクション
- ドキュメントID: `kimura`
- フィールド:
  ```
  currentTicketNumber: 0 (number)
  lastIssuedTicketNumber: 0 (number)
  waitingGroups: 0 (number)
  isAccepting: true (boolean)
  updatedAt: (timestamp - 現在時刻)
  ```

#### callNumbers コレクション
- ドキュメントID: `current`
- フィールド:
  ```
  currentNumber: 0 (number)
  updatedAt: (timestamp - 現在時刻)
  ```

#### storeInfo コレクション（旧システム互換用）
- ドキュメントID: `current`
- フィールド:
  ```
  callNumber: 0 (number)
  todaySpecial: "本日は鮮度抜群のマグロが入荷しました!" (string)
  updatedAt: (timestamp - 現在時刻)
  ```

### 方法2: スクリプトで自動作成

#### 前提条件
- `.env.local` ファイルにFirebase設定が正しく記述されていること
- Firebaseプロジェクトが作成されていること

#### 実行手順

```bash
# プロジェクトルートで実行
npx tsx scripts/setupFirestore.ts
```

エラーが発生する場合は、方法1（手動作成）を推奨します。

### 方法3: Firebase CLI経由（上級者向け）

Firebase Admin SDKを使用する方法です。

1. Firebase Admin SDKをインストール:
```bash
npm install --save-dev firebase-admin
```

2. サービスアカウントキーを取得:
   - Firebase Console → プロジェクト設定 → サービスアカウント
   - 「新しい秘密鍵の生成」をクリック
   - ダウンロードしたJSONファイルを安全な場所に保存

3. 環境変数を設定:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
export NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
```

4. スクリプトを実行:
```bash
npx tsx scripts/setupFirestoreAdmin.ts
```

## トラブルシューティング

### エラー: auth/invalid-api-key

`.env.local` ファイルが正しく設定されていません。
以下を確認してください:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### エラー: Permission denied

Firestoreのセキュリティルールを確認してください。
開発中は、一時的に以下のルールを設定することもできます:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // 開発中のみ
    }
  }
}
```

**⚠️ 注意**: 本番環境では必ず適切なセキュリティルールを設定してください。

## 確認方法

セットアップが完了したら、Firebase Consoleで以下を確認:

1. Firestore Database → データタブ
2. `stores/kimura` ドキュメントが存在する
3. `callNumbers/current` ドキュメントが存在する
4. `storeInfo/current` ドキュメントが存在する

## 次のステップ

Firestoreの初期化が完了したら:

1. Firestoreインデックスをデプロイ:
```bash
firebase deploy --only firestore:indexes
```

2. Firestoreセキュリティルールをデプロイ:
```bash
firebase deploy --only firestore:rules
```

3. アプリケーションを起動:
```bash
npm run dev
```
