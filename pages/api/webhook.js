import axios from "axios";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // ✅ Webhook verification (Meta calls this once)
    const verifyToken = process.env.META_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === verifyToken) {
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Forbidden");
    }
  }

  if (req.method === "POST") {
    try {
      const body = req.body;

      if (body.object === "whatsapp_business_account") {
        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        const phoneNumberId =
          body.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

        if (message && phoneNumberId) {
          const from = message.from;
          const userText = message.text?.body || "";

          console.log("Incoming:", from, userText);

          // 🧠 AI Response (OpenAI)
          const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are Sochie, an AI assistant built by Posads Company Nigeria Ltd. You help Ajo collectors and small businesses keep accurate financial records. Respond clearly and politely in simple English.",
                },
                { role: "user", content: userText },
              ],
            }),
          });

          const aiData = await aiResponse.json();
          const aiMessage = aiData.choices?.[0]?.message?.content || "I'm here!";

          // 💬 Send message back to WhatsApp
          await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to: from,
              type: "text",
              text: { body: aiMessage },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("Sochie replied:", aiMessage);
        }
      }

      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      console.error("Webhook Error:", error.message);
      res.status(500).send("Error processing webhook");
    }
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
