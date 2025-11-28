import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Home, Calendar, MessageSquare, Search, Shield, Stethoscope, Video, Activity, AlertTriangle, ChevronDown, Heart, Pill, Stethoscope as StethoscopeIcon } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../lib/store';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const servicesRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Sign out function
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setAccountOpen(false);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setServicesOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setServicesOpen(false);
    setAccountOpen(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setServicesOpen(false);
    setAccountOpen(false);
  };

  // Professional navigation structure with 5-6 main items
  const mainNavItems = [
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    {
      name: 'Services',
      icon: <Heart className="w-4 h-4" />,
      dropdown: [
        { name: 'AI Symptom Checker', path: '/symptom-checker', icon: <Shield className="w-4 h-4" />, description: 'AI-powered diagnosis' },
        { name: 'Video Consultation', path: '/video-consultation', icon: <Video className="w-4 h-4" />, description: 'Virtual doctor visits' },
        { name: 'Health Monitoring', path: '/health-monitoring', icon: <Activity className="w-4 h-4" />, description: 'Track your health' },
        { name: 'Emergency Care', path: '/emergency-care', icon: <AlertTriangle className="w-4 h-4" />, description: '24/7 emergency support' },
      ]
    },
    { name: 'Doctors', path: '/doctors', icon: <StethoscopeIcon className="w-4 h-4" /> },
    {
      name: 'Appointments',
      icon: <Calendar className="w-4 h-4" />,
      dropdown: [
        { name: 'Book Appointment', path: '/appointments', icon: <Calendar className="w-4 h-4" />, description: 'Schedule a visit' },
        { name: 'Physical Appointments', path: '/physical-appointments', icon: <Calendar className="w-4 h-4" />, description: 'In-person visits' },
      ]
    },
    { name: 'Messages', path: '/messages', icon: <MessageSquare className="w-4 h-4" /> },
  ];


  // Account dropdown items
  const accountItems = [
    { name: 'Profile', path: '/profile', icon: <User className="w-4 h-4" /> },
    { name: 'Prescriptions', path: '/prescriptions', icon: <Pill className="w-4 h-4" /> },
    ...(user?.role === 'admin' ? [{ name: 'Admin Panel', path: '/admin', icon: <Shield className="w-4 h-4" /> }] : []),
    ...(user?.role === 'doctor' ? [{ name: 'My Availability', path: '/doctor-availability', icon: <Shield className="w-4 h-4" /> }] : []),
  ];

  // Add Account dropdown for authenticated users
  const navItemsWithAccount = isAuthenticated
    ? [
        ...mainNavItems,
        {
          name: 'Account',
          icon: <User className="w-4 h-4" />,
          dropdown: accountItems
        }
      ]
    : mainNavItems;

  const navVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const linkVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  return (
    <motion.nav
      className={`fixed w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-200/50'
          : 'bg-white shadow-lg'
      }`}
      variants={navVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <motion.div
                variants={logoVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2"
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatDelay: 5
                  }}
                  className="p-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"
                >
                  <Stethoscope className="w-5 h-5 text-white" />
                </motion.div>
                <span className="text-xl font-bold bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-transparent bg-clip-text">
                  HK
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
            {navItemsWithAccount.map((item, index) => (
              <motion.div
                key={item.name}
                custom={index}
                variants={linkVariants}
                initial="hidden"
                animate="visible"
                className="relative"
                ref={item.name === 'Services' ? servicesRef : item.name === 'Account' ? accountRef : null}
              >
                {item.dropdown ? (
                  <div>
                    <button
                      onClick={() => {
                        setServicesOpen(item.name === 'Services' ? !servicesOpen : false);
                        setAccountOpen(item.name === 'Account' ? !accountOpen : false);
                      }}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        scrolled
                          ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        (item.name === 'Services' && servicesOpen) || (item.name === 'Account' && accountOpen)
                          ? 'rotate-180' : ''
                      }`} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {((item.name === 'Services' && servicesOpen) || (item.name === 'Account' && accountOpen)) && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                        >
                          {item.dropdown.map((dropdownItem, dropdownIndex) => (
                            <Link
                              key={dropdownItem.path}
                              to={dropdownItem.path}
                              onClick={() => {
                                setServicesOpen(false);
                                setAccountOpen(false);
                              }}
                              className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150 group"
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {dropdownItem.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                                  {dropdownItem.name}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'text-blue-600 bg-blue-50'
                        : scrolled
                          ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                          : 'text-gray-800 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )}
              </motion.div>
            ))}

            {/* Account Section */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-gray-200">
                <NotificationCenter />
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => {
                      setAccountOpen(!accountOpen);
                      setServicesOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span>Account</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                            </div>
                          </div>
                        </div>

                        {accountItems.map((accountItem) => (
                          <Link
                            key={accountItem.path}
                            to={accountItem.path}
                            onClick={() => setAccountOpen(false)}
                            className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                          >
                            {accountItem.icon}
                            <span className="text-sm font-medium text-gray-700">{accountItem.name}</span>
                          </Link>
                        ))}

                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-red-50 transition-colors duration-150 group"
                          >
                            <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                            <span className="text-sm font-medium text-gray-700 group-hover:text-red-600">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white border-t border-gray-200 shadow-lg"
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Items */}
              {mainNavItems.map((item) => (
                <div key={item.name}>
                  {item.dropdown ? (
                    <div>
                      <button
                        onClick={() => {
                          if (item.name === 'Services') {
                            setServicesOpen(!servicesOpen);
                          } else if (item.name === 'Account') {
                            setAccountOpen(!accountOpen);
                          }
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 text-left text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                          (item.name === 'Services' && servicesOpen) || (item.name === 'Account' && accountOpen)
                            ? 'rotate-180' : ''
                        }`} />
                      </button>

                      <AnimatePresence>
                        {((item.name === 'Services' && servicesOpen) || (item.name === 'Account' && accountOpen)) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-8 mt-2 space-y-2"
                          >
                            {item.dropdown.map((dropdownItem) => (
                              <Link
                                key={dropdownItem.path}
                                to={dropdownItem.path}
                                onClick={closeMenu}
                                className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              >
                                {dropdownItem.icon}
                                <span className="text-sm">{dropdownItem.name}</span>
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={closeMenu}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        location.pathname === item.path
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile Account Section */}
              {isAuthenticated ? (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user?.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{user?.role}</div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {accountItems.map((accountItem) => (
                      <Link
                        key={accountItem.path}
                        to={accountItem.path}
                        onClick={closeMenu}
                        className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        {accountItem.icon}
                        <span>{accountItem.name}</span>
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-3 py-2 w-full text-left text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="block w-full px-4 py-3 text-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMenu}
                    className="block w-full px-4 py-3 text-center text-white bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90 rounded-lg transition-all duration-200 font-medium"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;