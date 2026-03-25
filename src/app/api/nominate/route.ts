import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const CONTACT_EMAIL = process.env.CONTACT_EMAIL ?? "ed.wehking@comcast.net";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      nomineeName, nomineeAddress, nomineeCity, nomineeState, nomineeZip,
      residentTenYears, age, dateOfBirth, yearStarted, lastYearCompeted,
      championships, administrativeExcellence, isIndustryRep,
      hasMemorabilia, memorabiliaDescription, isDeceased, dateOfDeath,
      relativeName, relativeRelationship, relativeAddress, relativePhone,
      relativeCity, relativeState, relativeZip, submitterName, submitterDate,
    } = body;

    const champsRows = (championships ?? [])
      .filter((c: { event: string }) => c.event?.trim())
      .map(
        (c: { event: string; year: string; location: string }, i: number) =>
          `  ${i + 1}. ${c.event} (${c.year}) — ${c.location}`
      )
      .join("\n");

    const emailBody = `
UTAH TRAPSHOOTING HALL OF FAME
NOMINATION FORM SUBMISSION

══════════════════════════════════════
NOMINEE INFORMATION
══════════════════════════════════════
Name: ${nomineeName}
Address: ${nomineeAddress}, ${nomineeCity}, ${nomineeState} ${nomineeZip}
Resident of Utah & ATA member 10+ years: ${residentTenYears}
Age: ${age}
Date of Birth: ${dateOfBirth}
Year Started Competitive Trapshooting: ${yearStarted}
Last Year of Competition: ${lastYearCompeted}

══════════════════════════════════════
SHOOTING MERIT — Major Championships
══════════════════════════════════════
${champsRows || "  None listed"}

══════════════════════════════════════
ADMINISTRATIVE EXCELLENCE
══════════════════════════════════════
${administrativeExcellence || "None listed"}

══════════════════════════════════════
ADDITIONAL INFORMATION
══════════════════════════════════════
Industry Representative: ${isIndustryRep}
Has Memorabilia to Contribute: ${hasMemorabilia}
${memorabiliaDescription ? `Memorabilia Details: ${memorabiliaDescription}` : ""}
${isDeceased === "yes" ? `Deceased — Date of Death: ${dateOfDeath}` : "Not deceased"}

══════════════════════════════════════
NEAREST RELATIVE
══════════════════════════════════════
Name: ${relativeName ?? "N/A"}
Relationship: ${relativeRelationship ?? "N/A"}
Address: ${relativeAddress ?? "N/A"}, ${relativeCity ?? ""}, ${relativeState ?? ""} ${relativeZip ?? ""}
Phone: ${relativePhone ?? "N/A"}

══════════════════════════════════════
SUBMITTED BY
══════════════════════════════════════
Name: ${submitterName}
Date: ${submitterDate}
    `.trim();

    await resend.emails.send({
      from: "Utah HOF <onboarding@resend.dev>",
      to: CONTACT_EMAIL,
      subject: `HOF Nomination: ${nomineeName}`,
      text: emailBody,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Nomination email error:", error);
    return NextResponse.json({ error: "Failed to send nomination" }, { status: 500 });
  }
}
