// Driver registry. Maps ProviderKind → driver instance. v1 ships
// postmark + noop. SendGrid + Resend are R11+ stubs that throw on
// send so the agency knows to switch back to a wired provider.

import type { ProviderKind } from "../../lib/domain";
import type { EmailDriver } from "../ports";
import { NoopDriver } from "./noop";
import { PostmarkDriver } from "./postmark";

export class StubDriver implements EmailDriver {
  constructor(public readonly kind: ProviderKind, private message: string) {}
  async send() {
    return { ok: false as const, reason: this.message };
  }
}

// Build the default registry. Tests can substitute by passing their
// own map into `buildEmailSenderContainer({ drivers })`.
export function defaultDriverRegistry(
  fetchImpl: typeof fetch = fetch,
): Map<ProviderKind, EmailDriver> {
  const map = new Map<ProviderKind, EmailDriver>();
  map.set("none", new NoopDriver());
  map.set("postmark", new PostmarkDriver(fetchImpl));
  map.set("sendgrid", new StubDriver("sendgrid", "SendGrid driver — R11 stub. Switch provider to 'postmark' or 'none' for now."));
  map.set("resend", new StubDriver("resend", "Resend driver — R11 stub. Switch provider to 'postmark' or 'none' for now."));
  map.set("smtp", new StubDriver("smtp", "SMTP driver — R11 stub. Switch provider to 'postmark' or 'none' for now."));
  return map;
}

export { NoopDriver, PostmarkDriver };
