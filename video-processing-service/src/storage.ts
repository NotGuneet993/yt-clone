import { Storage } from "@google-cloud/storage";
import fs from 'fs';
import Ffmpeg from "fluent-ffmpeg";

// constants
const storage = new Storage()

const rawVideoBucketName = "3sept2025-ytclone-raw-videos";
const processedVideosBucketName = "3sept2025-yt-clone-processed-videos";

const localRawVideosPath = "./raw-videos";
const localProcessedVideosPath = "./raw-processed";


export function setupDirectories() {
    ensureDirectoryExistence(localRawVideosPath);
    ensureDirectoryExistence(localProcessedVideosPath);
}

export function convertVideo(rawVideoName: string, proccessedVideoname: string) {
    return new Promise<void>((resolve, reject) => {
        Ffmpeg(`${localRawVideosPath}/${rawVideoName}`)
            .outputOption("-vf", "scale=-1:720")
            .on("end", () => {
                console.log("Processing finished sucessfully.");
                resolve();
            })
            .on("error", (err) => {
                console.log(`An error occured: ${err.message}`);
                reject();
            })
            .save(`${localProcessedVideosPath}/${proccessedVideoname}`);
    })
}

export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
    .file(fileName)
    .download({ destination: `${localRawVideosPath}/${fileName}` });

    console.log("The video has been downloaded from the bucket.");
}

export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideosBucketName);

    await bucket.upload(`${localProcessedVideosPath}/${fileName}`,{
        destination: fileName
    });

    console.log("The video has been uploaded to the bucket.");
    
    await bucket.file(fileName).makePublic();
}

function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err);
                } else {
                    console.log(`File deleted at  ${filePath}`);
                    resolve();
                }
            })
        } else {
            console.log(`File not found at $${filePath}, skipping the delete.`);
            resolve();
        }
    });
}

function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true});
        console.log(`Directroy created at ${dirPath}`);
    }
}

export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideosPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideosPath}/${fileName}`);
}