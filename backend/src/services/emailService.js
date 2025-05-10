const nodemailer = require('nodemailer');

// Create a transporter using environment variables
// For development, you can use services like Mailtrap or Gmail
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === '465', // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

// Send verification email
exports.sendVerificationEmail = async (user, verificationToken) => {
  try {
    // Verification URL (in production, this would be a frontend URL)
    const verificationUrl = `${process.env.FRONTEND_URL || 'exp://your-expo-app-url'}/verify?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
    
    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AQRO App" <noreply@aqro.app>',
      to: user.email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #00df82;">Welcome to AQRO!</h2>
          <p>Hello ${user.firstName},</p>
          <p>Thank you for registering with AQRO! To complete your registration, please verify your email address.</p>
          <p>Your verification code is: <strong style="font-size: 18px;">${verificationToken}</strong></p>
          <p>This code will expire in 1 hour.</p>
          <p>Alternatively, you can click the button below to verify directly:</p>
          <p>If you didn't register for an AQRO account, please ignore this email.</p>
          <p>Best regards,<br>The AQRO Team</p>
        </div>
      `
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};
exports.sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AQRO App" <noreply@aqro.app>',
      to: user.email,
      subject: 'Reset Your AQRO Password',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #00df82;">Reset Your Password</h2>
          <p>Hello ${user.firstName},</p>
          <p>You recently requested to reset your password for your AQRO account. Use the code below to reset your password:</p>
          <p>Your password reset code is: <strong style="font-size: 18px;">${resetToken}</strong></p>
          <p>This code will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Best regards,<br>The AQRO Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};
// Send a confirmation email after successful verification
exports.sendConfirmationEmail = async (user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AQRO App" <noreply@aqro.app>',
      to: user.email,
      subject: 'Your Email Has Been Verified!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #00df82;">Email Verified Successfully!</h2>
          <p>Hello ${user.firstName},</p>
          <p>Your email address has been successfully verified. You can now enjoy all the features of the AQRO app.</p>
          <p>Thank you for choosing AQRO!</p>
          <p>Best regards,<br>The AQRO Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw new Error('Failed to send confirmation email');
  }
};

// Send approval notification to staff
exports.sendApprovalNotification = async (user) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AQRO App" <noreply@aqro.app>',
      to: user.email,
      subject: 'Your AQRO Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #00df82;">Account Approved!</h2>
          <p>Hello ${user.firstName},</p>
          <p>Congratulations! Your AQRO account has been approved and is now active.</p>
          <p>You can now log in to the app and start using all the features available to staff members.</p>
          <p>Thank you for joining AQRO!</p>
          <p>Best regards,<br>The AQRO Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval notification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending approval notification email:', error);
    throw new Error('Failed to send approval notification email');
  }
};

// Send rejection email to staff
exports.sendRejectionEmail = async (user, reason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"AQRO App" <noreply@aqro.app>',
      to: user.email,
      subject: 'Update on Your AQRO Account Application',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #00df82;">Account Application Status</h2>
          <p>Hello ${user.firstName},</p>
          <p>Thank you for your interest in AQRO. We have reviewed your application and are unable to approve your account at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you have any questions or would like to provide additional information for reconsideration, please contact our support team.</p>
          <p>Best regards,<br>The AQRO Team</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw new Error('Failed to send rejection email');
  }
};