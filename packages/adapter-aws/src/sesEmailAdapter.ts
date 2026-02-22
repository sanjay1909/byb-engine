/**
 * sesEmailAdapter.ts — AWS SES implementation of EmailAdapter.
 *
 * Wraps the AWS SDK v3 SES client for sending transactional and templated emails.
 * Used for order confirmations, shipping notifications, and marketing campaigns.
 *
 * How it connects to the system:
 * - Registered under domain 'email' with ID 'ses'
 * - Resolved via store profile (profile.adapters.email = 'ses')
 * - Gated by the 'campaigns' feature capability
 *
 * Usage:
 *   const adapter = createSesEmailAdapter({ region: 'us-east-1' });
 *   await adapter.send({ from: { email: 'shop@example.com' }, to: [...], subject: '...', htmlBody: '...' });
 */

import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
} from '@aws-sdk/client-ses';
import type {
  EmailAdapter,
  EmailSendParams,
  EmailSendTemplatedParams,
  EmailSendResult,
} from '@byb/core';

export interface SesEmailAdapterOptions {
  /** AWS region */
  region?: string;
  /** Optional: inject a pre-configured SES client (for testing) */
  sesClient?: SESClient;
}

export function createSesEmailAdapter(options: SesEmailAdapterOptions): EmailAdapter {
  const client = options.sesClient ?? new SESClient({ region: options.region });

  /**
   * Formats an email recipient as 'Name <email>' or just 'email'.
   */
  function formatAddress(recipient: { email: string; name?: string }): string {
    return recipient.name
      ? `${recipient.name} <${recipient.email}>`
      : recipient.email;
  }

  return {
    async send(params: EmailSendParams): Promise<EmailSendResult> {
      const result = await client.send(
        new SendEmailCommand({
          Source: formatAddress(params.from),
          Destination: {
            ToAddresses: params.to.map((r) => formatAddress(r)),
          },
          ReplyToAddresses: params.replyTo
            ? [formatAddress(params.replyTo)]
            : undefined,
          Message: {
            Subject: { Data: params.subject, Charset: 'UTF-8' },
            Body: {
              Html: { Data: params.htmlBody, Charset: 'UTF-8' },
              ...(params.textBody
                ? { Text: { Data: params.textBody, Charset: 'UTF-8' } }
                : {}),
            },
          },
        }),
      );

      return {
        messageId: result.MessageId ?? '',
        accepted: true,
      };
    },

    async sendTemplated(params: EmailSendTemplatedParams): Promise<EmailSendResult> {
      const result = await client.send(
        new SendTemplatedEmailCommand({
          Source: formatAddress(params.from),
          Destination: {
            ToAddresses: params.to.map((r) => formatAddress(r)),
          },
          Template: params.templateId,
          TemplateData: JSON.stringify(params.templateData),
        }),
      );

      return {
        messageId: result.MessageId ?? '',
        accepted: true,
      };
    },
  };
}
