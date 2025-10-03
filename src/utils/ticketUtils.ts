/**
 * 整理券管理ユーティリティ関数
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  Store, 
  Ticket, 
  IssueTicketRequest, 
  IssueTicketResponse,
  CallNextRequest,
  CallNextResponse
} from '@/types/firestore';

/**
 * 店舗IDの定数
 */
export const STORE_ID = 'kimura';

/**
 * 店舗情報を取得
 */
export async function getStoreInfo(): Promise<Store | null> {
  try {
    const storeRef = doc(db, 'stores', STORE_ID);
    const storeSnap = await getDoc(storeRef);
    
    if (!storeSnap.exists()) {
      console.error('店舗情報が見つかりません');
      return null;
    }
    
    return storeSnap.data() as Store;
  } catch (error) {
    console.error('店舗情報の取得に失敗しました:', error);
    throw error;
  }
}

/**
 * 整理券を発行
 * トランザクションを使用して、番号の重複を防ぐ
 */
export async function issueTicket(
  request: IssueTicketRequest
): Promise<IssueTicketResponse> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. 店舗情報を取得
      const storeRef = doc(db, 'stores', STORE_ID);
      const storeSnap = await transaction.get(storeRef);
      
      if (!storeSnap.exists()) {
        throw new Error('店舗情報が見つかりません');
      }
      
      const storeData = storeSnap.data() as Store;
      
      // 2. 整理券の発行が停止されているかチェック
      if (!storeData.isAccepting) {
        throw new Error('現在、整理券の発行を受け付けておりません');
      }
      
      // 3. 新しい整理券番号を計算
      const newTicketNumber = storeData.lastIssuedTicketNumber + 1;
      
      // 4. 店舗情報を更新
      transaction.update(storeRef, {
        lastIssuedTicketNumber: newTicketNumber,
        waitingGroups: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // 5. 整理券を作成
      const ticketsRef = collection(db, 'tickets');
      const newTicketRef = doc(ticketsRef);
      
      const ticketData: Omit<Ticket, 'issuedAt'> & { issuedAt: any } = {
        ticketNumber: newTicketNumber,
        status: 'waiting',
        issuedAt: serverTimestamp(),
        userId: request.userId,
        numberOfPeople: request.numberOfPeople,
        notified: false,
        notifiedAt: null
      };
      
      transaction.set(newTicketRef, ticketData);
      
      return {
        ticketNumber: newTicketNumber,
        ticketId: newTicketRef.id,
        waitingGroups: storeData.waitingGroups + 1
      };
    });
    
    return {
      success: true,
      ...result
    };
    
  } catch (error) {
    console.error('整理券の発行に失敗しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '整理券の発行に失敗しました'
    };
  }
}

/**
 * 次の番号を呼び出し
 */
export async function callNextNumber(
  request: CallNextRequest = { storeId: STORE_ID }
): Promise<CallNextResponse> {
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. 店舗情報を取得
      const storeRef = doc(db, 'stores', request.storeId);
      const storeSnap = await transaction.get(storeRef);
      
      if (!storeSnap.exists()) {
        throw new Error('店舗情報が見つかりません');
      }
      
      const storeData = storeSnap.data() as Store;
      
      // 2. 待っている組がいない場合はエラー
      if (storeData.waitingGroups <= 0) {
        throw new Error('待っている組がありません');
      }
      
      // 3. 新しい呼び出し番号を計算
      const newCurrentNumber = storeData.currentTicketNumber + 1;
      
      // 4. 店舗情報を更新
      transaction.update(storeRef, {
        currentTicketNumber: newCurrentNumber,
        waitingGroups: increment(-1),
        updatedAt: serverTimestamp()
      });
      
      // 5. callNumbersコレクションも更新 (Cloud Functions用)
      const callNumbersRef = doc(db, 'callNumbers', 'current');
      transaction.set(callNumbersRef, {
        currentNumber: newCurrentNumber,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return {
        currentTicketNumber: newCurrentNumber,
        waitingGroups: storeData.waitingGroups - 1
      };
    });
    
    return {
      success: true,
      ...result
    };
    
  } catch (error) {
    console.error('次の番号の呼び出しに失敗しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '呼び出しに失敗しました'
    };
  }
}

/**
 * ユーザーの整理券を取得
 */
export async function getUserTickets(userId: string): Promise<Ticket[]> {
  try {
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('userId', '==', userId),
      where('status', 'in', ['waiting', 'called'])
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: Ticket[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({ ...doc.data() } as Ticket);
    });
    
    return tickets;
  } catch (error) {
    console.error('ユーザーの整理券取得に失敗しました:', error);
    throw error;
  }
}

/**
 * 整理券の状態を更新
 */
export async function updateTicketStatus(
  ticketId: string,
  status: Ticket['status']
): Promise<boolean> {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
      status
    });
    return true;
  } catch (error) {
    console.error('整理券の状態更新に失敗しました:', error);
    return false;
  }
}

/**
 * 整理券発行の受付状態を変更
 */
export async function setAcceptingStatus(isAccepting: boolean): Promise<boolean> {
  try {
    const storeRef = doc(db, 'stores', STORE_ID);
    await updateDoc(storeRef, {
      isAccepting,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('受付状態の変更に失敗しました:', error);
    return false;
  }
}

/**
 * 待機中の整理券一覧を取得
 */
export async function getWaitingTickets(): Promise<Ticket[]> {
  try {
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('status', '==', 'waiting')
    );
    
    const querySnapshot = await getDocs(q);
    const tickets: Ticket[] = [];
    
    querySnapshot.forEach((doc) => {
      tickets.push({ ...doc.data() } as Ticket);
    });
    
    // 整理券番号でソート
    tickets.sort((a, b) => a.ticketNumber - b.ticketNumber);
    
    return tickets;
  } catch (error) {
    console.error('待機中の整理券取得に失敗しました:', error);
    throw error;
  }
}
