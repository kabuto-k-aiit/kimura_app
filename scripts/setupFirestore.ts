/**
 * Firestoreに初期データをセットアップするスクリプト
 * 実行方法: npx tsx scripts/setupFirestore.ts
 */

import { db } from '../src/utils/firebase';
import { doc, setDoc } from 'firebase/firestore';

async function setupFirestore() {
  try {
    console.log('Firestoreの初期設定を開始します...');

    // 店舗情報の初期データを設定
    const storeInfoRef = doc(db, 'storeInfo', 'current');
    await setDoc(storeInfoRef, {
      callNumber: 0,
      todaySpecial: '本日は鮮度抜群のマグロが入荷しました!\nぜひお試しください。',
      updatedAt: new Date()
    });

    console.log('✓ 店舗情報の初期データを設定しました');
    console.log('');
    console.log('セットアップ完了!');
    console.log('');
    console.log('次のステップ:');
    console.log('1. LINE Developers Consoleで LIFF アプリを作成');
    console.log('2. LIFF ID を .env.local の NEXT_PUBLIC_LIFF_ID に設定');
    console.log('3. npm run dev でアプリを起動');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

setupFirestore();
