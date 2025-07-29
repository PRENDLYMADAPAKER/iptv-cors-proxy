const express = require("express");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://iptv-login-3204b-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

app.get("/secure-playlist", async (req, res) => {
  const { user, session } = req.query;

  if (!user || !session) {
    return res.status(400).send("Missing user/session");
  }

  try {
    const userSnap = await db.ref(`users/${user}`).once("value");
    if (!userSnap.exists()) return res.status(404).send("User not found");

    const userData = userSnap.val();
    if (userData.status !== "active") return res.status(403).send("Account not active");

    const today = new Date().toISOString().split("T")[0];
    if (userData.expiration < today) return res.status(403).send("Account expired");

    const devices = userData.devices || {};
    const deviceKeys = Object.keys(devices);

    if (!devices[session] && deviceKeys.length >= userData.device_limit) {
      return res.status(403).send("Device limit reached");
    }

    await db.ref(`users/${user}/devices/${session}`).set(true);

    if (!userData.playlist) return res.status(404).send("No playlist found");

    const response = await fetch(userData.playlist);
    const m3uData = await response.text();

    res.set("Content-Type", "application/x-mpegURL");
    res.send(m3uData);
  } catch (err) {
    res.status(500).send("Server error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log("✅ IPTV Proxy is running on port " + PORT);
});
