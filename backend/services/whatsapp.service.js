const twilio = require('twilio');

// ──────────────────────────────────────────────
// Twilio WhatsApp Service
// ──────────────────────────────────────────────

// Initialize client lazily so server still starts without credentials
let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token || sid.startsWith('your_')) {
      throw new Error('Twilio credentials not configured');
    }
    twilioClient = twilio(sid, token);
  }
  return twilioClient;
};

// ──────────────────────────────────────────────
// Message Templates
// ──────────────────────────────────────────────
const buildMessage = ({ toName, type, amount, balance, contactId }) => {
  const fmt = (n) => `₹${Math.abs(n).toLocaleString('en-IN')}`;
  const appLink = `https://khatabookclone.vercel.app/pay?contactId=${contactId || '123'}`;

  switch (type) {
    case 'given':
      return `Hi ${toName}, I gave you ${fmt(amount)}. Total due from you: ${fmt(balance)} 🙏\n\nConfirm payment: ${appLink}`;
    case 'received':
      return `Hi ${toName}, I received ${fmt(amount)} from you. Remaining balance: ${fmt(Math.abs(balance))} ✅\n\nView ledger: ${appLink}`;
    case 'reminder':
      return `⏰ Reminder: Hi ${toName}, you still owe me ${fmt(balance)}. Please arrange the payment.\n\nPay securely here: ${appLink}`;
    default:
      return `Hi ${toName}, transaction of ${fmt(amount)} has been recorded.`;
  }
};

// ──────────────────────────────────────────────
// Fallback: WhatsApp URL (works without Twilio)
// ──────────────────────────────────────────────
const buildWhatsAppLink = (phone, message) => {
  // Strip non-digits and ensure country code
  const cleanPhone = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
};

// ──────────────────────────────────────────────
// Main Send Function
// ──────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.toPhone - Contact's phone number
 * @param {string} params.toName  - Contact's display name
 * @param {string} params.type    - 'given' | 'received' | 'reminder'
 * @param {number} params.amount  - Transaction amount
 * @param {number} params.balance - Contact's current balance
 * @param {string} params.contactId - DB ID for active linking
 * @returns {{ success: boolean, sid?: string, fallbackLink: string }}
 */
const sendWhatsAppMessage = async ({ toPhone, toName, type, amount, balance, contactId }) => {
  const message = buildMessage({ toName, type, amount, balance, contactId });
  const fallbackLink = buildWhatsAppLink(toPhone, message);

  try {
    const client = getTwilioClient();
    const msg = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER, // e.g. whatsapp:+14155238886
      to: `whatsapp:${toPhone}`,
      body: message,
    });
    console.log(`✅ WhatsApp sent to ${toPhone}, SID: ${msg.sid}`);
    return { success: true, sid: msg.sid, fallbackLink };
  } catch (error) {
    // Twilio not configured or rate limited → return fallback link
    console.warn(`⚠️ WhatsApp via Twilio failed: ${error.message}`);
    return { success: false, fallbackLink };
  }
};

module.exports = { sendWhatsAppMessage, buildWhatsAppLink, buildMessage };
