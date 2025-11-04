export default async function handler(req, res) {
  if (req.method === "GET") {
    // Webhook verification
    const verifyToken = process.env.META_VERIFY_TOKEN;
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode && token && mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  } else if (req.method === "POST") {
    console.log("Incoming message:", req.body);
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.status(405).send("Method Not Allowed");
  }
}
