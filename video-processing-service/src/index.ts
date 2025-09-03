import express from "express";
import Ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json());

app.post("/process-video", (req, res) => {
    const inputFilePath = req.body.inputVideoPath;
    const outputFilePath = req.body.outputVideoPath;

    if (!inputFilePath) res.status(400).send("Bad request: Missing input file path.");
    if (!outputFilePath) res.status(400).send("Bad request: Missing output file path.");

    Ffmpeg(inputFilePath)
        .outputOption("-vf", "scale=-1:720")
        .on("end", () => {

        })
        .on("error", (err) => {
            console.log(`An error occured: ${err.message}`);
            res.status(500).send("Internal server error.");
        })
        .save(outputFilePath);
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video prcessing service is running at port ${port}`);
})