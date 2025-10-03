# Firestore データベース スキーマ設計書

## 概要

木村鮮魚店の整理券管理システムで使用するFirestoreのデータ構造を定義します。

---

## 1. 店舗の状況を管理するコレクション: `stores`

店舗ごとに1つのドキュメントを格納します。ドキュメントIDを固定することで、常に特定のドキュメントを監視でき、効率的な運用が可能です。

### コレクション名
```
stores
```

### ドキュメントID（例）
```
kimura
```

### フィールド定義

| フィールド名 | データ型 | 説明 | デフォルト値 |
|------------|---------|------|------------|
| `currentTicketNumber` | Number | 現在呼び出し中の整理券番号 | 0 |
| `lastIssuedTicketNumber` | Number | 最後に発行した整理券番号。次に発行する番号はこれに+1します | 0 |
| `waitingGroups` | Number | 現在待っている組数。`lastIssuedTicketNumber - currentTicketNumber` で計算可能だが、ここに持たせると読み取りが1回で済む | 0 |
| `isAccepting` | Boolean | 現在、整理券の発行を受け付けているか（true）、停止しているか（false） | true |
| `updatedAt` | Timestamp | このドキュメントが最後に更新された日時 | serverTimestamp() |

### サンプルデータ

```typescript
{
  currentTicketNumber: 15,
  lastIssuedTicketNumber: 23,
  waitingGroups: 8,
  isAccepting: true,
  updatedAt: Timestamp(2025, 10, 3, 14, 30, 0)
}
```

### 使用例

```typescript
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/utils/firebase';

// 店舗情報を取得
const storeRef = doc(db, 'stores', 'kimura');
const storeSnap = await getDoc(storeRef);
const storeData = storeSnap.data();

// 整理券発行時: lastIssuedTicketNumber を +1
await updateDoc(storeRef, {
  lastIssuedTicketNumber: increment(1),
  waitingGroups: increment(1),
  updatedAt: serverTimestamp()
});

// 呼び出し時: currentTicketNumber を +1
await updateDoc(storeRef, {
  currentTicketNumber: increment(1),
  waitingGroups: increment(-1),
  updatedAt: serverTimestamp()
});
```

---

## 2. 整理券を管理するコレクション: `tickets`

発行された整理券一枚一枚をドキュメントとして保存します。

### コレクション名
```
tickets
```

### ドキュメントID
```
自動生成ID（Firestoreが自動で割り当て）
```

### フィールド定義

| フィールド名 | データ型 | 説明 | 必須 |
|------------|---------|------|------|
| `ticketNumber` | Number | 整理券の番号。`stores` の `lastIssuedTicketNumber` を元に発行 | ✅ |
| `status` | String | 整理券の状態。`"waiting"` (待機中), `"called"` (呼出済), `"completed"` (完了), `"cancelled"` (キャンセル) | ✅ |
| `issuedAt` | Timestamp | 整理券が発行された日時 | ✅ |
| `userId` | String | 整理券を発行したユーザーの一意なID。LINEのユーザーIDや匿名認証のUIDなどを保存 | ✅ |
| `numberOfPeople` | Number | 利用人数 | ✅ |
| `notified` | Boolean | LINE通知済みフラグ（Cloud Functions用） | ❌ |
| `notifiedAt` | Timestamp | 通知日時（Cloud Functions用） | ❌ |

### 状態の遷移

```
waiting (待機中)
    ↓
called (呼出済)
    ↓
completed (完了)
```

または

```
waiting (待機中)
    ↓
cancelled (キャンセル)
```

### サンプルデータ

```typescript
{
  ticketNumber: 24,
  status: "waiting",
  issuedAt: Timestamp(2025, 10, 3, 14, 25, 0),
  userId: "U1234567890abcdef",
  numberOfPeople: 2,
  notified: false,
  notifiedAt: null
}
```

### 使用例

```typescript
import { collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/utils/firebase';

// 整理券を発行
const ticketsRef = collection(db, 'tickets');
const newTicket = await addDoc(ticketsRef, {
  ticketNumber: 24,
  status: "waiting",
  issuedAt: serverTimestamp(),
  userId: "U1234567890abcdef",
  numberOfPeople: 2,
  notified: false,
  notifiedAt: null
});

// 特定の整理券を検索
const q = query(
  ticketsRef, 
  where("ticketNumber", "==", 24),
  where("status", "==", "waiting")
);
const querySnapshot = await getDocs(q);

// 整理券の状態を更新
querySnapshot.forEach(async (doc) => {
  await updateDoc(doc.ref, {
    status: "called"
  });
});
```

---

## 3. 呼び出し番号管理コレクション: `callNumbers` (Cloud Functions用)

Cloud Functionsが監視する専用コレクション。呼び出し番号の更新をトリガーにLINE通知を送信します。

### コレクション名
```
callNumbers
```

### ドキュメントID
```
current
```

### フィールド定義

