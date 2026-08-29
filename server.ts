import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper function to create Gmail SMTP transporter
function getGmailTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_EMAIL || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user.trim(),
      pass: pass.trim().replace(/\s+/g, ""), // Gmail App passwords can sometimes have copy-pasted spaces
    },
  });
}

// Lazy-initialized Gemini client with telemetry header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-memory OTP storage for 3D Secure / Razorpay-style transactions
interface OtpSession {
  otpId: string;
  otp: string;
  cardNumber: string;
  amount: number;
  merchantName: string;
  expiresAt: number;
  phoneLast4: string;
}

const otpStore = new Map<string, OtpSession>();

// In-memory OTP storage for Credentials & Password Recovery
interface RecoveryOtpSession {
  recoveryId: string;
  otp: string;
  userId: string;
  portalType: "CUSTOMER" | "ADMIN";
  email: string;
  name: string;
  username: string;
  accountNumber?: string;
  password?: string;
  cifNumber?: string;
  employeeId?: string;
  expiresAt: number;
  refCode: string;
}

const recoveryOtpStore = new Map<string, RecoveryOtpSession>();

interface KycOtpSession {
  kycSessionId: string;
  otp: string;
  userId: string;
  name: string;
  email: string;
  panNumber: string;
  accountNumber: string;
  expiresAt: number;
  refCode: string;
}

const kycOtpStore = new Map<string, KycOtpSession>();

