import { Storage } from "@google-cloud/storage";
import fs from "fs";
import Ffmpeg from "fluent-ffmpeg";

// constants
const storage = new Storage();

const rawVideoBucketName = "3sept2025-ytclone-raw-videos";
const processedVideosBucketName = "3sept2025-yt-clone-processed-videos";

const localRawVideosPath = "./raw-videos";
const localProcessedVideosPath = "./processed-videos";

/**
 * Creates the local directories for raw and processed videos.
 */
export function setupDirectories() {
  ensureDirectoryExistence(localRawVideosPath);
  ensureDirectoryExistence(localProcessedVideosPath);
}

/**
 * Convert a downloaded raw video to 720p and save it locally.
 * @param rawVideoName - filename in localRawVideosPath
 * @param processedVideoName - output filename in localProcessedVideosPath
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
  return new Promise<void>((resolve, reject) => {
    Ffmpeg(`${localRawVideosPath}/${rawVideoName}`)
      .outputOptions("-vf", "scale=-1:720") // 720p to match reference
      .on("end", () => {
        console.log("Processing finished successfully");
        resolve();
      })
      .on("error", (err: any) => {
        console.log("An error occurred:", err?.message ?? err);
        reject(err);
      })
      .save(`${localProcessedVideosPath}/${processedVideoName}`);
  });
}

/**
 * Download a raw video from GCS to the local raw folder.
 */
export async function downloadRawVideo(fileName: string) {
  await storage
    .bucket(rawVideoBucketName)
    .file(fileName)
    .download({ destination: `${localRawVideosPath}/${fileName}` });

  console.log(
    `gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideosPath}/${fileName}.`
  );
}

/**
 * Upload a processed video from local folder to the processed bucket and make it public.
 */
export async function uploadProcessedVideo(fileName: string) {
  const bucket = storage.bucket(processedVideosBucketName);

  await bucket.upload(`${localProcessedVideosPath}/${fileName}`, {
    destination: fileName,
  });
  console.log(
    `${localProcessedVideosPath}/${fileName} uploaded to gs://${processedVideosBucketName}/${fileName}.`
  );

  await bucket.file(fileName).makePublic();
}

/**
 * Delete a local file if it exists.
 */
function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Failed to delete file at ${filePath}`, err);
          reject(err);
        } else {
          console.log(`File deleted at ${filePath}`);
          resolve();
        }
      });
    } else {
      console.log(`File not found at ${filePath}, skipping delete.`);
      resolve();
    }
  });
}

/**
 * Ensure a directory exists (create recursively if needed).
 */
function ensureDirectoryExistence(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Directory created at ${dirPath}`);
  }
}

/**
 * Delete helpers matching the reference structure.
 */
export function deleteRawVideo(fileName: string) {
  return deleteFile(`${localRawVideosPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string) {
  return deleteFile(`${localProcessedVideosPath}/${fileName}`);
}
