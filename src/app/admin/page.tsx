'use client';

import { useState, useEffect } from 'react';
import { db } from '@/utils/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';

interface Ticket {
  id: string;
  lineUserId: string;
  ticketNumber: number;
  issuedAt: Timestamp;
  status: string;
}

export default function AdminPage() {
  const [currentNumber, setCurrentNumber] = useState<number>(0);
  const [todaysFresh, setTodaysFresh] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Firestoreからデータを取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeDocRef = doc(db, 'storeInfo', 'current');
        const docSnap = await getDoc(storeDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentNumber(data.callNumber || 0);
          setTodaysFresh(data.todaySpecial || '');
        } else {
          // ドキュメントが存在しない場合は初期化
          await setDoc(storeDocRef, {
            callNumber: 0,
            todaySpecial: '',
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
        alert('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 整理券のリアルタイム取得
  useEffect(() => {
    const ticketsRef = collection(db, 'tickets');
    const q = query(ticketsRef, orderBy('ticketNumber', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsList: Ticket[] = [];
      snapshot.forEach((doc) => {
        ticketsList.push({
          id: doc.id,
          ...doc.data()
        } as Ticket);
      });
      setTickets(ticketsList);
    });

    return () => unsubscribe();
  }, []);

  // 次の番号へ
  const handleNextNumber = async () => {
    setSaving(true);
    try {
      const newNumber = currentNumber + 1;
      const storeDocRef = doc(db, 'storeInfo', 'current');
      
      await updateDoc(storeDocRef, {
        callNumber: newNumber,
        updatedAt: new Date(),
      });

      setCurrentNumber(newNumber);
      alert(`番号を ${newNumber} に更新しました`);
    } catch (error) {
      console.error('番号の更新に失敗しました:', error);
      alert('番号の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 本日の獲れたて情報を更新
  const handleUpdateFresh = async () => {
    setSaving(true);
    try {
      const storeDocRef = doc(db, 'storeInfo', 'current');
      
      await updateDoc(storeDocRef, {
        todaySpecial: todaysFresh,
        updatedAt: new Date(),
      });

      alert('本日の獲れたて情報を更新しました');
    } catch (error) {
      console.error('獲れたて情報の更新に失敗しました:', error);
      alert('獲れたて情報の更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 整理券を削除
  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('この整理券を削除しますか?')) return;

    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      alert('整理券を削除しました');
    } catch (error) {
      console.error('整理券の削除に失敗しました:', error);
      alert('整理券の削除に失敗しました');
    }
  };

  // 整理券の状態を更新
  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'tickets', ticketId), {
        status: status,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('整理券の状態更新に失敗しました:', error);
      alert('整理券の状態更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            店舗管理ページ
          </h1>
          <p className="text-gray-600">
            呼び出し番号と本日の獲れたて情報を管理します
          </p>
        </div>

        {/* 呼び出し番号管理セクション */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            呼び出し番号管理
          </h2>
          
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">現在の呼び出し番号</p>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-6xl font-bold rounded-xl py-8 px-16 shadow-lg">
                {currentNumber}
              </div>
            </div>

            <button
              onClick={handleNextNumber}
              disabled={saving}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-12 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {saving ? '更新中...' : '次の番号へ'}
            </button>
          </div>
        </div>

        {/* 本日の獲れたて情報管理セクション */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            本日の獲れたて情報
          </h2>
          
          <div className="space-y-4">
            <div>
              <label
                htmlFor="todaysFresh"
                className="block text-gray-700 font-medium mb-2"
              >
                本日の獲れたて
              </label>
              <textarea
                id="todaysFresh"
                value={todaysFresh}
                onChange={(e) => setTodaysFresh(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition text-gray-800"
                placeholder="例：本マグロ、ブリ、サーモン..."
              />
            </div>

            <button
              onClick={handleUpdateFresh}
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {saving ? '更新中...' : '更新'}
            </button>
          </div>
        </div>

        {/* 整理券一覧セクション */}
        <div className="bg-white rounded-lg shadow-lg p-8 mt-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            整理券一覧 ({tickets.length}件)
          </h2>
          
          {tickets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              現在、発行されている整理券はありません
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                      整理券番号
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                      LINE ID
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                      発行日時
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                      状態
                    </th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-blue-600 text-lg">
                        {ticket.ticketNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm font-mono">
                        {ticket.lineUserId.substring(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {ticket.issuedAt?.toDate().toLocaleString('ja-JP')}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          <option value="waiting">待機中</option>
                          <option value="called">呼び出し済み</option>
                          <option value="completed">完了</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>店舗用管理ページ © 2025</p>
        </div>
      </div>
    </div>
  );
}
