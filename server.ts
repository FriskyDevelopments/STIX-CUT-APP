import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import sharp from "sharp";
import Stripe from "stripe";

dotenv.config();

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Add COOP/COEP headers for ffmpeg.wasm
  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  // Sticker Forging Logic
  app.post("/api/forge-sticker", async (req, res) => {
    const { 
      prompt, 
      aesthetic, 
      previewOnly = false,
      options = {} 
    } = req.body;
    
    const {
      strokeWidth = 0,
      fillColor = "vibrant",
      outlineColor = "white",
      style = "Cyberpunk"
    } = options;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!previewOnly && (!botToken || !chatId)) {
      return res.status(500).json({ error: "Telegram configuration missing." });
    }

    try {
      // 1. Generate Image
      // Incorporate options into the prompt for best results with Pollinations
      const stylePrompts: Record<string, string> = {
        "Cyberpunk": "neon lights, futuristic, high-tech, dark background with glowing accents",
        "Retro Futurism": "1950s vision of the future, sleek curves, pastel colors, raygun gothic",
        "Synthwave": "80s retro, grid lines, sunset colors, purple and pink gradients",
        "Minimalist": "clean lines, simple shapes, limited color palette, flat design",
        "Glitch Art": "digital distortion, chromatic aberration, scanlines, fragmented colors"
      };

      const selectedStylePrompt = stylePrompts[style] || stylePrompts["Cyberpunk"];
      const customizationPrompt = `outline: ${outlineColor}, fill: ${fillColor}, stroke: ${strokeWidth}px`;
      
      const fullPrompt = `${prompt}, ${selectedStylePrompt}, ${aesthetic} aesthetic, ${customizationPrompt}, hyper-detailed digital sticker design, solid white background for easy extraction`;
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&nologo=true`;
      
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Process with Sharp
      // We'll use a more aggressive background removal logic if possible, 
      // but for now, we'll stick to resizing and converting to WebP.
      const processedBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ lossless: true })
        .toBuffer();

      if (previewOnly) {
        return res.json({ 
          success: true, 
          previewUrl: `data:image/webp;base64,${processedBuffer.toString('base64')}` 
        });
      }

      // 3. Send to Telegram
      const formData = new FormData();
      formData.append("chat_id", chatId!);
      formData.append("sticker", new Blob([processedBuffer], { type: "image/webp" }), "sticker.webp");

      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendSticker`, {
        method: "POST",
        body: formData,
      });

      const data = await telegramResponse.json();
      if (data.ok) {
        res.json({ 
          success: true,
          stickerUrl: `data:image/webp;base64,${processedBuffer.toString('base64')}`
        });
      } else {
        res.status(400).json({ error: data.description });
      }
    } catch (error) {
      console.error("Sticker forge error:", error);
      res.status(500).json({ error: "Failed to forge or send sticker." });
    }
  });

  // Stripe Checkout Endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    const { type } = req.body; // "pro" or "stars"

    try {
      const priceId = type === "stars" ? process.env.STRIPE_STARS_PRICE_ID : process.env.STRIPE_PRICE_ID;
      
      if (!priceId) {
        return res.status(400).json({ error: `Price ID for ${type} not configured.` });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/?${type}=true`,
        cancel_url: `${req.headers.origin}/`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe Customer Portal Endpoint
  app.post("/api/create-portal-session", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured." });
    }

    try {
      // In a real app, you would get the customer ID from your database based on the authenticated user
      // For this demo, we'll look for a customer ID in the request or try to find one by email if provided
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required to manage subscription." });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin}/`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe Portal error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Telegram Archive Endpoint
  app.post("/api/archive/telegram", async (req, res) => {
    const { analysis, fileName } = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({ 
        error: "Telegram configuration missing. Please set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID." 
      });
    }

    const message = `
📦 *Stix Magic Archive*
🎥 *File:* ${fileName}
⏱️ *Viral Window:* ${analysis.viral_start_timestamp} - ${analysis.viral_end_timestamp}

🔥 *Hype:* ${analysis.aesthetic_caption.hype}
💻 *Tech:* ${analysis.aesthetic_caption.tech}
✨ *Aesthetic:* ${analysis.aesthetic_caption.aesthetic}
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      const data = await response.json();
      if (data.ok) {
        res.json({ success: true });
      } else {
        res.status(400).json({ error: data.description });
      }
    } catch (error) {
      console.error("Telegram API error:", error);
      res.status(500).json({ error: "Failed to send message to Telegram." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
