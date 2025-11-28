import { Router, Request, Response } from 'express';
import { UserModel, SubscriptionModel, PaymentModel } from '../models';
import axios from 'axios';

const router = Router();

// Get subscription status for user
router.get('/subscription-status', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    // Get active subscription
    const subscription = await SubscriptionModel.findOne({
      user: req.user._id,
      status: 'active',
      $or: [
        { type: 'monthly' },
        { type: 'one_time', expiresAt: { $gt: new Date() } }
      ]
    }).sort({ createdAt: -1 });

    // Get feature access counts
    const doctorSearchUsage = await PaymentModel.countDocuments({
      user: req.user._id,
      feature: 'doctor_search',
      status: 'completed',
      createdAt: {
        $gte: subscription?.type === 'one_time' ? subscription.createdAt : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    });

    const features = {
      doctorSearch: {
        hasAccess: subscription ? true : false,
        accessCount: doctorSearchUsage,
        limit: subscription?.type === 'monthly' ? -1 : 10 // -1 means unlimited
      }
    };

    res.json({
      data: {
        subscription,
        features
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: { message: 'Failed to get subscription status' } });
  }
});

// Initiate payment
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { amount, phoneNumber, type, description } = req.body;

    if (!amount || !phoneNumber || !type) {
      return res.status(400).json({ error: { message: 'Amount, phone number, and type are required' } });
    }

    // Validate amount
    const validAmounts = [50, 500]; // KSh 50 for one-time, KSh 500 for monthly
    if (!validAmounts.includes(amount)) {
      return res.status(400).json({ error: { message: 'Invalid amount' } });
    }

    // Validate type
    if (!['one_time', 'subscription'].includes(type)) {
      return res.status(400).json({ error: { message: 'Invalid payment type' } });
    }

    // Check if user already has active subscription
    if (type === 'subscription') {
      const existingSubscription = await SubscriptionModel.findOne({
        user: req.user._id,
        status: 'active',
        type: 'monthly'
      });

      if (existingSubscription) {
        return res.status(400).json({ error: { message: 'You already have an active subscription' } });
      }
    }

    // IntaSend API configuration
    const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY || 'ISPubKey_live_61ca6402-3b45-433f-8362-3aad0f9e7186';
    const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY || 'ISSecretKey_live_a1c59374-2903-4af1-8966-99ee43d314ea';
    const INTASEND_BASE_URL = 'https://api.intasend.com/api/v1';

    // Create payment record first
    const payment = await PaymentModel.create({
      user: req.user._id,
      amount,
      phoneNumber,
      type,
      feature: 'doctor_search',
      status: 'pending',
      description: description || `${type === 'one_time' ? 'One-time' : 'Monthly'} access to doctor search`
    });

    // Check if we're in development mode and use mock payment
    if (process.env.NODE_ENV === 'development' || !process.env.INTASEND_SECRET_KEY || process.env.INTASEND_SECRET_KEY.includes('live_')) {
      console.log('Using mock payment system for development');

      // Simulate payment processing delay
      setTimeout(async () => {
        try {
          // Mark payment as completed for development
          await PaymentModel.findByIdAndUpdate(payment._id, {
            status: 'completed',
            transactionId: `mock_${payment._id}`,
            completedAt: new Date()
          });

          // Create subscription
          if (type === 'subscription') {
            await SubscriptionModel.create({
              user: req.user._id,
              type: 'monthly',
              status: 'active',
              amount: amount,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              payment: payment._id
            });
          } else {
            await SubscriptionModel.create({
              user: req.user._id,
              type: 'one_time',
              status: 'active',
              amount: amount,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
              payment: payment._id
            });
          }

          console.log('Mock payment completed and subscription created for user:', req.user._id);
        } catch (error) {
          console.error('Mock payment processing error:', error);
        }
      }, 2000); // 2 second delay to simulate processing

      return res.json({
        data: {
          paymentId: payment._id,
          message: 'Mock payment initiated! Payment will be processed in development mode.',
          status: 'pending',
          isMock: true
        }
      });
    }

    try {
      // Create IntaSend checkout session
      const checkoutResponse = await axios.post(`${INTASEND_BASE_URL}/checkout/`, {
        public_key: INTASEND_PUBLISHABLE_KEY,
        amount: amount,
        currency: 'KES',
        phone_number: phoneNumber.replace(/\s/g, ''),
        email: req.user.email,
        api_ref: `payment_${payment._id}`,
        comment: description,
        method: 'M-PESA',
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success`,
        webhook_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payments/webhook`,
        customer: {
          first_name: req.user.name.split(' ')[0],
          last_name: req.user.name.split(' ').slice(1).join(' ') || '',
          email: req.user.email,
          phone_number: phoneNumber.replace(/\s/g, '')
        }
      }, {
        headers: {
          'Authorization': `Bearer ${INTASEND_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (checkoutResponse.data && checkoutResponse.data.url) {
        // Update payment with IntaSend reference
        await PaymentModel.findByIdAndUpdate(payment._id, {
          transactionId: checkoutResponse.data.id
        });

        res.json({
          data: {
            paymentId: payment._id,
            checkout_url: checkoutResponse.data.url,
            message: 'Payment initiated successfully. Redirecting to payment page...',
            status: 'pending'
          }
        });
      } else {
        // Fallback to STK push
        const stkResponse = await axios.post(`${INTASEND_BASE_URL}/send-money/initiate/`, {
          amount: amount,
          phone_number: phoneNumber.replace(/\s/g, ''),
          currency: 'KES',
          api_ref: `payment_${payment._id}`,
          wallet_id: 1 // Default M-Pesa wallet
        }, {
          headers: {
            'Authorization': `Bearer ${INTASEND_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (stkResponse.data && stkResponse.data.invoice) {
          await PaymentModel.findByIdAndUpdate(payment._id, {
            transactionId: stkResponse.data.invoice.id
          });

          res.json({
            data: {
              paymentId: payment._id,
              message: 'Payment initiated! Please check your phone for the M-Pesa prompt.',
              status: 'pending'
            }
          });
        } else {
          throw new Error('Failed to initiate payment');
        }
      }

    } catch (intasendError: any) {
      console.error('IntaSend API error:', intasendError.response?.data || intasendError.message);

      // Mark payment as failed
      await PaymentModel.findByIdAndUpdate(payment._id, { status: 'failed' });

      res.status(500).json({
        error: {
          message: 'Payment service temporarily unavailable. Please try again later.'
        }
      });
    }

  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: { message: 'Failed to initiate payment' } });
  }
});

