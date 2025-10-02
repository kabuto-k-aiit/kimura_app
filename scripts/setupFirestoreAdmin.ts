/**
 * Firestoreに初期データをセットアップするスクリプト (Admin SDK版)
 * 実行方法: npx tsx scripts/setupFirestoreAdmin.ts
 * 
 * 注意: このスクリプトはFirebase Admin SDKを使用します
 * サービスアカウントキーが必要な場合は、環境変数 GOOGLE_APPLICATION_CREDENTIALS を設定してください
 */

import * as admin from 'firebase-admin';

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'your-project-id',
  });
}

const db = admin.firestore();

async function setupFirestore() {
  try {
    console.log('Firestoreの初期設定を開始します...');
    console.log('');

    // 1. 店舗情報の初期データを設定 (stores コレクション)
    console.log('【1/3】stores コレクションを初期化中...');
    const storeRef = db.collection('stores').doc('kimura');
    await storeRef.set({
      currentTicketNumber: 0,      // 現在呼び出し中の整理券番号
      lastIssuedTicketNumber: 0,   // 最後に発行した整理券番号
      waitingGroups: 0,             // 現在待っている組数
      isAccepting: true,            // 整理券の発行を受け付けているか
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✓ stores/kimura ドキュメントを作成しました');
    console.log('  - currentTicketNumber: 0');
    console.log('  - lastIssuedTicketNumber: 0');
    console.log('  - waitingGroups: 0');
    console.log('  - isAccepting: true');
    console.log('');

    // 2. 呼び出し番号管理用コレクション (Cloud Functions用)
    console.log('【2/3】callNumbers コレクションを初期化中...');
    const callNumbersRef = db.collection('callNumbers').doc('current');
    await callNumbersRef.set({
      currentNumber: 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✓ callNumbers/current ドキュメントを作成しました');
    console.log('  - currentNumber: 0');
    console.log('');

    // 3. 旧システム互換用 (オプション: 既存のコードがあれば)
    console.log('【3/3】storeInfo コレクションを初期化中 (旧システム互換用)...');
    const storeInfoRef = db.collection('storeInfo').doc('current');
    await storeInfoRef.set({
      callNumber: 0,
      todaySpecial: '本日は鮮度抜群のマグロが入荷しました!\nぜひお試しください。',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✓ storeInfo/current ドキュメントを作成しました');
    console.log('');

    console.log('========================================');
    console.log('✅ セットアップ完了!');
    console.log('========================================');
    console.log('');
    console.log('📝 作成されたコレクション:');
    console.log('  1. stores/kimura      - 店舗の状況管理');
    console.log('  2. callNumbers/current - 呼び出し番号管理 (Cloud Functions用)');
    console.log('  3. storeInfo/current  - 旧システム互換用');
    console.log('  4. tickets (空)       - 整理券は発行時に自動作成されます');
    console.log('');
    console.log('🔧 次のステップ:');
    console.log('  1. LINE Developers Consoleで LIFF アプリを作成');
    console.log('  2. LIFF ID を .env.local の NEXT_PUBLIC_LIFF_ID に設定');
    console.log('  3. LINEチャンネルアクセストークンを functions/.env に設定');
    console.log('  4. npm run dev でアプリを起動');
    console.log('  5. firebase deploy --only functions でCloud Functionsをデプロイ');
    console.log('');

    process.exit(0);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

setupFirestore();
