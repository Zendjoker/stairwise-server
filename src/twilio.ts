import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !verifyServiceSid) {
  throw new Error(
    'Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_VERIFY_SERVICE_SID in the environment'
  );
}

const client = Twilio(accountSid, authToken);
const verifyService = client.verify.v2.services(verifyServiceSid);

export async function sendOtp(phone: string): Promise<void> {
  await verifyService.verifications.create({ to: phone, channel: 'sms' });
}

export async function checkOtp(phone: string, code: string): Promise<boolean> {
  const check = await verifyService.verificationChecks.create({ to: phone, code });
  return check.status === 'approved';
}
