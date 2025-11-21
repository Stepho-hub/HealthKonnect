import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, MessageSquare, Users, Phone } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="block text-white">Your Gateway To Better Health</span>
            <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-transparent bg-clip-text mt-2">
              Every citizen Deserves Quality Healthcare
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-300">
            Best healthcare solution — book appointments online, talk to renown doctors,and explore best healthcare services.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              to="/appointments"
              className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:opacity-90 md:py-4 md:text-lg md:px-10 shadow-lg transform transition hover:scale-105"
            >
              Book a Visit
            </Link>
            <Link
              to="/doctors"
              className="px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/10 md:py-4 md:text-lg md:px-10 transform transition hover:scale-105"
            >
              Explore Doctors
            </Link>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            {
              title: "Audio Consultations",
              description: "Connect with doctors through secure audio calls from anywhere.",
              icon: <Phone className="h-8 w-8 text-white" />,
              color: "from-green-600 to-green-400",
            },
            {
              title: "Expert Doctors",
              description: "Access a network of experienced doctors specializing in various fields.",
              icon: <Users className="h-8 w-8 text-white" />,
              color: "from-blue-600 to-blue-400",
            },
            {
              title: "Health Chat",
              description: "Ask health-related questions and get answers from qualified professionals.",
              icon: <MessageSquare className="h-8 w-8 text-white" />,
              color: "from-purple-600 to-purple-400",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-sky from-blue-600 via-blue-500 to-cyan-500 rounded-xl opacity-50 blur-lg group-hover:opacity-100 transition-opacity"></div>
              <div className="relative h-full bg-gray-800 border border-gray-700 rounded-xl p-6 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-sky from-blue-600/10 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex justify-center items-center h-12 w-12 rounded-md bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="mt-4 text-xl font-medium text-white text-center">{feature.title}</h3>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/80 p-6 rounded-xl">
                    <p className="text-gray-200 text-center">{feature.description}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700"
        >
          <dl className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 text-center">
            {[
              { label: "Expert Doctors", value: "50+" },
              { label: "Appointments Booked", value: "1,000+" },
              { label: "Regions Served", value: "5+" },
            ].map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <dt className="text-sm font-medium text-gray-400">{stat.label}</dt>
                <dd className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-transparent bg-clip-text">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;