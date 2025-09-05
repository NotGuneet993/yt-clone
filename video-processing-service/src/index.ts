import express from "express";
import Ffmpeg from "fluent-ffmpeg";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";

setupDirectories();

const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {
    let data;

    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error("Invalid message payload received.");
        }
    } catch (err) {
        console.error(err);
        return res.status(400).send("Bad Request: missing filename.");
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    await downloadRawVideo(inputFileName);

    // convert the video
    try {
        await convertVideo(inputFileName, outputFileName);
    } catch (err) {
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);

        console.error(err);
        return res.status(500).send("Internal Server Error: video processing failed.");
    }

    await uploadProcessedVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send("Processing finished successfully");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video prcessing service is running at port ${port}`);
})