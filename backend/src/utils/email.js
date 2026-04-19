import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

let transporter = null;

const initEmailService = () => {
  if (!config.email.enabled) {
    return;
  }

  transporter = nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: false,
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.password,
    },
  });
};

/**
 * Send Booking Confirmation Email
 */
export const sendBookingConfirmationEmail = async (booking) => {
  if (!config.email.enabled || !transporter) {
    console.log('[EMAIL SERVICE] Skipped (disabled):', booking.pnr);
    return;
  }

  try {
    const scheduleInfo = `
      Date: ${booking.schedule.departureTime.toLocaleDateString()}
      From: ${booking.schedule.route.sourceCity}
      To: ${booking.schedule.route.destCity}
      Bus: ${booking.schedule.bus.busNumber}
      Fare: ₹${booking.totalFare}
    `;

    const htmlContent = `
      <h2>Booking Confirmation</h2>
      <p>Dear ${booking.passengerName},</p>
      <p>Your booking has been confirmed!</p>
      <p><strong>Booking Reference (PNR): ${booking.pnr}</strong></p>
      <pre>${scheduleInfo}</pre>
      <p>Please save this email for your records.</p>
      <p>Thank you for booking with us!</p>
    `;

    await transporter.sendMail({
      from: config.email.smtp.fromEmail,
      to: booking.passengerEmail,
      subject: `Booking Confirmation - ${booking.pnr}`,
      html: htmlContent,
    });

    console.log('[EMAIL] Booking confirmation sent:', booking.pnr);
  } catch (error) {
    console.error('[EMAIL ERROR]:', error.message);
    // Don't throw - email failure shouldn't stop booking confirmation
  }
};

/**
 * Send Booking Cancellation Email
 */
export const sendCancellationEmail = async (booking) => {
  if (!config.email.enabled || !transporter) {
    console.log('[EMAIL SERVICE] Skipped (disabled):', booking.pnr);
    return;
  }

  try {
    const htmlContent = `
      <h2>Booking Cancellation</h2>
      <p>Dear ${booking.passengerName},</p>
      <p>Your booking has been cancelled.</p>
      <p><strong>Booking Reference (PNR): ${booking.pnr}</strong></p>
      <p>If you have any questions, please contact our support team.</p>
    `;

    await transporter.sendMail({
      from: config.email.smtp.fromEmail,
      to: booking.passengerEmail,
      subject: `Booking Cancelled - ${booking.pnr}`,
      html: htmlContent,
    });

    console.log('[EMAIL] Cancellation email sent:', booking.pnr);
  } catch (error) {
    console.error('[EMAIL ERROR]:', error.message);
  }
};

// Initialize on module load
initEmailService();
