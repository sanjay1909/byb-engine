/**
 * emailAdapter.ts — Interface for email sending operations.
 *
 * Handles transactional emails (order confirmations, shipping notifications)
 * and marketing campaigns.
 *
 * Cloud adapters implement it for their specific email service:
 * - AWS: SES (Simple Email Service)
 * - Azure: Azure Communication Services / SendGrid
 * - GCP: SendGrid / Mailgun
 */

/** A single email recipient */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/** Parameters for sending a single email */
export interface EmailSendParams {
  /** Sender address */
  from: EmailRecipient;
  /** List of recipients */
  to: EmailRecipient[];
  /** Email subject line */
  subject: string;
  /** HTML body */
  htmlBody: string;
  /** Plain text body (fallback) */
  textBody?: string;
  /** Reply-to address */
  replyTo?: EmailRecipient;
}

/** Parameters for sending a templated email */
export interface EmailSendTemplatedParams {
  from: EmailRecipient;
  to: EmailRecipient[];
  /** Template identifier */
  templateId: string;
  /** Template data (merged into template placeholders) */
  templateData: Record<string, unknown>;
}

/** Result of an email send operation */
export interface EmailSendResult {
  /** Provider-specific message ID */
  messageId: string;
  /** Whether the send was accepted (not necessarily delivered) */
  accepted: boolean;
}

/**
 * Email adapter interface.
 *
 * Required methods contract: ['send', 'sendTemplated']
 */
export interface EmailAdapter {
  /** Send a single email with raw HTML/text content. */
  send(params: EmailSendParams): Promise<EmailSendResult>;

  /** Send an email using a pre-defined template with merge data. */
  sendTemplated(params: EmailSendTemplatedParams): Promise<EmailSendResult>;
}

export const EMAIL_ADAPTER_REQUIRED_METHODS = ['send', 'sendTemplated'] as const;
