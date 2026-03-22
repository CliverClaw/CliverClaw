/**
 * Communication Tools
 *
 * SMS, voice calls, and phone verification tools powered by Twilio.
 */

import { z } from 'zod';
import type { X402Client } from '../client.js';
import type { ToolDefinition } from '../types.js';

// =============================================================================
// Input Schemas
// =============================================================================

export const SendSmsInput = z.object({
  to: z.string().min(1, 'Recipient phone number is required'),
  message: z.string().min(1, 'Message is required').max(1600, 'Message must be under 1600 characters'),
  from: z.string().optional(),
});

export const MakeCallInput = z.object({
  to: z.string().min(1, 'Recipient phone number is required'),
  from: z.string().optional(),
  twiml: z.string().optional(),
  url: z.string().url().optional(),
  message: z.string().optional(),
});

export const VerifyPhoneInput = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  channel: z.enum(['sms', 'call', 'whatsapp']).optional().default('sms'),
  locale: z.string().optional(),
});

export const VerifyCheckInput = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required'),
  code: z.string().min(4, 'Verification code is required').max(10, 'Invalid verification code'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const communicationTools: ToolDefinition[] = [
  {
    name: 'x402_send_sms',
    description: `Send an SMS message to a phone number. Costs ~$0.008/message.

Powered by Twilio for reliable global delivery:
- Send to phone numbers worldwide
- Supports standard SMS (160 chars) and concatenated messages (up to 1600 chars)
- Delivery status tracking
- Automatic carrier routing

Perfect for:
- Notifications and alerts
- Appointment reminders
- Two-factor authentication codes
- Customer communications

Note: Phone numbers should be in E.164 format (e.g., +14155551234).`,
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient phone number in E.164 format (e.g., +14155551234)',
        },
        message: {
          type: 'string',
          description: 'The message to send (max 1600 characters)',
        },
        from: {
          type: 'string',
          description: 'Optional sender phone number or alphanumeric sender ID',
        },
      },
      required: ['to', 'message'],
    },
  },
  {
    name: 'x402_make_call',
    description: `Make a voice call to a phone number. Costs ~$0.014/minute.

Powered by Twilio for programmable voice:
- Call any phone number worldwide
- Text-to-speech for messages
- TwiML for complex call flows
- Webhook support for dynamic responses

Perfect for:
- Phone verification
- Automated reminders
- Voice notifications
- Customer outreach

Note: Phone numbers should be in E.164 format (e.g., +14155551234).`,
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient phone number in E.164 format (e.g., +14155551234)',
        },
        from: {
          type: 'string',
          description: 'Optional caller ID phone number',
        },
        message: {
          type: 'string',
          description: 'Text message to speak using text-to-speech',
        },
        twiml: {
          type: 'string',
          description: 'TwiML instructions for the call (advanced)',
        },
        url: {
          type: 'string',
          description: 'URL returning TwiML instructions (advanced)',
        },
      },
      required: ['to'],
    },
  },
  {
    name: 'x402_verify_phone',
    description: `Start phone verification by sending a code. Costs ~$0.05/attempt.

Powered by Twilio Verify for secure phone verification:
- Send verification codes via SMS, voice call, or WhatsApp
- Automatic fraud protection
- Global phone number support
- Localized messages

Perfect for:
- User registration verification
- Two-factor authentication
- Account recovery
- Identity verification

Use x402_verify_check to validate the code the user receives.`,
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Phone number to verify in E.164 format (e.g., +14155551234)',
        },
        channel: {
          type: 'string',
          description: 'Delivery channel for the code',
          enum: ['sms', 'call', 'whatsapp'],
        },
        locale: {
          type: 'string',
          description: 'Locale for the verification message (e.g., "en", "es", "fr")',
        },
      },
      required: ['phoneNumber'],
    },
  },
  {
    name: 'x402_verify_check',
    description: `Check a phone verification code. Free if verification started with x402_verify_phone.

Validates the verification code entered by the user:
- Codes expire after 10 minutes
- Maximum 5 check attempts per verification
- Returns verification status

Use this after x402_verify_phone to complete the verification flow.`,
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Phone number that was verified in E.164 format',
        },
        code: {
          type: 'string',
          description: 'Verification code entered by the user (4-10 digits)',
        },
      },
      required: ['phoneNumber', 'code'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleSendSms(client: X402Client, args: unknown): Promise<string> {
  const input = SendSmsInput.parse(args);
  const result = await client.execute<{
    sid: string;
    status: string;
    to: string;
    dateCreated: string;
  }>('twilio', 'send-sms', input);

  const data = result.data;

  return `SMS sent successfully!

Message SID: ${data.sid}
To: ${data.to}
Status: ${data.status}
Sent at: ${data.dateCreated}
Cost: $${result.cost.toFixed(4)}

The message has been queued for delivery.`;
}

export async function handleMakeCall(client: X402Client, args: unknown): Promise<string> {
  const input = MakeCallInput.parse(args);
  const result = await client.execute<{
    sid: string;
    status: string;
    to: string;
    from: string;
    dateCreated: string;
  }>('twilio', 'make-call', input);

  const data = result.data;

  return `Call initiated successfully!

Call SID: ${data.sid}
To: ${data.to}
From: ${data.from}
Status: ${data.status}
Started at: ${data.dateCreated}
Cost: ~$${result.cost.toFixed(4)}/minute

The call is being connected. Final cost depends on call duration.`;
}

export async function handleVerifyPhone(client: X402Client, args: unknown): Promise<string> {
  const input = VerifyPhoneInput.parse(args);
  const result = await client.execute<{
    sid: string;
    status: string;
    to: string;
    channel: string;
    valid: boolean;
  }>('twilio', 'verify-start', input);

  const data = result.data;
  const channelDesc = {
    sms: 'SMS message',
    call: 'voice call',
    whatsapp: 'WhatsApp message',
  }[data.channel] || data.channel;

  return `Verification started!

Verification SID: ${data.sid}
Phone: ${data.to}
Channel: ${channelDesc}
Status: ${data.status}
Cost: $${result.cost.toFixed(4)}

A verification code has been sent via ${channelDesc}.
Use x402_verify_check with the code to complete verification.
The code expires in 10 minutes.`;
}

export async function handleVerifyCheck(client: X402Client, args: unknown): Promise<string> {
  const input = VerifyCheckInput.parse(args);
  const result = await client.execute<{
    sid: string;
    status: string;
    to: string;
    valid: boolean;
  }>('twilio', 'verify-check', input);

  const data = result.data;

  if (data.valid) {
    return `Verification successful!

Phone: ${data.to}
Status: ${data.status}
Valid: Yes

The phone number has been verified successfully.`;
  } else {
    return `Verification failed.

Phone: ${data.to}
Status: ${data.status}
Valid: No

The verification code was incorrect or has expired.
Use x402_verify_phone to request a new code.`;
  }
}

// =============================================================================
// Handler Map
// =============================================================================

export const communicationHandlers: Record<string, (client: X402Client, args: unknown) => Promise<string>> = {
  x402_send_sms: handleSendSms,
  x402_make_call: handleMakeCall,
  x402_verify_phone: handleVerifyPhone,
  x402_verify_check: handleVerifyCheck,
};
