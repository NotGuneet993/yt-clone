
import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";
import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {Firestore} from "firebase-admin/firestore";
import {Storage} from "@google-cloud/storage";
import {onCall} from "firebase-functions/v2/https";

setGlobalOptions({maxInstances: 10});

initializeApp();
const firestore = new Firestore();
const storage = new Storage();

const rawVideoBucketName = "3sept2025-ytclone-raw-videos";
const videoCollectionId = "videos";

export interface Video {
  id?: string,
  uid?: string,
  filename?: string,
  status?: "processing" | "processed",
  title?: string,
  description?: string
}

export const createUser = functions.auth.user().onCreate((user) => {
  const userInfo = {
    uid: user.uid,
    email: user.email,
    photoUrl: user.photoURL,
  };

  firestore.collection("users").doc(user.uid).set(userInfo);
  logger.info(`User Created: ${JSON.stringify(userInfo)}`);
  return;
});

export const generateUploadUrl = onCall({maxInstances: 1}, async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called while authenticated."
    );
  }

  const auth = request.auth;
  const data = request.data;
  const bucket = storage.bucket(rawVideoBucketName);

  const fileName = `${auth.uid}-${Date.now()}.${data.fileExtension}`;
  const [url] = await bucket.file(fileName).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 15 * 6 * 1000,
  });

  return {url, fileName};
});

export const getVideos = onCall({maxInstances: 1}, async () => {
  const snapshot = await firestore
    .collection(videoCollectionId).limit(10).get();
  snapshot.docs.map((doc) => doc.data());
});