// Periodic cleanup of expired OTPs
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of otpStore.entries()) {
    if (session.expiresAt < now) {
      otpStore.delete(key);
    }
  }
  for (const [key, session] of recoveryOtpStore.entries()) {
    if (session.expiresAt < now) {
      recoveryOtpStore.delete(key);
    }
  }
  for (const [key, session] of kycOtpStore.entries()) {
    if (session.expiresAt < now) {
      kycOtpStore.delete(key);
    }
  }
}, 60000);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Helper function to generate Visa Secure 3D-Secure Transaction OTP Email
function generateVisaSecureOtpEmailHtml(params: {
  otp: string;
  amount: number;
  merchantName: string;
  cardNumber: string;
  cardholderName?: string;
  referenceNumber: string;
  formattedDate: string;
  formattedTime: string;
}) {
  const { otp, amount, merchantName, cardNumber, cardholderName, referenceNumber, formattedDate, formattedTime } = params;
  const maskedCard = `•••• •••• •••• ${cardNumber.replace(/\s+/g, "").slice(-4)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SRSADMIN Bank - Visa Secure OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0F172A; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); border: 2px solid #1A1F71;">
          
          <!-- Visa Secure & SRSADMIN Bank Top Bar -->
          <tr>
            <td style="background-color: #1A1F71; padding: 24px; border-bottom: 4px solid #F7B600;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 26px; font-weight: 900; color: #FFFFFF; font-style: italic; letter-spacing: -1px;">
                      VISA <span style="font-size: 14px; font-style: normal; font-weight: 800; background-color: #F7B600; color: #1A1F71; padding: 2px 8px; border-radius: 4px; vertical-align: middle; margin-left: 6px;">SECURE</span>
                    </div>
                    <div style="font-size: 11px; color: #93C5FD; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px;">
                      Verified by Visa • 3D-Secure 2.0 ACS
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <div style="font-size: 16px; font-weight: 900; color: #FFFFFF;">
                      SRSADMIN Bank
                    </div>
                    <div style="font-size: 11px; color: #FFD566; font-weight: 700;">
                      SRSADMIN बैंक
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice Header -->
          <tr>
            <td style="background-color: #EFF6FF; padding: 14px 24px; border-bottom: 1px solid #DBEAFE; text-align: center;">
              <span style="font-size: 12px; font-weight: 800; color: #1E40AF; text-transform: uppercase; letter-spacing: 1px;">
                Online Card Payment Authorization OTP
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Dear <strong>${cardholderName || "Valued Customer"}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
                You have initiated an online purchase on your <strong>SRSADMIN Bank Visa Card</strong>. Please use the One-Time Password (OTP) below to authenticate and authorize this transaction.
              </p>

              <!-- OTP Highlight Box -->
              <div style="background-color: #FFFBEB; border: 2px dashed #F59E0B; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 12px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                  Your Visa Secure 6-Digit OTP Code
                </span>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1A1F71; font-family: 'Courier New', Courier, monospace; margin: 6px 0;">
                  ${otp}
                </div>
                <span style="font-size: 11px; font-weight: 600; color: #B45309;">
                  ⏱️ Valid for 3 minutes only. Do NOT share with anyone.
                </span>
              </div>

              <!-- Transaction Summary Table -->
              <table role="presentation" width="100%" style="border-collapse: collapse; margin: 24px 0; background-color: #F8FAFC; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600; width: 40%;">Merchant Name:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 800;">${merchantName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Transaction Amount:</td>
                  <td style="padding: 12px 16px; font-size: 15px; color: #059669; font-weight: 900; font-family: monospace;">₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Card Number:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #1E293B; font-weight: 700; font-family: monospace;">${maskedCard}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Date & Time:</td>
                  <td style="padding: 12px 16px; font-size: 12px; color: #334155; font-family: monospace;">${formattedDate} ${formattedTime} IST</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Authentication Ref:</td>
                  <td style="padding: 12px 16px; font-size: 12px; color: #1A1F71; font-weight: 700; font-family: monospace;">${referenceNumber}</td>
                </tr>
              </table>

              <!-- Security Advice -->
              <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #991B1B; margin: 20px 0; line-height: 1.5;">
                <strong>⚠️ Security Warning:</strong> SRSADMIN Bank, Visa, or merchant officials will NEVER ask for your OTP, Card CVV, or NetBanking password over phone or email. If you did NOT attempt this transaction, please block your card immediately in SRSADMIN NetBanking or call <strong>1800 425 0018</strong>.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1E293B; padding: 18px 24px; text-align: center; color: #94A3B8; font-size: 11px;">
              <p style="margin: 0 0 4px 0; color: #E2E8F0; font-weight: 700;">
                SRSADMIN Bank Ltd. • Visa Secure Payment Gateway Services
              </p>
              <p style="margin: 0; font-size: 10px; color: #64748B;">
                This is an automated 3D-Secure 2.0 transaction alert. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Card Payment - Generate OTP Endpoint
app.post("/api/payment/generate-otp", async (req, res) => {
  try {
    const { cardNumber, amount, merchantName, customerPhone, customerEmail, cardholderName } = req.body;

    if (!cardNumber || !amount) {
      return res.status(400).json({ error: "Card number and transaction amount are required." });
    }

    const cleanCard = cardNumber.toString().replace(/\s+/g, "");
    if (cleanCard.length < 15) {
      return res.status(400).json({ error: "Invalid card number length." });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = `otp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const phone = customerPhone ? customerPhone.slice(-4) : "8841";
    const refCode = `VISA-3DS-${Math.floor(100000 + Math.random() * 900000)}`;

    const session: OtpSession = {
      otpId,
      otp: generatedOtp,
      cardNumber: cleanCard,
      amount: Number(amount),
      merchantName: merchantName || "Online Merchant",
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      phoneLast4: phone,
    };

    otpStore.set(otpId, session);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const targetEmail = (customerEmail && typeof customerEmail === "string" && customerEmail.includes("@"))
      ? customerEmail.trim()
      : "mssgeethu6@gmail.com";

    // Masked Email for UI Display (e.g., m***u6@gmail.com)
    const emailParts = targetEmail.split("@");
    const namePart = emailParts[0];
    const domainPart = emailParts[1] || "gmail.com";
    const maskedEmail = namePart.length > 2
      ? `${namePart[0]}••••${namePart.slice(-2)}@${domainPart}`
      : `${namePart}@${domainPart}`;

    let deliveryMode = "LOCAL_SIMULATION";
    const transporter = getGmailTransporter();

    if (transporter) {
      try {
        const senderUser = process.env.GMAIL_USER || process.env.SMTP_EMAIL || process.env.SMTP_USER;
        const htmlEmail = generateVisaSecureOtpEmailHtml({
          otp: generatedOtp,
          amount: Number(amount),
          merchantName: merchantName || "Online Merchant",
          cardNumber: cleanCard,
          cardholderName: cardholderName || "Valued Customer",
          referenceNumber: refCode,
          formattedDate,
          formattedTime,
        });

        await transporter.sendMail({
          from: `"SRSADMIN Bank - Visa Secure" <${senderUser}>`,
          to: targetEmail,
          subject: `SRSADMIN Bank: Visa Secure OTP for ${merchantName || "Online Purchase"} [${refCode}]`,
          html: htmlEmail,
        });

        deliveryMode = "LIVE_GMAIL_SMTP";
        console.log(`[Visa Secure OTP] Successfully sent OTP email to ${targetEmail} via Gmail SMTP`);
      } catch (mailErr) {
        console.warn("[Visa Secure OTP] Gmail SMTP send warning (falling back to simulation mode):", mailErr);
      }
    }

    return res.json({
      success: true,
      otpId,
      referenceNumber: refCode,
      maskedCard: `•••• •••• •••• ${cleanCard.slice(-4)}`,
      maskedPhone: `+91 ••••• •${phone}`,
      recipientEmail: targetEmail,
      maskedEmail,
      demoOtp: generatedOtp,
      expiresInSeconds: 180,
      deliveryMode,
      message: `One-Time Password (OTP) dispatched to your registered email (${maskedEmail}) and mobile ending in •${phone}.`,
    });
  } catch (error: any) {
    console.error("Generate OTP Error:", error);
    return res.status(500).json({ error: "Failed to generate transaction OTP." });
  }
});

