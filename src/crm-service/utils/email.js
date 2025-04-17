const nodemailer = require('nodemailer');

// Create a mail transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  }
});

/**
 * Send a welcome email to a newly registered customer
 * @param {Object} customer - The customer data
 * @returns {Promise} Promise representing the email sending operation
 */
async function sendWelcomeEmail(customer) {
  try {
    console.log(`Preparing email for customer: ${customer.userId}`);
    console.log(`Using email credentials - User: ${process.env.EMAIL_USER}`);
    
    // Create the email content
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: customer.userId, // The customer's email
      subject: 'Activate your book store account',
      text: `Dear ${customer.name},
Welcome to the Book store created by weiyuans.
Exceptionally this time we won't ask you to click a link to activate your account.`,
      html: `<p>Dear ${customer.name},</p>
<p>Welcome to the Book store created by weiyuans.</p>
<p>Exceptionally this time we won't ask you to click a link to activate your account.</p>`
    };

    console.log(`Sending email to: ${customer.userId}`);
    console.log(`Email subject: ${mailOptions.subject}`);
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${customer.userId}. Message ID: ${info.messageId}`);
    
    // Log more details about the email delivery
    if (info.accepted && info.accepted.length > 0) {
      console.log(`Email was accepted for delivery to: ${info.accepted.join(', ')}`);
    }
    if (info.rejected && info.rejected.length > 0) {
      console.error(`Email was rejected for delivery to: ${info.rejected.join(', ')}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

// Verify connection configuration on startup
async function verifyEmailConnection() {
  try {
    console.log('Verifying email connection...');
    const connection = await transporter.verify();
    console.log('Email server connection verified successfully:', connection);
    return true;
  } catch (error) {
    console.error('Email connection verification failed:', error);
    return false;
  }
}

// Call verification on module load
verifyEmailConnection().catch(console.error);

module.exports = {
  sendWelcomeEmail
}; 