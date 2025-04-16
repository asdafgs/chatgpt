const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

app.use(express.json());

async function transferToken() {
  const url = "http://154.219.100.31:6759/get-account";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Token fetch failed");
    const data = await res.json();
    return data;
  } catch (_err) {
    return -1;
  }
}

app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { messages, stream, model } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array." });
    }

    let token = await transferToken();
    if (token === -1 || token.error) token = await transferToken();
    if (token === -1 || token.error) token = await transferToken();

    const accessToken = token.accountName;

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, stream: !!stream }),
    });

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      response.body.pipe(res);
    } else {
      const result = await response.json();
      res.status(200).json(result);
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "OpenAI API request failed." });
  }
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
