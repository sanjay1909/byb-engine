/**
 * mockEmailAdapter.ts — In-memory mock implementation of EmailAdapter.
 *
 * Records all sent emails (raw and templated) in an array for inspection.
 * Generates mock message IDs and always reports accepted: true.
 * Provides inspector methods for testing and verification.
 */

import type {
  EmailAdapter,
  EmailSendParams,
  EmailSendTemplatedParams,
  EmailSendResult,
} from '@byb/core';

declare function setTimeout(callback: () => void, ms: number): unknown;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MockEmailAdapterOptions {
  /** Artificial delay in ms for each operation (default: 0) */
  delay?: number;
}

export interface MockSentEmail {
  type: 'raw' | 'templated';
  from: EmailSendParams['from'] | EmailSendTemplatedParams['from'];
  to: EmailSendParams['to'] | EmailSendTemplatedParams['to'];
  subject?: string;
  htmlBody?: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  sentAt: string;
}

export interface MockEmailAdapter extends EmailAdapter {
  /** Returns all sent emails for inspection */
  getSentEmails(): MockSentEmail[];
  /** Resets the sent emails list */
  clear(): void;
  /** Provisioning: configure an email sender identity for a store */
  configureEmailSender(params: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/**
 * Creates an in-memory mock email adapter.
 *
 * All sent emails are captured in an array that can be inspected via getSentEmails().
 * Each send returns a mock message ID and accepted: true.
 */
export function createMockEmailAdapter(
  options?: MockEmailAdapterOptions,
): MockEmailAdapter {
  const delay = options?.delay ?? 0;
  let idCounter = 0;
  const sentEmails: MockSentEmail[] = [];

  return {
    async send(params: EmailSendParams): Promise<EmailSendResult> {
      if (delay) await wait(delay);
      idCounter++;
      sentEmails.push({
        type: 'raw',
        from: params.from,
        to: params.to,
        subject: params.subject,
        htmlBody: params.htmlBody,
        sentAt: new Date().toISOString(),
      });
      return { messageId: `mock-email-${idCounter}`, accepted: true };
    },

    async sendTemplated(
      params: EmailSendTemplatedParams,
    ): Promise<EmailSendResult> {
      if (delay) await wait(delay);
      idCounter++;
      sentEmails.push({
        type: 'templated',
        from: params.from,
        to: params.to,
        templateId: params.templateId,
        templateData: params.templateData,
        sentAt: new Date().toISOString(),
      });
      return { messageId: `mock-email-${idCounter}`, accepted: true };
    },

    getSentEmails(): MockSentEmail[] {
      return sentEmails;
    },

    clear(): void {
      sentEmails.length = 0;
      idCounter = 0;
    },

    // ── Provisioning operations ──────────────────────────────────────

    async configureEmailSender(
      params: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
      if (delay) await wait(delay);
      const storeId = (params.storeId as string) ?? 'unknown';
      const senderEmail = `noreply@${storeId}.mock.local`;
      return {
        success: true,
        senderEmail,
        verified: true,
        storeId,
      };
    },
  };
}