| フィールド名 | データ型 | 説明 |
|------------|---------|------|
| `currentNumber` | Number | 現在の呼び出し番号 |
| `updatedAt` | Timestamp | 最終更新日時 |

### サンプルデータ

```typescript
{
  currentNumber: 15,
  updatedAt: Timestamp(2025, 10, 3, 14, 30, 0)
}
```

### Cloud Functions トリガー

```typescript
export const notifyUpcomingTurn = functions
  .firestore
  .document("callNumbers/{docId}")
  .onUpdate(async (change, context) => {
    const newCallNumber = change.after.data().currentNumber;
    // 3番前のユーザーに通知を送る処理...
  });
```

---

## 4. Firestoreインデックス

以下のインデックスを作成することを推奨します。

### `tickets` コレクション

#### インデックス1: ticketNumber + status
- **フィールド**: `ticketNumber` (Ascending), `status` (Ascending)
- **用途**: 特定の整理券番号で待機中のチケットを検索

#### インデックス2: userId + status
- **フィールド**: `userId` (Ascending), `status` (Ascending)  
- **用途**: 特定ユーザーの整理券一覧を表示

#### インデックス3: status + issuedAt
- **フィールド**: `status` (Ascending), `issuedAt` (Descending)
- **用途**: 待機中の整理券を発行日時順にソート

### インデックスの作成方法

#### 方法1: Firebase Consoleから作成
1. Firebase Console → Firestore Database → インデックス
2. 「複合」タブで新規作成

#### 方法2: firestore.indexes.json を使用

```json
{
  "indexes": [
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ticketNumber", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "issuedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

デプロイ方法:
```bash
firebase deploy --only firestore:indexes
```

---

## 5. Firestoreセキュリティルール

### 推奨ルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 店舗情報: 読み取りは誰でも可能、書き込みは管理者のみ
    match /stores/{storeId} {
      allow read: if true;
      allow write: if false; // 管理画面のサーバーサイド処理でのみ更新
    }
    
    // 整理券: 作成は誰でも可能、読み取り・更新・削除は制限
    match /tickets/{ticketId} {
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      request.auth.token.admin == true);
      allow update, delete: if request.auth != null && 
                               request.auth.token.admin == true;
    }
    
    // 呼び出し番号: 読み取りは誰でも可能、書き込みは管理者のみ
    match /callNumbers/{docId} {
      allow read: if true;
      allow write: if false; // Cloud Functionsまたは管理画面から更新
    }
    
    // 旧システム互換用
    match /storeInfo/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 6. データフロー例

### 整理券発行フロー

```
1. ユーザーが「整理券を発行」ボタンをタップ
   ↓
2. stores/kimura の lastIssuedTicketNumber を +1
   ↓
3. 新しい整理券番号を取得 (例: 24)
   ↓
4. tickets コレクションに新規ドキュメントを作成
   - ticketNumber: 24
   - status: "waiting"
   - userId: LINEユーザーID
   - numberOfPeople: 入力された人数
   ↓
5. stores/kimura の waitingGroups を +1
   ↓
6. ユーザーに整理券番号を表示
```

### 呼び出しフロー

```
1. 管理者が「次を呼び出す」ボタンをクリック
   ↓
2. stores/kimura の currentTicketNumber を +1 (例: 15 → 16)
   ↓
3. callNumbers/current の currentNumber を更新 (16)
   ↓
4. Cloud Functionsが更新を検知
   ↓
5. 16 + 3 = 19番のチケットを持つユーザーを検索
   ↓
6. 該当ユーザーにLINE通知「まもなく順番です」
   ↓
7. tickets の notified フラグを true に更新
```

---

## 7. 参考情報

### TypeScript型定義

```typescript
// stores コレクション
interface Store {
  currentTicketNumber: number;
  lastIssuedTicketNumber: number;
  waitingGroups: number;
  isAccepting: boolean;
  updatedAt: Timestamp;
}

// tickets コレクション
interface Ticket {
  ticketNumber: number;
  status: 'waiting' | 'called' | 'completed' | 'cancelled';
  issuedAt: Timestamp;
  userId: string;
  numberOfPeople: number;
  notified?: boolean;
  notifiedAt?: Timestamp | null;
}

// callNumbers コレクション
interface CallNumber {
  currentNumber: number;
  updatedAt: Timestamp;
}
```

---

## 8. メンテナンス

### 古い整理券の削除

定期的に古い整理券（completed, cancelled）を削除することを推奨します。

```typescript
// Cloud Scheduler + Cloud Functions で実装
export const cleanupOldTickets = functions
  .pubsub
  .schedule('every day 03:00')
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('issuedAt', '<', Timestamp.fromDate(yesterday)),
      where('status', 'in', ['completed', 'cancelled'])
    );
    
    const snapshot = await getDocs(q);
    snapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  });
```

---

**作成日**: 2025年10月3日  
**バージョン**: 1.0  
**管理者**: 木村鮮魚店
