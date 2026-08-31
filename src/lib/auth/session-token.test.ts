import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { encodeSession, decodeSession } from "./session-token";

describe("session-token", () => {
  const secret = "test-auth-secret-for-unit-tests";

  it("round-trips a session payload", () => {
    const session = {
      user: {
        id: "123456789",
        email: "user@example.com",
        name: "Test User",
        provider: "google" as const,
        image: "https://example.com/avatar.png",
      },
    };

    const token = encodeSession(session, secret);
    const decoded = decodeSession(token, secret);
    expect(decoded).toEqual(session);
  });

  it("rejects tampered tokens", () => {
    const token = encodeSession({
      user: {
        id: "1",
        email: "a@b.com",
        name: "A",
        provider: "google",
      },
    }, secret);

    const tampered = `${token.slice(0, -1)}x`;
    expect(decodeSession(tampered, secret)).toBeNull();
  });

  it("matches Python HMAC signing for a fixed payload", () => {
    const payload = Buffer.from(JSON.stringify({
      user: { id: "google-sub", email: "a@b.com", name: "A", provider: "google" },
    })).toString("base64url");

    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    const token = `${payload}.${signature}`;

    expect(decodeSession(token, secret)?.user.id).toBe("google-sub");
  });
});
