import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Client } from "@line/bot-sdk";

// Firebase Admin SDKの初期化
admin.initializeApp();

// LINE Messaging APIのクライアント設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
};

const lineClient = new Client(lineConfig);

/**
 * Firestoreの呼び出し番号が更新されたときに実行される関数
 * 3番前の整理券を持っているユーザーにLINE通知を送る
 */
export const notifyUpcomingTurn = functions
  .region("asia-northeast1") // 東京リージョン
  .firestore
  .document("callNumbers/{docId}")
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      const oldData = change.before.data();

      // 呼び出し番号フィールドの取得
      const newCallNumber = newData.currentNumber;
      const oldCallNumber = oldData.currentNumber;

      // 呼び出し番号が更新されていない場合は処理しない
      if (!newCallNumber || newCallNumber === oldCallNumber) {
        console.log("呼び出し番号が更新されていません");
        return null;
      }

      console.log(`呼び出し番号が ${oldCallNumber} から ${newCallNumber} に更新されました`);

      // 3番前の整理券番号を計算
      const targetTicketNumber = newCallNumber + 3;

      // 対象の整理券を持つユーザーを検索
      const ticketsRef = admin.firestore().collection("tickets");
      const querySnapshot = await ticketsRef
        .where("ticketNumber", "==", targetTicketNumber)
        .where("status", "==", "waiting") // 待機中のチケットのみ
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        console.log(`整理券番号 ${targetTicketNumber} のユーザーが見つかりません`);
        return null;
      }

      // ユーザー情報を取得
      const ticketDoc = querySnapshot.docs[0];
      const ticketData = ticketDoc.data();
      const lineUserId = ticketData.lineUserId;

      if (!lineUserId) {
        console.error("LINE ユーザーIDが見つかりません");
        return null;
      }

      console.log(`整理券番号 ${targetTicketNumber} のユーザー ${lineUserId} に通知を送信します`);

      // LINEメッセージを送信
      const message = {
        type: "text" as const,
        text: `まもなく順番です\n\nあなたの整理券番号: ${targetTicketNumber}\n現在の呼び出し番号: ${newCallNumber}\n\nもうすぐあなたの番です。準備をお願いします。`,
      };

      await lineClient.pushMessage(lineUserId, message);

      console.log(`LINE通知を送信しました: ${lineUserId}`);

      // 通知済みフラグを更新
      await ticketDoc.ref.update({
        notified: true,
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error("エラーが発生しました:", error);
      throw error;
    }
  });

/**
 * 手動でテスト通知を送るHTTP関数(開発用)
 */
export const sendTestNotification = functions
  .region("asia-northeast1")
  .https.onRequest(async (req, res) => {
    try {
      const lineUserId = req.query.userId as string;

      if (!lineUserId) {
        res.status(400).send("LINE ユーザーIDが必要です");
        return;
      }

      const message = {
        type: "text" as const,
        text: "まもなく順番です\n\nこれはテスト通知です。",
      };

      await lineClient.pushMessage(lineUserId, message);

      res.status(200).send({
        success: true,
        message: "テスト通知を送信しました",
        userId: lineUserId,
      });
    } catch (error) {
      console.error("テスト通知の送信に失敗しました:", error);
      res.status(500).send({
        success: false,
        error: String(error),
      });
    }
  });
