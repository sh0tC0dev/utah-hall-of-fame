import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const CONTACT_EMAILS = [
  "ed.wehking@comcast.net",
  "John.vosnos@yahoo.com",
];

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { name, email, subject, message } = await req.json();

    // The visitor's address becomes the reply-to: one address, no whitespace or line breaks.
    if (!name || !email || !message || typeof email !== "string" || /\s/.test(email)) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    const { error } = await resend.emails.send({
      from: "Utah Trapshooting Hall of Fame <utah-hof-contact@forms.shotcopro.com>",
      to: CONTACT_EMAILS,
      replyTo: email,
      subject: `Contact: ${subject || "General Inquiry"}`,
      text: `From: ${name} (${email})\nSubject: ${subject || "General Inquiry"}\n\n${message}`,
    });
    // Resend returns a refusal instead of throwing; the catch answers the 500.
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
