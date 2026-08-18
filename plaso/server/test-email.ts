import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Simulate how env.ts loads it
const rootEnvPath = path.resolve(process.cwd(), '../.env');
dotenv.config({ path: rootEnvPath });

console.log('--- ENVIRONMENT DIAGNOSTICS ---');
console.log(`CWD: ${process.cwd()}`);
console.log(`Root Env Path: ${rootEnvPath}`);
console.log(`EMAIL_HOST loaded: ${!!process.env.EMAIL_HOST}`);
console.log(`EMAIL_PORT loaded: ${!!process.env.EMAIL_PORT}`);
console.log(`EMAIL_USER loaded: ${!!process.env.EMAIL_USER}`);
console.log(`EMAIL_PASSWORD loaded: ${!!process.env.EMAIL_PASSWORD}`);
console.log(`EMAIL_FROM loaded: ${!!process.env.EMAIL_FROM}`);

async function testSMTP() {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : undefined;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;

  if (!emailHost || !emailUser || !emailPassword) {
    console.log('[EMAIL] MODE = SIMULATION (Variables missing)');
    return;
  }

  console.log('[EMAIL] MODE = SMTP');

  const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort || 587,
    secure: emailPort === 465,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  try {
    console.log('[EMAIL] SMTP transport verification started');
    await transporter.verify();
    console.log('[EMAIL] SMTP transport verification SUCCESS');

    console.log(`[EMAIL] Attempting to send test email FROM ${emailFrom || emailUser} TO ${emailUser}...`);
    const info = await transporter.sendMail({
      from: emailFrom || 'noreply@plaso.app',
      to: emailUser,
      subject: 'PLASO SMTP TEST',
      text: 'This is a test email from the Plaso development server.',
    });

    console.log('[EMAIL] sendMail completed');
    console.log(`[EMAIL] messageId: ${info.messageId}`);
    console.log(`[EMAIL] accepted: ${info.accepted}`);
    console.log(`[EMAIL] rejected: ${info.rejected}`);
    console.log(`[EMAIL] response: ${info.response}`);

  } catch (error: any) {
    console.log('[EMAIL] SMTP verification or send FAILED');
    console.error(error.message);
    if (error.responseCode) {
      console.log(`Response Code: ${error.responseCode}`);
    }
  }
}

testSMTP();
