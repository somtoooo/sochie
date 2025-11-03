import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🟢 WhatsApp Verification (Meta setup)
app.get("/api/webhook", (req, res) => {
  const verifyToken = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === verifyToken) {
    console.log("✅ Webhook verified with Meta!");
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Verification failed");
  }
});

// 🟣 Handle WhatsApp messages
app.post("/api/webhook", async (req, res) => {
  try {
    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body;

    if (!message) return res.sendStatus(200); // no text message

    console.log("📩 Incoming:", message);

    // Send to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Sochie, an AI assistant by Posads Company Nigeria Ltd. You help agents record and manage accounts clearly and politely.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = response.choices[0].message.content;
    console.log("🤖 Sochie:", reply);

    // ⚠️ For now, we only log replies. Later, we’ll send via WhatsApp Cloud API.
    res.status(200).send("EVENT_RECEIVED");
  } catch (err) {
    console.error("Error:", err);
    res.sendStatus(500);
  }
});

export default app;
