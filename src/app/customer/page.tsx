'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';
import { db } from '@/utils/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';

interface StoreInfo {
  callNumber: number;
  todaySpecial: string;
}

export default function CustomerPage() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [lineUserId, setLineUserId] = useState<string>('');
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    callNumber: 0,
    todaySpecial: '本日の獲れたてを取得中...'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // LIFF初期化とLINEユーザーID取得
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({
          liffId: process.env.NEXT_PUBLIC_LIFF_ID || ''
        });
        
        setLiffInitialized(true);

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineUserId(profile.userId);
        } else {
          liff.login();
        }
      } catch (error) {
        console.error('LIFF初期化エラー:', error);
        setMessage('LIFFの初期化に失敗しました');
      }
    };

    initializeLiff();
  }, []);

  // Firestoreからリアルタイムで店舗情報を取得
  useEffect(() => {
    if (!liffInitialized) return;

    // 呼び出し番号と本日の獲れたてを取得
    const unsubscribe = onSnapshot(
      doc(db, 'storeInfo', 'current'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setStoreInfo({
            callNumber: data.callNumber || 0,
            todaySpecial: data.todaySpecial || '本日の獲れたて情報なし'
          });
        }
      },
      (error) => {
        console.error('Firestoreデータ取得エラー:', error);
      }
    );

    return () => unsubscribe();
  }, [liffInitialized]);

  // 整理券を発行する関数
  const issueTicket = async () => {
    if (!lineUserId) {
      setMessage('LINEユーザーIDが取得できていません');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 最新の整理券番号を取得
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, orderBy('ticketNumber', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      
      let newTicketNumber = 1;
      if (!querySnapshot.empty) {
        const lastTicket = querySnapshot.docs[0].data();
        newTicketNumber = (lastTicket.ticketNumber || 0) + 1;
      }

      // 整理券をFirestoreに保存
      await addDoc(collection(db, 'tickets'), {
        lineUserId: lineUserId,
        ticketNumber: newTicketNumber,
        issuedAt: Timestamp.now(),
        status: 'waiting' // 待機中
      });

      setMessage(`整理券No.${newTicketNumber}を発行しました!`);
    } catch (error) {
      console.error('整理券発行エラー:', error);
      setMessage('整理券の発行に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!liffInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">LIFFを初期化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-t-2xl shadow-lg p-6 mt-6">
          <h1 className="text-2xl font-bold text-center text-blue-800 mb-2">
            木村鮮魚店
          </h1>
          <p className="text-center text-gray-600 text-sm">
            本日もご来店ありがとうございます
          </p>
        </div>

        {/* 呼び出し番号表示 */}
        <div className="bg-white shadow-lg p-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">現在の呼び出し番号</p>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 shadow-inner">
              <p className="text-white text-6xl font-bold">
                {storeInfo.callNumber}
              </p>
            </div>
          </div>
        </div>

        {/* 本日の獲れたて */}
        <div className="bg-white shadow-lg p-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-3">本日の獲れたて</p>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border-2 border-orange-200">
              <p className="text-orange-800 text-lg font-semibold whitespace-pre-wrap">
                {storeInfo.todaySpecial}
              </p>
            </div>
          </div>
        </div>

        {/* 整理券発行ボタン */}
        <div className="bg-white rounded-b-2xl shadow-lg p-6 border-t border-gray-200">
          <button
            onClick={issueTicket}
            disabled={isLoading || !lineUserId}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              isLoading || !lineUserId
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95'
            } text-white`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                発行中...
              </span>
            ) : (
              '整理券を発行'
            )}
          </button>

          {/* メッセージ表示 */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg text-center font-medium ${
              message.includes('失敗') || message.includes('取得できて')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          {/* デバッグ情報（開発時のみ表示） */}
          {process.env.NODE_ENV === 'development' && lineUserId && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
              <p>LINE ID: {lineUserId.substring(0, 10)}...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
