'use strict';

const express = require('express');
const { sendMail } = require('../../utils/mailer');
const config = require('../../config');
const logger = require('../../common/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, phone, company, message } = req.body || {};

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
  const trimmedCompany = typeof company === 'string' ? company.trim() : '';
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';

  if (!trimmedName || !trimmedEmail || !trimmedMessage) {
    return res.status(400).json({
      message: 'Please provide your name, email, and a message so we can get back to you.',
    });
  }

  const recipient = config.contact?.toEmail || config.smtp?.fromEmail || 'support@hireassess.com';

  const subject = `New contact enquiry from ${trimmedName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111827;">
      <h2 style="margin-bottom: 12px;">New contact enquiry</h2>
      <p><strong>Name:</strong> ${trimmedName}</p>
      <p><strong>Email:</strong> ${trimmedEmail}</p>
      <p><strong>Phone:</strong> ${trimmedPhone || 'Not provided'}</p>
      <p><strong>Company:</strong> ${trimmedCompany || 'Not provided'}</p>
      <div style="margin-top: 16px; padding: 14px 16px; border-radius: 10px; background: #f8fafc;">
        <p style="margin: 0; white-space: pre-wrap;">${trimmedMessage}</p>
      </div>
    </div>
  `;

  try {
    await sendMail({
      to: recipient,
      replyTo: trimmedEmail,
      subject,
      html,
      text: `${trimmedName} (${trimmedEmail}) sent a new contact message.\n\n${trimmedMessage}`,
    });

    return res.status(200).json({
      message: 'Thanks! Your message has been sent successfully.',
    });
  } catch (error) {
    logger.error(`Contact form delivery failed: ${error.message}`);
    return res.status(500).json({
      message: 'We could not send your message right now. Please try again later.',
    });
  }
});

module.exports = router;
