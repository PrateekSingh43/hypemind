// C:\Users\prate\Hypemind\apps\api\src\utils\email\template\welcome.tsx
import { Section, Text, Link, Button } from "@react-email/components";
import { BaseLayout } from "./BaseLayout";

export interface VerifyEmailProps {
  url: string;
}

export function VerifyEmail({ url }: VerifyEmailProps) {
  return (
    <BaseLayout>
      <Section style={{ textAlign: "center" }}>

        {/* Logo SVG inline here if needed */}

        <Text
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#111",
            marginBottom: 16,
          }}
        >
          Please verify your email
        </Text>

        <Text
          style={{
            fontSize: 15,
            color: "#424040",
            lineHeight: "22px",
            marginBottom: 30,
          }}
        >
          To use Tasksfy, click the verification button. This keeps your account
          secure.
        </Text>

        <Button
          href={url}
          style={{
            backgroundColor: "#0057FF",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Verify my account
        </Button>

        <Text
          style={{
            fontSize: 14,
            color: "#424040",
            marginTop: 24,
          }}
        >
          If the button doesn’t work, copy and paste this URL:
        </Text>

        <Link href={url}>{url}</Link>
      </Section>
    </BaseLayout>
  );
}
