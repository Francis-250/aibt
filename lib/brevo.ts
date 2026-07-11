interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async ({ to, subject, html, text }: EmailOptions) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ?? process.env.BREVO_EMAIL_USER;
    const senderName = process.env.BREVO_SENDER_NAME || "TyphoidWatch Rwanda";

    if (!apiKey) {
      console.error("Email error: BREVO_API_KEY is not configured");
      return false;
    }

    if (!senderEmail) {
      console.error("Email error: BREVO_SENDER_EMAIL is not configured");
      return false;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(text ? { textContent: text } : {}),
      }),
    });

    const responseText = await response.text();
    let responseBody: unknown = responseText;

    try {
      responseBody = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Brevo can return a non-JSON proxy response.
    }

    if (!response.ok) {
      console.error("Brevo email error:", {
        status: response.status,
        response: responseBody,
      });
      return false;
    }

    console.log("Email sent to:", to);
    return true;
  } catch (error) {
    console.error("Email error:", error);
    return false;
  }
};

export const sendEmailOrThrow = async (options: EmailOptions) => {
  const sent = await sendEmail(options);

  if (!sent) {
    throw new Error("Email delivery failed. Check the Brevo sender configuration.");
  }
};
