import {
  Html,
  Body,
  Container,
  Text,
  Head,
} from "@react-email/components";
import * as React from "react";

export function BaseLayout({children}: {children: React.ReactNode;}) {
  return (
    <Html>
      <Head />
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#F9F9F9",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: 480,
            margin: "40px auto",
            backgroundColor: "#ffffff",
            border: "1px solid #CECECE",
            borderRadius: 20,
            padding: 40,
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
