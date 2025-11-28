import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, ArrowUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Footer: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const socialVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.8
      }
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute bottom-10 right-10 w-28 h-28 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-1500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -40, -20],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Company Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Link to="/" className="flex items-center group">
              <motion.div
                className="flex items-center space-x-2"
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
                >
                  <Sparkles className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
                  HealthKonnect
                </span>
              </motion.div>
            </Link>
            <motion.p
              className="text-gray-300 leading-relaxed"
              variants={itemVariants}
            >
              Revolutionizing healthcare through innovative telemedicine solutions.
              Connecting patients with healthcare professionals worldwide.
            </motion.p>
            <motion.div
              className="flex space-x-4"
              variants={socialVariants}
            >
              {[
                { icon: Facebook, color: 'hover:text-blue-400', href: '#facebook' },
                { icon: Twitter, color: 'hover:text-sky-400', href: '#twitter' },
                { icon: Instagram, color: 'hover:text-pink-400', href: '#instagram' },
                { icon: Linkedin, color: 'hover:text-blue-500', href: '#linkedin' }
              ].map((social, index) => (
                <motion.a
                  key={social.href}
                  href={social.href}
                  className={`text-gray-400 transition-all duration-300 ${social.color} p-2 rounded-full bg-white/5 hover:bg-white/10`}
                  whileHover={{
                    scale: 1.2,
                    rotate: 5,
                    boxShadow: "0 0 20px rgba(255,255,255,0.3)"
                  }}
                  whileTap={{ scale: 0.9 }}
                  custom={index}
                  variants={socialVariants}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <motion.h3
              className="text-lg font-semibold text-white"
              variants={itemVariants}
            >
              Quick Links
            </motion.h3>
            <ul className="space-y-3">
              {[
                { name: 'Home', path: '/' },
                { name: 'Find Doctors', path: '/doctors' },
                { name: 'Appointments', path: '/appointments' },
                { name: 'Messages', path: '/messages' },
                { name: 'Prescriptions', path: '/prescriptions' }
              ].map((link, index) => (
                <motion.li
                  key={link.path}
                  variants={itemVariants}
                  custom={index}
                >
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white transition-all duration-300 relative group"
                  >
                    <span className="relative z-10">{link.name}</span>
                    <motion.div
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover:w-full transition-all duration-300"
                      whileHover={{ width: "100%" }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div variants={itemVariants} className="space-y-4">
            <motion.h3
              className="text-lg font-semibold text-white"
              variants={itemVariants}
            >
              Services
            </motion.h3>
            <ul className="space-y-3">
              {[
                { name: 'Telemedicine', path: '/telemedicine' },
                { name: 'Doctor Consultations', path: '/consultations' },
                { name: 'Health Monitoring', path: '/monitoring' },
                { name: 'Prescription Management', path: '/prescriptions' },
                { name: 'Emergency Care', path: '/emergency' }
              ].map((service, index) => (
                <motion.li
                  key={service.path}
                  variants={itemVariants}
                  custom={index}
                >
                  <Link
                    to={service.path}
                    className="text-gray-300 hover:text-white transition-all duration-300 relative group"
                  >
                    <span className="relative z-10">{service.name}</span>
                    <motion.div
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 group-hover:w-full transition-all duration-300"
                      whileHover={{ width: "100%" }}
                    />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants} className="space-y-4">
            <motion.h3
              className="text-lg font-semibold text-white"
              variants={itemVariants}
            >
              Contact Us
            </motion.h3>
            <div className="space-y-4">
              <motion.div
                className="flex items-start space-x-3"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="p-2 bg-blue-500/20 rounded-lg"
                >
                  <MapPin className="h-5 w-5 text-blue-400" />
                </motion.div>
                <div className="text-gray-300">
                  <p className="font-medium">HealthKonnect HQ</p>
                  <p className="text-sm">Catherine Ndereba Road</p>
                  <p className="text-sm">Edeka Plaza, Nairobi</p>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center space-x-3"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="p-2 bg-green-500/20 rounded-lg"
                >
                  <Phone className="h-5 w-5 text-green-400" />
                </motion.div>
                <span className="text-gray-300">+254 746 852 868</span>
              </motion.div>

              <motion.div
                className="flex items-center space-x-3"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="p-2 bg-purple-500/20 rounded-lg"
                >
                  <Mail className="h-5 w-5 text-purple-400" />
                </motion.div>
                <span className="text-gray-300">somtechhub@gmail.com</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          className="mt-12 pt-8 border-t border-gray-700"
          variants={itemVariants}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <motion.p
              className="text-gray-400 text-sm"
              variants={itemVariants}
            >
              &copy; {new Date().getFullYear()} HealthKonnect. All rights reserved.
            </motion.p>

            <motion.div
              className="flex items-center space-x-6"
              variants={itemVariants}
            >
              {[
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Terms of Service', path: '/terms' },
                { name: 'Cookie Policy', path: '/cookies' }
              ].map((link, index) => (
                <motion.div
                  key={link.path}
                  variants={itemVariants}
                  custom={index}
                >
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-white text-sm transition-colors duration-300 relative group"
                  >
                    <span className="relative z-10">{link.name}</span>
                    <motion.div
                      className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover:w-full transition-all duration-300"
                      whileHover={{ width: "100%" }}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Made with Love */}
          <motion.div
            className="mt-8 text-center"
            variants={itemVariants}
          >
            <motion.div
              className="inline-flex items-center space-x-2 text-gray-400 text-sm"
              whileHover={{ scale: 1.05 }}
            >
              <span>Made with</span>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
              >
                <Heart className="h-4 w-4 text-red-500" />
              </motion.div>
              <span>for better healthcare</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg text-white z-50"
        whileHover={{
          scale: 1.1,
          boxShadow: "0 0 25px rgba(59, 130, 246, 0.5)"
        }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </footer>
  );
};

export default Footer;