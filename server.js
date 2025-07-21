const express = require("express");
const cors = require("cors");
const request = require("request");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

app.get("/stream", (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing 'url' parameter.");
  }

  try {
    request({ url: targetUrl, headers: { 'User-Agent': 'Mozilla/5.0' } })
      .on("error", () => res.status(500).send("Stream error."))
      .pipe(res);
  } catch (err) {
    res.status(500).send("Invalid stream.");
  }
});

app.listen(PORT, () => {
  console.log(`CORS proxy running on port ${PORT}`);
});
