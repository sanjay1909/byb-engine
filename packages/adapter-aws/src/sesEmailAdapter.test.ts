/**
 * Tests for sesEmailAdapter.ts — validates the SES EmailAdapter implementation.
 *
 * Covers:
 * - send: constructs SendEmailCommand correctly
 * - sendTemplated: constructs SendTemplatedEmailCommand correctly
 * - Address formatting (name + email vs email only)
 * - Reply-to handling
 * - Satisfies EmailAdapter contract
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSesEmailAdapter } from './sesEmailAdapter.js';
import { assertAdapterContract, EMAIL_ADAPTER_REQUIRED_METHODS } from '@byb/core';

function createMockSesClient() {
  return {
    send: vi.fn().mockResolvedValue({ MessageId: 'msg-123' }),
  };
}

describe('createSesEmailAdapter', () => {
  let mockClient: ReturnType<typeof createMockSesClient>;
  let adapter: ReturnType<typeof createSesEmailAdapter>;

  beforeEach(() => {
    mockClient = createMockSesClient();
    adapter = createSesEmailAdapter({
      region: 'us-east-1',
      sesClient: mockClient as any,
    });
  });

  it('satisfies the EmailAdapter contract', () => {
    assertAdapterContract(
      adapter as unknown as Record<string, unknown>,
      [...EMAIL_ADAPTER_REQUIRED_METHODS],
      'ses',
      'email',
    );
  });

  describe('send', () => {
    it('sends email with HTML body', async () => {
      const result = await adapter.send({
        from: { email: 'shop@example.com', name: 'My Shop' },
        to: [{ email: 'customer@test.com' }],
        subject: 'Order Confirmed',
        htmlBody: '<h1>Thank you!</h1>',
      });

      expect(result.messageId).toBe('msg-123');
      expect(result.accepted).toBe(true);

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Source).toBe('My Shop <shop@example.com>');
      expect(command.input.Destination.ToAddresses).toEqual(['customer@test.com']);
      expect(command.input.Message.Subject.Data).toBe('Order Confirmed');
      expect(command.input.Message.Body.Html.Data).toBe('<h1>Thank you!</h1>');
    });

    it('includes text body when provided', async () => {
      await adapter.send({
        from: { email: 'shop@example.com' },
        to: [{ email: 'customer@test.com' }],
        subject: 'Test',
        htmlBody: '<p>HTML</p>',
        textBody: 'Plain text',
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Message.Body.Text.Data).toBe('Plain text');
    });

    it('includes reply-to when provided', async () => {
      await adapter.send({
        from: { email: 'shop@example.com' },
        to: [{ email: 'customer@test.com' }],
        subject: 'Test',
        htmlBody: '<p>HTML</p>',
        replyTo: { email: 'support@example.com', name: 'Support' },
      });

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.ReplyToAddresses).toEqual([
        'Support <support@example.com>',
      ]);
    });
  });

  describe('sendTemplated', () => {
    it('sends templated email with template data', async () => {
      const result = await adapter.sendTemplated({
        from: { email: 'shop@example.com' },
        to: [{ email: 'customer@test.com' }],
        templateId: 'OrderConfirmation',
        templateData: { orderNumber: '12345', total: '$49.99' },
      });

      expect(result.messageId).toBe('msg-123');

      const command = mockClient.send.mock.calls[0][0];
      expect(command.input.Template).toBe('OrderConfirmation');
      expect(JSON.parse(command.input.TemplateData)).toEqual({
        orderNumber: '12345',
        total: '$49.99',
      });
    });
  });
});
