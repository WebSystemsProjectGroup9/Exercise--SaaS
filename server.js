const express = require("express");
const multer = require("multer");
const vision = require("@google-cloud/vision");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

const upload = multer({ storage: multer.memoryStorage() });

let client;

if (process.env.GOOGLE_CLOUD_PROJECT) {
    client = new vision.ImageAnnotatorClient();
} else {
    client = new vision.ImageAnnotatorClient({
        keyFilename: path.join(__dirname, "vision-saas-key.json")
    });
}
app.use(express.static("public"));

app.post("/upload", upload.single("pic"), async (req, res) => {
    try {
        const imageBuffer = req.file.buffer;
        const base64Img = imageBuffer.toString("base64");

        const [result] = await client.labelDetection(imageBuffer);
        const labels = result.labelAnnotations;

        let html = `
      <h1>Detected Labels</h1>

      <h3>Uploaded Image:</h3>
      <img src="data:image/jpeg;base64,${base64Img}" 
           style="max-width:300px;border:1px solid #ccc;">

      <h3>Labels:</h3>
      <ul>
    `;

        labels.forEach(label => {
            html += `<li>${label.description} (score: ${label.score.toFixed(2)})</li>`;
        });

        html += `
      </ul>
      <br><br>
      <a href="/" style="font-size:18px;">⬅ Back to Upload Page</a>
    `;

        res.send(html);

    } catch (err) {
        console.error(err);
        res.status(500).send("Error calling Vision API");
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