// Track usage for one-time payments
router.post('/track-usage', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { feature } = req.body;

    if (!feature) {
      return res.status(400).json({ error: { message: 'Feature is required' } });
    }

    // Check if user has one-time access
    const subscription = await SubscriptionModel.findOne({
      user: req.user._id,
      type: 'one_time',
      status: 'active',
      expiresAt: { $gt: new Date() }
    });

    if (!subscription) {
      return res.status(403).json({ error: { message: 'No active subscription found' } });
    }

    // For one-time payments, we don't actually track usage in database
    // The limit is enforced on the frontend
    res.json({ data: { success: true } });

  } catch (error) {
    console.error('Track usage error:', error);
    res.status(500).json({ error: { message: 'Failed to track usage' } });
  }
});

// Webhook for payment verification (IntaSend/M-Pesa)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;

    console.log('IntaSend webhook received:', webhookData);

    // Handle different webhook formats from IntaSend
    let paymentId, status, transactionId;

    if (webhookData.invoice) {
      // STK Push webhook format
      paymentId = webhookData.invoice.api_ref?.replace('payment_', '');
      status = webhookData.invoice.state === 'COMPLETE' ? 'completed' : 'failed';
      transactionId = webhookData.invoice.id;
    } else if (webhookData.checkout) {
      // Checkout webhook format
      paymentId = webhookData.checkout.api_ref?.replace('payment_', '');
      status = webhookData.checkout.state === 'COMPLETE' ? 'completed' : 'failed';
      transactionId = webhookData.checkout.id;
    } else {
      // Generic webhook format
      paymentId = webhookData.api_ref?.replace('payment_', '') || webhookData.payment_id;
      status = webhookData.state === 'COMPLETE' || webhookData.status === 'completed' ? 'completed' : 'failed';
      transactionId = webhookData.id || webhookData.transaction_id;
    }

    if (!paymentId) {
      console.error('No payment ID found in webhook');
      return res.status(400).json({ error: { message: 'Invalid webhook data' } });
    }

    // Find and update payment
    const payment = await PaymentModel.findById(paymentId);

    if (!payment) {
      console.error('Payment not found:', paymentId);
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }

    if (status === 'completed' && payment.status !== 'completed') {
      // Update payment status
      await PaymentModel.findByIdAndUpdate(paymentId, {
        status: 'completed',
        transactionId,
        completedAt: new Date()
      });

      // Create subscription
      if (payment.type === 'subscription') {
        await SubscriptionModel.create({
          user: payment.user,
          type: 'monthly',
          status: 'active',
          amount: payment.amount,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          payment: payment._id
        });
      } else {
        await SubscriptionModel.create({
          user: payment.user,
          type: 'one_time',
          status: 'active',
          amount: payment.amount,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          payment: payment._id
        });
      }

      console.log('Payment completed and subscription created for user:', payment.user);
    } else if (status === 'failed') {
      await PaymentModel.findByIdAndUpdate(paymentId, {
        status: 'failed',
        transactionId
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: { message: 'Webhook processing failed' } });
  }
});

// Get payment history
router.get('/history', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const payments = await PaymentModel.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ data: payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: { message: 'Failed to get payment history' } });
  }
});

export default router;