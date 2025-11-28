import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Crown, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'one_time' | 'subscription';
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, type, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const amount = type === 'one_time' ? 50 : 500;
  const description = type === 'one_time'
    ? '24-hour access to doctor search'
    : '30-day unlimited access to doctor search';

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      toast.error('Please enter a valid Kenyan phone number');
      return;
    }

    setLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      const response = await fetch(`${API_BASE_URL}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          amount,
          phoneNumber: phoneNumber.replace(/\s/g, ''),
          type,
          description
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.data.checkout_url) {
          // Redirect to IntaSend checkout page
          toast.success('Redirecting to secure payment page...');
          window.location.href = data.data.checkout_url;
        } else if (data.data.message) {
          // STK Push initiated
          toast.success(data.data.message);
          onSuccess();
          onClose();
        } else {
          toast.success('Payment initiated successfully!');
          onSuccess();
          onClose();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              {type === 'one_time' ? (
                <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
              ) : (
                <Crown className="w-6 h-6 text-purple-600 mr-3" />
              )}
              <h3 className="text-xl font-bold text-gray-900">
                {type === 'one_time' ? 'One-Time Access' : 'Monthly Subscription'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Amount:</span>
              <span className="text-2xl font-bold text-gray-900">KSh {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Description:</span>
              <span className="text-sm text-gray-800">{description}</span>
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678 or +254712345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the phone number linked to your M-Pesa account
            </p>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
              type === 'one_time'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {type === 'one_time' ? (
                  <CreditCard className="w-5 h-5 mr-2" />
                ) : (
                  <Crown className="w-5 h-5 mr-2" />
                )}
                Pay KSh {amount} with M-Pesa
              </>
            )}
          </button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4">
            By proceeding, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;