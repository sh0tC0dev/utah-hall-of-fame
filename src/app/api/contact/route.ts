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

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Utah HOF <onboarding@resend.dev>",
      to: CONTACT_EMAILS,
      replyTo: email,
      subject: `Contact: ${subject || "General Inquiry"}`,
      text: `From: ${name} (${email})\nSubject: ${subject || "General Inquiry"}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
