import 'dotenv/config';
import twilio from 'twilio';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_TO_NUMBER } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const calls = await client.calls.list({ to: TWILIO_TO_NUMBER, limit: 200 });
console.log(`Total calls found: ${calls.length}`);
calls.forEach((c) => {
  console.log(`${c.dateCreated.toISOString()}  status=${c.status}  duration=${c.duration}s`);
});
