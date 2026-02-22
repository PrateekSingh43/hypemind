import { BaseLayout } from "./BaseLayout";
import { Section, Text, Button, Link } from "@react-email/components";


export function PasswordReset({ url }: { url: string }) {
  return (
    <BaseLayout>
      <Section style={{ textAlign: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: 600 }}>
          Reset your password
        </Text>

        <Text>
          This link expires in 10 minutes. Click below to reset your password.
        </Text>

        <Button href={url}>Reset Password</Button>

        <Link href={url}>{url}</Link>
      </Section>
    </BaseLayout>
  );
}
