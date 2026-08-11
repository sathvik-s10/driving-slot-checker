import 'dotenv/config';
import twilio from 'twilio';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_TO_NUMBER } = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER || !TWILIO_TO_NUMBER) {
  console.error('Missing TWILIO_* env vars');
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const call = await client.calls.create({
  from: TWILIO_FROM_NUMBER,
  to: TWILIO_TO_NUMBER,
  twiml: '<Response><Say>A slot is now open at 911 Driving School. Go book it now.</Say><Pause length="1"/><Say>A slot is now open at 911 Driving School. Go book it now.</Say></Response>'
});

console.log('Call SID:', call.sid, 'Status:', call.status);
