import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Column,
  Section,
  Text,
  Link,
} from "@react-email/components";

interface Props {
  unsubscribeUrl?: string;
}

export function WelcomeEmail({ unsubscribeUrl = "#" }: Props) {
  return (
    <Html>
      <Head />
      <Preview>You're subscribed to the Tiber Brief — daily supply chain intelligence at 6 AM ET.</Preview>
      <Body style={main}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <Row>
              <Column style={{ width: "48px" }}>
                <Img
                  src="https://pulse.tibermfg.com/tiber-logo.png"
                  width="40"
                  height="40"
                  alt="Tiber"
                  style={{ borderRadius: "6px" }}
                />
              </Column>
              <Column>
                <Row>
                  <Text style={brandName}>TIBER</Text>
                  <Text style={brandSub}>BRIEF</Text>
                </Row>
                <Text style={brandTagline}>Daily Procurement Intelligence</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />

          {/* Hero */}
          <Section style={section}>
            <Text style={heading}>You&apos;re on the list.</Text>
            <Text style={body}>
              Starting tomorrow, you&apos;ll receive the <strong>Tiber Brief</strong> every morning at{" "}
              <strong>6 AM ET</strong> — a concise supply chain intelligence report covering:
            </Text>
          </Section>

          {/* Feature list */}
          <Section style={featureSection}>
            {[
              ["📦", "Raw material prices", "Live commodity data for copper, aluminum, steel, crude oil, and more"],
              ["🏷️", "Tariff exposure",     "Landed cost impact of active §232 and §301 tariffs on your materials"],
              ["📋", "Procurement playbook", "Specific buy/hold/watch calls you can act on each morning"],
              ["⚠️", "Watch list",           "Key signals to monitor for the week ahead"],
            ].map(([icon, title, desc]) => (
              <Row key={title} style={featureRow}>
                <Column style={featureIcon}>{icon}</Column>
                <Column>
                  <Text style={featureTitle}>{title}</Text>
                  <Text style={featureDesc}>{desc}</Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* CTA */}
          <Section style={{ ...section, textAlign: "center" as const }}>
            <Text style={body}>
              In the meantime, the live dashboard has today&apos;s data — including real-time commodity prices and the latest brief.
            </Text>
            <Button style={button} href="https://pulse.tibermfg.com">
              View Today&apos;s Dashboard →
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Tiber Manufacturing · supply chain intelligence for US manufacturers
            </Text>
            <Text style={footerText}>
              <Link href="https://tibermfg.com" style={footerLink}>tibermfg.com</Link>
              {" · "}
              <Link href={unsubscribeUrl} style={footerLink}>Unsubscribe</Link>
            </Text>
            <Text style={{ ...footerText, color: "#1e293b" }}>
              Not financial advice. Data sourced from FRED / Federal Reserve and AlphaVantage.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "32px 24px",
};

const header: React.CSSProperties = {
  marginBottom: "8px",
};

const brandName: React.CSSProperties = {
  display: "inline",
  color: "#eaeaea",
  fontSize: "18px",
  fontWeight: 900,
  fontFamily: "monospace",
  letterSpacing: "-0.5px",
  margin: "0 8px 0 0",
};

const brandSub: React.CSSProperties = {
  display: "inline",
  color: "#ff8800",
  fontSize: "11px",
  fontFamily: "monospace",
  letterSpacing: "3px",
  textTransform: "uppercase" as const,
  margin: 0,
};

const brandTagline: React.CSSProperties = {
  color: "#475569",
  fontSize: "11px",
  fontFamily: "monospace",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: "2px 0 0",
};

const divider: React.CSSProperties = {
  borderColor: "#1e293b",
  margin: "20px 0",
};

const section: React.CSSProperties = {
  marginBottom: "24px",
};

const heading: React.CSSProperties = {
  color: "#f1f5f9",
  fontSize: "26px",
  fontWeight: 700,
  margin: "0 0 12px",
  letterSpacing: "-0.3px",
};

const body: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const featureSection: React.CSSProperties = {
  backgroundColor: "#111827",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  padding: "16px 20px",
  marginBottom: "28px",
};

const featureRow: React.CSSProperties = {
  marginBottom: "14px",
};

const featureIcon: React.CSSProperties = {
  width: "32px",
  fontSize: "18px",
  verticalAlign: "top",
  paddingTop: "2px",
};

const featureTitle: React.CSSProperties = {
  color: "#e2e8f0",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 2px",
};

const featureDesc: React.CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.4",
  margin: 0,
};

const button: React.CSSProperties = {
  backgroundColor: "#ff8800",
  color: "#000000",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 28px",
  textDecoration: "none",
  display: "inline-block",
};

const footer: React.CSSProperties = {
  textAlign: "center" as const,
};

const footerText: React.CSSProperties = {
  color: "#334155",
  fontSize: "12px",
  margin: "4px 0",
  fontFamily: "monospace",
};

const footerLink: React.CSSProperties = {
  color: "#475569",
  textDecoration: "underline",
};