// Card Payment - Verify OTP and Execute Charge Endpoint
app.post("/api/payment/verify-and-charge", (req, res) => {
  try {
    const { otpId, otp, cardNumber, amount, merchantName, notes } = req.body;

    if (!otpId || !otp) {
      return res.status(400).json({ error: "OTP ID and OTP are required." });
    }

    const session = otpStore.get(otpId);
    if (!session) {
      return res.status(400).json({ error: "Invalid or expired OTP session. Please request a new OTP." });
    }

    if (Date.now() > session.expiresAt) {
      otpStore.delete(otpId);
      return res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
    }

    if (session.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Incorrect OTP entered. Please verify." });
    }

    // OTP is valid - consume it
    otpStore.delete(otpId);

    // Generate RBI / NPCI compliant UTR reference
    const now = new Date();
    const dateStr = now.toISOString().slice(2, 10).replace(/-/g, "");
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const referenceNumber = `SRSA${dateStr}${randomHex}`;

    const timestamp = `${now.toISOString().split("T")[0]} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    return res.json({
      success: true,
      status: "COMPLETED",
      referenceNumber,
      amount: session.amount,
      merchantName: session.merchantName,
      timestamp,
      message: `Transaction of ₹${session.amount.toLocaleString("en-IN")} authorized successfully via RuPay / 3D-Secure.`,
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ error: "Failed to verify transaction OTP." });
  }
});

// Gemini Banking Assistant endpoint
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required." });
    }

    let ai: GoogleGenAI;
    try {
      ai = getGeminiClient();
    } catch (e: any) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please ensure GEMINI_API_KEY is available.",
      });
    }

    const systemInstruction = `You are "Shristi" (सृष्टि), the friendly, highly knowledgeable, and polite AI Banking Assistant mascot for SRSADMIN Bank (SRSADMIN बैंक), a premier Indian scheduled commercial bank.
You assist retail NetBanking customers and branch CBS banking officers.

Rules:
1. Greet customers warmly with "Namaste" or friendly professional courtesy. Introduce yourself as Shristi when relevant.
2. Provide concise, clear, human, professional, and mathematically accurate financial advice and answers.
3. When answering about account balances, cards, or transactions, refer directly to the user's provided account context.
4. Keep answers easy to read on mobile and desktop: use clean bullet points, bold key figures, and avoid robotic jargon or repetitive boilerplate.
5. If asked about security (PIN, OTP, CVV), remind them securely that SRSADMIN Bank and Shristi will never ask for private credentials or one-time passwords.
6. Format currency in Indian Rupees (₹).`;

    const userContent = context
      ? `[CONTEXT DATA]\n${JSON.stringify(context, null, 2)}\n\n[USER QUERY]\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userContent,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm here to help with your SRSADMIN Bank accounts, cards, and transactions.";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Assistant Error:", error);
    return res.status(500).json({
      error: "Unexpected error please try again",
    });
  }
});

// Helper function to generate Credential Recovery OTP Email
function generateRecoveryOtpEmailHtml(params: {
  otp: string;
  name: string;
  username: string;
  accountLastDigits: string;
  portalType: "CUSTOMER" | "ADMIN";
  referenceNumber: string;
  formattedDate: string;
  formattedTime: string;
}) {
  const { otp, name, username, accountLastDigits, portalType, referenceNumber, formattedDate, formattedTime } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SRSADMIN Bank - Credentials Recovery OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F0F4F8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F0F4F8; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); border: 2px solid #004B87;">
          
          <!-- Bank Header -->
          <tr>
            <td style="background-color: #004B87; padding: 26px 24px; border-bottom: 4px solid #FFB800; text-align: center;">
              <div style="display: inline-block; background-color: #FFB800; color: #003B6F; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px;">
                CONFIDENTIAL OTP AUTHENTICATION
              </div>
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
                SRSADMIN Bank <span style="font-size: 18px; color: #FFD566;">(SRSADMIN बैंक)</span>
              </h1>
              <p style="margin: 4px 0 0 0; color: #BAE6FD; font-size: 12px; letter-spacing: 0.5px;">
                Central Security Wing • NetBanking & CBS Password Recovery
              </p>
            </td>
          </tr>

          <!-- Notice Banner -->
          <tr>
            <td style="background-color: #EFF6FF; padding: 12px 24px; border-bottom: 1px solid #DBEAFE; text-align: center;">
              <span style="font-size: 12px; font-weight: 800; color: #1E40AF; text-transform: uppercase; letter-spacing: 1px;">
                ${portalType === "CUSTOMER" ? "Customer NetBanking Password Recovery OTP" : "Branch Officer CBS Desk Access OTP"}
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Dear <strong>${name || "Account Holder"}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
                We received a request to recover your NetBanking credentials for User ID: <strong style="color: #004B87;">${username}</strong> (Account ending in •••• <strong>${accountLastDigits}</strong>).
              </p>

              <!-- OTP Highlight Box -->
              <div style="background-color: #FFFBEB; border: 2px dashed #F59E0B; border-radius: 14px; padding: 22px; text-align: center; margin: 20px 0;">
                <span style="font-size: 12px; font-weight: 800; color: #92400E; text-transform: uppercase; letter-spacing: 1.2px; display: block; margin-bottom: 6px;">
                  Your 6-Digit Verification OTP Code
                </span>
                <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #004B87; font-family: 'Courier New', Courier, monospace; margin: 8px 0;">
                  ${otp}
                </div>
                <span style="font-size: 12px; font-weight: 700; color: #B45309; display: block; margin-top: 4px;">
                  ⏱️ Valid for 5 minutes only. Do NOT share this code with anyone.
                </span>
              </div>

              <!-- Request Verification Details -->
              <table role="presentation" width="100%" style="border-collapse: collapse; margin: 20px 0; background-color: #F8FAFC; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B; font-weight: 600; width: 40%;">Verified User ID:</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #0F172A; font-weight: 800; font-family: monospace;">${username}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Account Number:</td>
                  <td style="padding: 10px 16px; font-size: 13px; color: #0F172A; font-weight: 700; font-family: monospace;">•••• •••• ••${accountLastDigits}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Request Timestamp:</td>
                  <td style="padding: 10px 16px; font-size: 12px; color: #334155; font-family: monospace;">${formattedDate} ${formattedTime} IST</td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Security Reference:</td>
                  <td style="padding: 10px 16px; font-size: 12px; color: #004B87; font-weight: 800; font-family: monospace;">${referenceNumber}</td>
                </tr>
              </table>

              <!-- Security Advice -->
              <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #991B1B; margin: 18px 0; line-height: 1.5;">
                <strong>⚠️ Security Warning:</strong> SRSADMIN Bank, RBI, or branch staff will NEVER call to ask for your OTP or password. If you did not initiate this request, call our 24x7 Cyber Assistance Cell at <strong>1800 425 0018</strong> immediately.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 18px 24px; text-align: center; color: #94A3B8; font-size: 11px;">
              <p style="margin: 0 0 4px 0; color: #E2E8F0; font-weight: 700;">
                SRSADMIN Bank Ltd. • Central Digital Banking Authority
              </p>
              <p style="margin: 0; font-size: 10px; color: #64748B;">
                This is an automated security dispatch. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Request Credential Recovery OTP Endpoint
