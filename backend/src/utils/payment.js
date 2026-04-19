import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock Payment Service
 * Simulates payment processing for development
 */

const mockPayments = new Map();

export const processMockPayment = async (bookingId, amount) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Randomly succeed ~95% of the time
  const success = Math.random() > 0.05;

  const paymentResult = {
    transactionId: `MOCK_${uuidv4()}`,
    success,
    amount,
    timestamp: new Date(),
    bookingId,
  };

  mockPayments.set(paymentResult.transactionId, paymentResult);
  
  return paymentResult;
};

/**
 * Verify Mock Payment
 */
export const verifyMockPayment = (transactionId) => {
  const payment = mockPayments.get(transactionId);
  
  if (!payment) {
    throw new Error('Payment not found');
  }

  return payment;
};

/**
 * Main Payment Processor
 */
export const processPayment = async (booking) => {
  if (config.payment.mockMode) {
    return processMockPayment(booking.id, booking.totalFare);
  }

  // Real Stripe/Razorpay integration would go here
  throw new Error('Real payment processing not configured');
};
