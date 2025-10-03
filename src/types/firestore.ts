/**
 * Firestoreデータ型定義
 */

import { Timestamp } from 'firebase/firestore';

/**
 * 店舗情報 (stores コレクション)
 * ドキュメントID: 店舗ID (例: "kimura")
 */
export interface Store {
  /** 現在呼び出し中の整理券番号 */
  currentTicketNumber: number;
  
  /** 最後に発行した整理券番号。次に発行する番号はこれに+1 */
  lastIssuedTicketNumber: number;
  
  /** 現在待っている組数 */
  waitingGroups: number;
  
  /** 整理券の発行を受け付けているか */
  isAccepting: boolean;
  
  /** 最終更新日時 */
  updatedAt: Timestamp;
}

/**
 * 整理券 (tickets コレクション)
 * ドキュメントID: 自動生成
 */
export interface Ticket {
  /** 整理券の番号 */
  ticketNumber: number;
  
  /** 
   * 整理券の状態
   * - waiting: 待機中
   * - called: 呼出済
   * - completed: 完了
   * - cancelled: キャンセル
   */
  status: 'waiting' | 'called' | 'completed' | 'cancelled';
  
  /** 整理券が発行された日時 */
  issuedAt: Timestamp;
  
  /** ユーザーの一意なID (LINEユーザーIDなど) */
  userId: string;
  
  /** 利用人数 */
  numberOfPeople: number;
  
  /** LINE通知済みフラグ (Cloud Functions用) */
  notified?: boolean;
  
  /** 通知日時 (Cloud Functions用) */
  notifiedAt?: Timestamp | null;
}

/**
 * 呼び出し番号 (callNumbers コレクション)
 * ドキュメントID: "current"
 * Cloud Functions用
 */
export interface CallNumber {
  /** 現在の呼び出し番号 */
  currentNumber: number;
  
  /** 最終更新日時 */
  updatedAt: Timestamp;
}

/**
 * 店舗情報 (旧システム互換用: storeInfo コレクション)
 * ドキュメントID: "current"
 */
export interface StoreInfo {
  /** 呼び出し番号 */
  callNumber: number;
  
  /** 本日の獲れたて情報 */
  todaySpecial: string;
  
  /** 最終更新日時 */
  updatedAt: Timestamp;
}

/**
 * ユーザー情報 (オプション: users コレクション)
 * 管理者ロールの管理に使用
 */
export interface User {
  /** ユーザーID */
  uid: string;
  
  /** ユーザー名 */
  displayName?: string;
  
  /** メールアドレス */
  email?: string;
  
  /** ユーザーロール */
  role: 'customer' | 'admin';
  
  /** 作成日時 */
  createdAt: Timestamp;
}

/**
 * 整理券発行リクエスト
 */
export interface IssueTicketRequest {
  /** LINEユーザーID */
  userId: string;
  
  /** 利用人数 */
  numberOfPeople: number;
}

/**
 * 整理券発行レスポンス
 */
export interface IssueTicketResponse {
  /** 成功フラグ */
  success: boolean;
  
  /** 発行された整理券番号 */
  ticketNumber?: number;
  
  /** 整理券ドキュメントID */
  ticketId?: string;
  
  /** 現在待っている組数 */
  waitingGroups?: number;
  
  /** エラーメッセージ */
  error?: string;
}

/**
 * 次の番号呼び出しリクエスト
 */
export interface CallNextRequest {
  /** 店舗ID */
  storeId: string;
}

/**
 * 次の番号呼び出しレスポンス
 */
export interface CallNextResponse {
  /** 成功フラグ */
  success: boolean;
  
  /** 新しい呼び出し番号 */
  currentTicketNumber?: number;
  
  /** 残りの待ち組数 */
  waitingGroups?: number;
  
  /** エラーメッセージ */
  error?: string;
}