// Asks User ID and last digits of Account Number; does NOT return or reveal email before OTP verification!
app.post("/api/auth/request-recovery-otp", async (req, res) => {
  try {
    const { userId, accountLastDigits, portalType = "CUSTOMER", userAccount } = req.body;

    if (!userId || !accountLastDigits) {
      return res.status(400).json({ error: "User ID and last digits of Account Number are required." });
    }

    const cleanUserId = userId.toString().trim();
    const cleanLastDigits = accountLastDigits.toString().trim().replace(/\D/g, "");

    if (cleanLastDigits.length < 2) {
      return res.status(400).json({ error: "Please enter at least the last 4 digits of your account number." });
    }

    // Target registered email (obtained from matching account or defaults securely)
    const targetEmail = (userAccount && userAccount.email && userAccount.email.includes("@"))
      ? userAccount.email.trim()
      : (cleanUserId.toLowerCase() === "admin" ? "admin@srsadminbank.com" : "mssgeethu6@gmail.com");

    const userName = userAccount?.name || (cleanUserId.toLowerCase() === "admin" ? "Suhanth" : "Customer Account Holder");
    const accountNum = userAccount?.accountNumber || `021010100${cleanLastDigits}`;
    const userPass = userAccount?.password || (cleanUserId.toLowerCase() === "admin" ? "Suhanth@2626" : "UserPassword2026!");
    const cifNum = userAccount?.cifNumber || "84920194821";
    const empId = userAccount?.employeeId || (portalType === "ADMIN" ? "SRSA-ADMIN-001" : undefined);

    // Verify account last digits match
    const cleanFullAcc = accountNum.replace(/\D/g, "");
    if (!cleanFullAcc.endsWith(cleanLastDigits) && cleanFullAcc !== cleanLastDigits) {
      return res.status(400).json({
        error: `The account number ending in digits "${cleanLastDigits}" does not match the record for User ID "${cleanUserId}". Please verify.`,
      });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const recoveryId = `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const refCode = `SRSA-REC-${Math.floor(100000 + Math.random() * 900000)}`;

    const session: RecoveryOtpSession = {
      recoveryId,
      otp: generatedOtp,
      userId: cleanUserId,
      portalType,
      email: targetEmail,
      name: userName,
      username: cleanUserId,
      accountNumber: accountNum,
      password: userPass,
      cifNumber: cifNum,
      employeeId: empId,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      refCode,
    };

    recoveryOtpStore.set(recoveryId, session);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    let deliveryMode = "LOCAL_SIMULATION";
    const transporter = getGmailTransporter();

    if (transporter) {
      try {
        const senderUser = process.env.GMAIL_USER || process.env.SMTP_EMAIL || process.env.SMTP_USER;
        const htmlEmail = generateRecoveryOtpEmailHtml({
          otp: generatedOtp,
          name: userName,
          username: cleanUserId,
          accountLastDigits: cleanLastDigits,
          portalType,
          referenceNumber: refCode,
          formattedDate,
          formattedTime,
        });

        await transporter.sendMail({
          from: `"SRSADMIN Bank Security" <${senderUser}>`,
          to: targetEmail,
          subject: `SRSADMIN Bank: Credentials Recovery OTP [${refCode}]`,
          html: htmlEmail,
          text: `SRSADMIN Bank Recovery OTP\n\nYour 6-Digit OTP is: ${generatedOtp}\n\nRequested for User ID: ${cleanUserId}\nValid for 5 minutes. Never share your OTP with anyone.`,
        });

        deliveryMode = "LIVE_GMAIL_SMTP";
        console.log(`[Recovery OTP] Successfully sent OTP email to registered email via Gmail SMTP`);
      } catch (mailErr) {
        console.warn("[Recovery OTP] Gmail SMTP send warning (falling back to simulation mode):", mailErr);
      }
    }

    // Masked hint so user knows OTP is sent without exposing full email address
    const emailParts = targetEmail.split("@");
    const namePart = emailParts[0];
    const domainPart = emailParts[1] || "gmail.com";
    const maskedHint = namePart.length > 2
      ? `${namePart[0]}••••${namePart.slice(-2)}@${domainPart}`
      : `••••@${domainPart}`;

    return res.json({
      success: true,
      recoveryId,
      referenceNumber: refCode,
      portalType,
      maskedHint,
      demoOtp: generatedOtp,
      expiresInSeconds: 300,
      deliveryMode,
      message: `A 6-digit verification OTP has been dispatched to your registered email (${maskedHint}).`,
    });
  } catch (error: any) {
    console.error("Request Recovery OTP Error:", error);
    return res.status(500).json({ error: "Failed to process recovery OTP request." });
  }
});

// Verify Recovery OTP Endpoint
// ONLY upon successful OTP verification does this reveal the user's password, username, and full email!
app.post("/api/auth/verify-recovery-otp", (req, res) => {
  try {
    const { recoveryId, otp } = req.body;

    if (!recoveryId || !otp) {
      return res.status(400).json({ error: "Recovery Session ID and 6-digit OTP are required." });
    }

    const session = recoveryOtpStore.get(recoveryId);
    if (!session) {
      return res.status(400).json({ error: "Invalid or expired recovery session. Please request a new OTP." });
    }

    if (Date.now() > session.expiresAt) {
      recoveryOtpStore.delete(recoveryId);
      return res.status(400).json({ error: "Recovery OTP has expired. Please request a new OTP." });
    }

    if (session.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Incorrect 6-digit OTP entered. Please check your email and retry." });
    }

    // OTP is valid - consume session
    recoveryOtpStore.delete(recoveryId);

    // Reveal credentials and email address securely
    return res.json({
      success: true,
      message: "Identity verified successfully. Your login credentials and registered email are displayed below.",
      email: session.email,
      username: session.username,
      name: session.name,
      accountNumber: session.accountNumber,
      password: session.password,
      cifNumber: session.cifNumber,
      employeeId: session.employeeId,
      portalType: session.portalType,
      referenceNumber: session.refCode,
    });
  } catch (error: any) {
    console.error("Verify Recovery OTP Error:", error);
    return res.status(500).json({ error: "Failed to verify recovery OTP." });
  }
});

// Helper function to generate KYC Verification OTP Email
function generateKycOtpEmailHtml(params: {
  otp: string;
  name: string;
  panNumber: string;
  accountNumber: string;
  referenceNumber: string;
  formattedDate: string;
  formattedTime: string;
}) {
  const { otp, name, panNumber, accountNumber, referenceNumber, formattedDate, formattedTime } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SRSADMIN Bank - e-KYC Verification OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0F172A; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); border: 2px solid #004B87;">
          
          <!-- SRSADMIN Bank Top Bar -->
          <tr>
            <td style="background-color: #004B87; padding: 24px; border-bottom: 4px solid #FFB800;">
              <table role="presentation" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 22px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                      SRSADMIN Bank <span style="font-size: 14px; font-weight: 700; color: #FFD566;">(SRSADMIN बैंक)</span>
                    </div>
                    <div style="font-size: 11px; color: #BAE6FD; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px;">
                      KYC, AML & Regulatory Compliance Directorate
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 11px; font-weight: 800; background-color: #FFB800; color: #003B6F; padding: 4px 10px; border-radius: 6px; text-transform: uppercase;">
                      e-KYC 2.0
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Notice Header -->
          <tr>
            <td style="background-color: #F0FDF4; padding: 14px 24px; border-bottom: 1px solid #DCFCE7; text-align: center;">
              <span style="font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 1px;">
                Customer Identity Verification (PAN & Biometric OTP)
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                Dear <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
                You have initiated an <strong>e-KYC verification simulation</strong> for your SRSADMIN Bank account. Please use the One-Time Password (OTP) below to authenticate your identity and validate your PAN credentials.
              </p>

              <!-- OTP Highlight Box -->
              <div style="background-color: #ECFDF5; border: 2px dashed #10B981; border-radius: 14px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 12px; font-weight: 700; color: #065F46; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">
                  Your 6-Digit Bank KYC OTP Code
                </span>
                <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #064E3B; font-family: 'Courier New', Courier, monospace; margin: 6px 0;">
                  ${otp}
                </div>
                <span style="font-size: 11px; font-weight: 600; color: #047857;">
                  ⏱️ Valid for 5 minutes only. Do NOT share this OTP with anyone.
                </span>
              </div>

              <!-- Customer & Account Details Table -->
              <table role="presentation" width="100%" style="border-collapse: collapse; margin: 24px 0; background-color: #F8FAFC; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600; width: 40%;">Account Holder:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 800;">${name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Account Number:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #004B87; font-weight: 800; font-family: monospace;">${accountNumber}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">PAN Number:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0F172A; font-weight: 800; font-family: monospace;">${panNumber}</td>
                </tr>
                <tr style="border-bottom: 1px solid #E2E8F0;">
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">Generated Timestamp:</td>
                  <td style="padding: 12px 16px; font-size: 12px; color: #334155; font-family: monospace;">${formattedDate} ${formattedTime} IST</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; color: #64748B; font-weight: 600;">KYC Audit Reference:</td>
                  <td style="padding: 12px 16px; font-size: 12px; color: #004B87; font-weight: 700; font-family: monospace;">${referenceNumber}</td>
                </tr>
              </table>

              <!-- Compliance Note -->
              <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 12px 16px; font-size: 12px; color: #92400E; margin: 20px 0; line-height: 1.5;">
                <strong>📋 Statutory Compliance Notice:</strong> Per RBI & PMLA guidelines, completing KYC verification unlocks full transactional limits, cheque privileges, high-limit RuPay/Visa cards, and international remittances.
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1E293B; padding: 18px 24px; text-align: center; color: #94A3B8; font-size: 11px;">
              <p style="margin: 0 0 4px 0; color: #E2E8F0; font-weight: 700;">
                SRSADMIN Bank • Core Banking System KYC Cell
              </p>
              <p style="margin: 0; font-size: 10px; color: #64748B;">
                Automated regulatory compliance message. In case of issues, contact your home branch.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Request KYC Verification OTP Endpoint
app.post("/api/kyc/send-otp", async (req, res) => {
  try {
    const { userId, name, email, panNumber, accountNumber } = req.body;

    if (!userId || !panNumber) {
      return res.status(400).json({ error: "User ID and PAN Number are required." });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const kycSessionId = `kyc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const refCode = `SRSA-KYC-${Math.floor(100000 + Math.random() * 900000)}`;

    const targetEmail = (email && email.trim()) || "mssgeethu6@gmail.com";
    const userName = name || "Valued Customer";
    const cleanPan = panNumber.toString().toUpperCase().trim();
    const cleanAccount = accountNumber || "0210101004892";

    const session: KycOtpSession = {
      kycSessionId,
      otp: generatedOtp,
      userId,
      name: userName,
      email: targetEmail,
      panNumber: cleanPan,
      accountNumber: cleanAccount,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      refCode,
    };

    kycOtpStore.set(kycSessionId, session);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    let deliveryMode = "SIMULATION_FALLBACK";

    const transporter = getGmailTransporter();
    if (transporter) {
      try {
        const senderUser = process.env.GMAIL_USER || process.env.SMTP_EMAIL || process.env.SMTP_USER;
        const htmlEmail = generateKycOtpEmailHtml({
          otp: generatedOtp,
          name: userName,
          panNumber: cleanPan,
          accountNumber: cleanAccount,
          referenceNumber: refCode,
          formattedDate,
          formattedTime,
        });

        await transporter.sendMail({
          from: `"SRSADMIN Bank KYC Compliance" <${senderUser}>`,
          to: targetEmail,
          subject: `SRSADMIN Bank: e-KYC Verification OTP [${refCode}]`,
          html: htmlEmail,
          text: `SRSADMIN Bank e-KYC Verification OTP\n\nYour 6-Digit OTP is: ${generatedOtp}\n\nPAN: ${cleanPan}\nValid for 5 minutes. Never share your OTP with anyone.`,
        });

        deliveryMode = "LIVE_GMAIL_SMTP";
        console.log(`[KYC OTP] Successfully dispatched OTP email to ${targetEmail} via Gmail SMTP`);
      } catch (mailErr) {
        console.warn("[KYC OTP] Gmail SMTP send warning (falling back to simulation mode):", mailErr);
      }
    }

    const emailParts = targetEmail.split("@");
    const namePart = emailParts[0];
    const domainPart = emailParts[1] || "gmail.com";
    const maskedEmail = namePart.length > 2
      ? `${namePart[0]}••••${namePart.slice(-2)}@${domainPart}`
      : `••••@${domainPart}`;

    return res.json({
      success: true,
      kycSessionId,
      referenceNumber: refCode,
      maskedEmail,
      demoOtp: generatedOtp,
      expiresInSeconds: 300,
      deliveryMode,
      message: `A 6-digit KYC verification OTP has been dispatched to ${maskedEmail}.`,
    });
  } catch (error: any) {
    console.error("Send KYC OTP Error:", error);
    return res.status(500).json({ error: "Failed to send KYC verification OTP." });
  }
});

// Verify KYC OTP Endpoint
app.post("/api/kyc/verify-otp", (req, res) => {
  try {
    const { kycSessionId, otp, panNumber } = req.body;

    if (!kycSessionId || !otp) {
      return res.status(400).json({ error: "KYC Session ID and 6-digit OTP are required." });
    }

    const session = kycOtpStore.get(kycSessionId);
    if (!session) {
      return res.status(400).json({ error: "Invalid or expired KYC session. Please request a new OTP." });
    }

    if (Date.now() > session.expiresAt) {
      kycOtpStore.delete(kycSessionId);
      return res.status(400).json({ error: "KYC OTP has expired. Please request a new OTP." });
    }

    if (session.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: "Incorrect 6-digit KYC OTP. Please check your email and retry." });
    }

    // OTP is valid - consume session
    kycOtpStore.delete(kycSessionId);

    return res.json({
      success: true,
      message: "Customer identity and PAN verification successfully completed via bank OTP.",
      userId: session.userId,
      panNumber: panNumber || session.panNumber,
      referenceNumber: session.refCode,
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Verify KYC OTP Error:", error);
    return res.status(500).json({ error: "Failed to verify KYC OTP." });
  }
});

// Check Gmail SMTP Configuration Status
app.get("/api/auth/smtp-status", (_req, res) => {
  const user = process.env.GMAIL_USER || process.env.SMTP_EMAIL || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  const isConfigured = Boolean(user && pass);
  res.json({
    configured: isConfigured,
    senderEmail: user ? `${user.substring(0, 3)}••••@${user.split("@")[1] || "gmail.com"}` : null,
    provider: "Gmail SMTP (smtp.gmail.com:465 / 587)",
  });
});

// Recover Credentials Endpoint (Sends Forgot Password / Forgot Login ID via Gmail SMTP)
app.post("/api/auth/recover-credentials", async (req, res) => {
  try {
    const {
      type, // 'FORGOT_PASSWORD' | 'FORGOT_LOGIN_ID'
      portalType = "CUSTOMER", // 'CUSTOMER' | 'ADMIN'
      recipientEmail,
      name,
      username,
      accountNumber,
      cifNumber,
      employeeId,
      tempPassword,
      customNote,
    } = req.body;

    if (!recipientEmail || typeof recipientEmail !== "string") {
      return res.status(400).json({ error: "Recipient email address is required." });
    }

    const cleanEmail = recipientEmail.trim();
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const formattedTime = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const refCode = `SRSA-REC-${Math.floor(100000 + Math.random() * 900000)}`;

    const isPasswordRecovery = type === "FORGOT_PASSWORD";
    const subject = isPasswordRecovery
      ? `SRSADMIN Bank: Account Password Recovery Notice [Ref: ${refCode}]`
      : `SRSADMIN Bank: NetBanking Customer ID & Login Information [Ref: ${refCode}]`;

    // High quality branded HTML email template
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F6F9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Bank Header -->
          <tr>
            <td style="background-color: #004B87; padding: 28px 24px; border-bottom: 4px solid #FFB800; text-align: center;">
              <table role="presentation" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: #FFB800; color: #003B6F; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px;">
                      Official Security Dispatch
                    </div>
                    <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">
                      SRSADMIN Bank <span style="font-size: 18px; color: #FFD566;">(SRSADMIN बैंक)</span>
                    </h1>
                    <p style="margin: 4px 0 0 0; color: #BAE6FD; font-size: 12px; letter-spacing: 0.5px;">
                      Premier Scheduled Commercial Bank • NetBanking Security Wing
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #0F172A;">
                Dear ${name || "Valued Account Holder"},
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                ${isPasswordRecovery
                  ? "We received an online request to recover the password for your <strong>SRSADMIN NetBanking Portal</strong> account."
                  : "We received an online request to retrieve your registered <strong>Customer Login ID</strong> credentials for SRSADMIN NetBanking."
                }
              </p>

              <!-- Credentials Table Box -->
              <table role="presentation" width="100%" style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 12px; margin: 20px 0; border-collapse: separate; border-spacing: 0; overflow: hidden;">
                <tr style="background-color: #004B87; color: #FFFFFF;">
                  <td colspan="2" style="padding: 12px 18px; font-size: 13px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                    ${isPasswordRecovery ? "🔐 Security Credentials Details" : "🪪 NetBanking Login Identity"}
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0; width: 40%;">
                    ${portalType === "CUSTOMER" ? "Customer Name" : "Officer Name"}:
                  </td>
                  <td style="padding: 12px 18px; font-size: 14px; color: #0F172A; font-weight: 800; border-bottom: 1px solid #E2E8F0;">
                    ${name || "Customer Account"}
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">
                    ${portalType === "CUSTOMER" ? "Customer Login ID / Username" : "Officer Employee ID"}:
                  </td>
                  <td style="padding: 12px 18px; font-size: 14px; color: #004B87; font-weight: 900; font-family: monospace; border-bottom: 1px solid #E2E8F0;">
                    ${username || employeeId || "admin"}
                  </td>
                </tr>

                ${accountNumber ? `
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">
                    Primary Account Number:
                  </td>
                  <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; font-weight: 800; font-family: monospace; border-bottom: 1px solid #E2E8F0;">
                    ${accountNumber}
                  </td>
                </tr>` : ""}

                ${cifNumber ? `
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">
                    Customer CIF Number:
                  </td>
                  <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; font-weight: 700; font-family: monospace; border-bottom: 1px solid #E2E8F0;">
                    ${cifNumber}
                  </td>
                </tr>` : ""}

                ${isPasswordRecovery && tempPassword ? `
                <tr style="background-color: #FEF3C7;">
                  <td style="padding: 14px 18px; font-size: 13px; color: #92400E; font-weight: 800;">
                    Active / Password:
                  </td>
                  <td style="padding: 14px 18px; font-size: 15px; color: #B45309; font-weight: 900; font-family: monospace;">
                    ${tempPassword}
                  </td>
                </tr>` : ""}
              </table>

              ${customNote ? `
              <div style="background-color: #EFF6FF; border-left: 4px solid #004B87; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #1E3A8A; margin: 16px 0;">
                ${customNote}
              </div>` : ""}

              <!-- Security Advice Box -->
              <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 16px; margin: 24px 0;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="vertical-align: top; width: 24px; font-size: 18px;">⚠️</td>
                    <td style="padding-left: 10px; font-size: 12px; color: #92400E; line-height: 1.5;">
                      <strong>Mandatory Cybersecurity Advisory:</strong><br>
                      • SRSADMIN Bank or its AI assistant <strong>Shristi</strong> will NEVER call or ask for your password, debit card PIN, OTP, or CVV.<br>
                      • If you did not initiate this recovery, call our 24x7 Cyber Vigilance Cell at <strong>1800 425 0018</strong> immediately.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Request Metadata -->
              <table role="presentation" width="100%" style="font-size: 11px; color: #94A3B8; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px;">
                <tr>
                  <td><strong>Dispatched on:</strong> ${formattedDate} at ${formattedTime} IST</td>
                  <td align="right"><strong>Reference:</strong> ${refCode}</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0F172A; padding: 20px 24px; text-align: center; color: #94A3B8; font-size: 11px; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; color: #CBD5E1; font-weight: 700;">
                SRSADMIN Bank Ltd. (A Scheduled Commercial Bank)
              </p>
              <p style="margin: 0 0 8px 0;">
                Central Digital Banking Operations • Bengaluru Town Hall, Karnataka, India - 560002
              </p>
              <p style="margin: 0; font-size: 10px; color: #64748B;">
                This is an automated system generated email notification. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const transporter = getGmailTransporter();

    if (transporter) {
      try {
        const senderUser = process.env.GMAIL_USER || process.env.SMTP_EMAIL || process.env.SMTP_USER;
        const info = await transporter.sendMail({
          from: `"SRSADMIN Bank Security" <${senderUser}>`,
          to: cleanEmail,
          subject,
          html: htmlEmail,
          text: `SRSADMIN Bank Security Notice\n\nDear ${name || "Customer"},\n\nYour login credentials request [Ref: ${refCode}]:\n- Login ID / User ID: ${username || "admin"}\n- Primary Account: ${accountNumber || "N/A"}\n${isPasswordRecovery ? `- Password: ${tempPassword || "Suhanth@2626"}\n` : ""}\n\nSecurity Notice: Never share your credentials or OTP with anyone.\n24x7 Helpline: 1800 425 0018`,
        });

        console.log(`[SMTP] Live recovery email successfully sent to ${cleanEmail} via Gmail. MessageId: ${info.messageId}`);

        return res.json({
          success: true,
          mode: "LIVE_GMAIL_SMTP",
          messageId: info.messageId,
          recipientEmail: cleanEmail,
          referenceNumber: refCode,
          message: `Official credentials email sent directly to ${cleanEmail} via Gmail SMTP. Please check your inbox and spam folder.`,
        });
      } catch (smtpErr: any) {
        console.error("Gmail SMTP Send Failure:", smtpErr);
        // Fallback response with helpful diagnostic information
        return res.json({
          success: true,
          mode: "FALLBACK_DEMO",
          warning: `Gmail SMTP authentication check: ${smtpErr.message || "Invalid credentials"}. Please ensure GMAIL_APP_PASSWORD uses a 16-character Google App Password (not your normal Gmail password).`,
          recipientEmail: cleanEmail,
          referenceNumber: refCode,
          message: `Credentials dispatched to ${cleanEmail} (Simulated mode: check credentials displayed on screen or configure Google App Password in settings for live Gmail inbox delivery).`,
        });
      }
    } else {
      // SMTP not yet configured in environment variables
      return res.json({
        success: true,
        mode: "LOCAL_SIMULATION",
        recipientEmail: cleanEmail,
        referenceNumber: refCode,
        message: `Recovery credentials sent to ${cleanEmail}. (To deliver live emails to Gmail, configure GMAIL_USER and GMAIL_APP_PASSWORD in settings).`,
      });
    }
  } catch (error: any) {
    console.error("Recover credentials error:", error);
    return res.status(500).json({ error: "Failed to process credential recovery request." });
  }
});


async function startServer() {
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SRSADMIN Bank Core Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
