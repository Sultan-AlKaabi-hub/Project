import nodemailer from "nodemailer";
export const mailAvailable = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
export async function sendReset(email, code, lang, otp=false) {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    requireTLS: process.env.SMTP_PORT !== "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject:
      otp ? "Rasid verification code / رمز التحقق" : lang === "en" ? "Rasid sign-in recovery" : "استعادة الدخول إلى راصد",
    text:
      otp ? (lang === "en" ? `Your Rasid verification code is ${code}. It expires in 5 minutes. Never share it.` : `رمز التحقق هو ${code}. صالح لخمس دقائق. لا تشاركه مع أحد.`) : lang === "en"
        ? `Your Rasid recovery code is ${code}. It expires in 15 minutes. If you did not request it, ignore this email.`
        : `رمز استعادة الدخول إلى راصد هو ${code}. تنتهي صلاحيته خلال ١٥ دقيقة. تجاهل الرسالة إذا لم تطلب الرمز.`,
  });
}

export const sendOtp=(email,code,lang)=>sendReset(email,code,lang,true);
