import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signIn } from '../lib/mongodb';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Stethoscope } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        toast.error(result.error.message);
      } else {
        login(result.data.user, result.data.session.access_token);
        toast.success('Login successful!');
        navigate('/');
      }
    } catch (error) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-24">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      {/* Side Animations - Left Side */}
      <motion.div
        className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-blue-400/20 to-transparent pointer-events-none"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <motion.div
          className="absolute top-1/4 left-4 w-16 h-16 bg-blue-500/30 rounded-full"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-8 w-12 h-12 bg-purple-500/25 rounded-full"
          animate={{
            y: [0, 15, 0],
            x: [0, 10, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-6 w-20 h-20 bg-indigo-500/20 rounded-full"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>

      {/* Side Animations - Right Side */}
      <motion.div
        className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-purple-400/20 to-transparent pointer-events-none"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
      >
        <motion.div
          className="absolute top-1/3 right-4 w-18 h-18 bg-purple-500/30 rounded-full"
          animate={{
            y: [0, 25, 0],
            scale: [1, 1.4, 1],
            rotate: [0, -180, -360]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-2/3 right-6 w-14 h-14 bg-blue-500/25 rounded-full"
          animate={{
            y: [0, -18, 0],
            x: [0, -8, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-8 w-16 h-16 bg-pink-500/20 rounded-full"
          animate={{
            rotate: [0, -360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </motion.div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-float-delayed"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-float"></div>

      <motion.div
        className="max-w-md w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.div
            className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0.7)",
                "0 0 0 10px rgba(59, 130, 246, 0)",
                "0 0 0 0 rgba(59, 130, 246, 0)"
              ]
            }}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Stethoscope className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>
          <motion.h2
            className="text-4xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p
            className="text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Sign in to access your HealthKonnect account
          </motion.p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 relative z-10"
          variants={itemVariants}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.3 }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
                animate={{ color: email ? '#3b82f6' : '#374151' }}
                transition={{ duration: 0.3 }}
              >
                Email Address
              </motion.label>
              <div className="relative">
                <motion.div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  animate={{ x: email ? 2 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Mail className="h-5 w-5 text-gray-400" />
                </motion.div>
                <motion.input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  whileFocus={{ scale: 1.01 }}
                  animate={{
                    borderColor: email ? '#3b82f6' : '#d1d5db'
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
                animate={{ color: password ? '#3b82f6' : '#374151' }}
                transition={{ duration: 0.3 }}
              >
                Password
              </motion.label>
              <div className="relative">
                <motion.div
                  className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                  animate={{ x: password ? 2 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Lock className="h-5 w-5 text-gray-400" />
                </motion.div>
                <motion.input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  whileFocus={{ scale: 1.01 }}
                  animate={{
                    borderColor: password ? '#3b82f6' : '#d1d5db'
                  }}
                  transition={{ duration: 0.3 }}
                />
                <motion.button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <motion.div
                    className="flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </motion.div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div className="mt-6" variants={itemVariants}>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/signup"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Create New Account
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;