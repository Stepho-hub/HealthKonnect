import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Send, Clock } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { getUserMessages, sendMessage, getDoctors, setClerkToken } from '../lib/mongodb';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws').replace('/api', '');
import toast from 'react-hot-toast';

// Define interfaces for type safety
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image_url?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Message {
  id: string;
  content: string;
  is_from_doctor: boolean;
  created_at: string;
}

const Messaging: React.FC = () => {
  // State variables
  // Mock user for demo purposes
  const user = {
    id: 'demo-user-123',
    fullName: 'Demo User',
    firstName: 'Demo',
    lastName: 'User'
  };
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketConnection = io(WS_BASE_URL, {
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    socketConnection.on('receive-message', (message: any) => {
      console.log('Received real-time message:', message);
      // Add the received message to the current conversation
      if (selectedDoctor) {
        const doctorUserId = selectedDoctor.user?._id || selectedDoctor.id;
        if (message.sender._id === doctorUserId || message.receiver._id === doctorUserId) {
          const transformedMessage = {
            id: message._id,
            content: message.content,
            is_from_doctor: message.sender._id === doctorUserId,
            created_at: message.createdAt
          };
          setMessages(prev => [...prev, transformedMessage]);
        }
      }
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Fetch doctors when component mounts
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join room when doctor is selected
  useEffect(() => {
    if (socket && selectedDoctor && user) {
      const roomId = `conversation-${user.id}-${selectedDoctor.user?._id || selectedDoctor.id}`;
      socket.emit('join-room', roomId);
      console.log('Joined room:', roomId);
    }
  }, [socket, selectedDoctor, user]);

  // Fetch available doctors
  const fetchDoctors = async () => {
    // Set demo token for API requests
    setClerkToken('demo-token');

    const { data, error } = await getDoctors();

    if (error) {
      toast.error('Failed to fetch doctors');
      return;
    }

    // Transform MongoDB data to match the expected interface
    const transformedDoctors = (data || []).map((doctor: any) => ({
      id: doctor._id,
      name: doctor.name,
      specialty: doctor.specialization,
      image_url: undefined, // MongoDB doesn't have image_url field
      user: doctor.user // Include user information
    }));

    setDoctors(transformedDoctors);
  };

  // Select a doctor and fetch their messages
  const handleSelectDoctor = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);

    // Fetch messages for this conversation
    const { data, error } = await getUserMessages();

    if (error) {
      toast.error('Failed to fetch messages');
      return;
    }

    // Filter messages for this specific doctor
    const doctorUserId = doctor.user?._id || doctor.id;
    const filteredMessages = (data || []).filter((message: any) =>
      message.sender._id === doctorUserId || message.receiver._id === doctorUserId
    );

    // Transform messages to match expected interface
    const transformedMessages = filteredMessages.map((message: any) => ({
      id: message._id,
      content: message.content,
      is_from_doctor: message.sender._id === doctorUserId, // If sender is the doctor, it's from doctor
      created_at: message.createdAt
    }));

    setMessages(transformedMessages);
  };

  // Refresh messages for current doctor (useful for real-time updates)
  const refreshMessages = async () => {
    if (!selectedDoctor) return;

    try {
      const { data } = await getUserMessages();
      if (data) {
        const doctorUserId = selectedDoctor.user?._id || selectedDoctor.id;
        const filteredMessages = data.filter((message: any) =>
          message.sender._id === doctorUserId || message.receiver._id === doctorUserId
        );

        const transformedMessages = filteredMessages.map((message: any) => ({
          id: message._id,
          content: message.content,
          is_from_doctor: message.sender._id === doctorUserId,
          created_at: message.createdAt
        }));

        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctor || !newMessage.trim() || !user || !socket) return;

    const messageContent = newMessage.trim();

    // Clear input immediately
    setNewMessage('');

    // Create message object
    const messageData = {
      sender: user.id,
      receiver: selectedDoctor.user?._id || selectedDoctor.id,
      content: messageContent,
      createdAt: new Date().toISOString()
    };

    // Optimistically update messages
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      is_from_doctor: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send via Socket.IO for real-time communication
      const roomId = `conversation-${user.id}-${selectedDoctor.user?._id || selectedDoctor.id}`;
      socket.emit('send-message', {
        roomId,
        message: messageData
      });

      // Also send via HTTP API as backup (for persistence)
      setClerkToken('demo-token');
      await sendMessage({
        senderId: user.id,
        receiverId: selectedDoctor.user?._id || selectedDoctor.id,
        content: messageContent
      });

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      // Restore input
      setNewMessage(messageContent);
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg"
      >
        <div className="grid grid-cols-3 h-[700px]">
          {/* Doctors List */}
          <div className="col-span-1 border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Doctors</h3>
            </div>
            {doctors.map(doctor => (
              <div 
                key={doctor.id}
                onClick={() => handleSelectDoctor(doctor)}
                className={`p-4 flex items-center cursor-pointer hover:bg-gray-50 ${
                  selectedDoctor?.id === doctor.id ? 'bg-gray-100' : ''
                }`}
              >
                {doctor.image_url ? (
                  <img 
                    src={doctor.image_url} 
                    alt={doctor.name} 
                    className="h-12 w-12 rounded-full object-cover mr-4"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                  <p className="text-sm text-gray-500">{doctor.specialty}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Messages Area */}
          <div className="col-span-2 flex flex-col">
            {selectedDoctor ? (
              <>
                {/* Doctor Header */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <div className="flex items-center">
                    {selectedDoctor.image_url ? (
                      <img 
                        src={selectedDoctor.image_url} 
                        alt={selectedDoctor.name} 
                        className="h-12 w-12 rounded-full object-cover mr-4"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 flex items-center justify-center mr-4">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">{selectedDoctor.name}</h4>
                      <p className="text-sm text-gray-500">{selectedDoctor.specialty}</p>
                    </div>
                  </div>
                </div>
                
                {/* Messages List */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">Start a conversation</h4>
                      <p className="text-gray-500 mt-1">
                        Send a message to Dr. {selectedDoctor.name} to get medical advice
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.is_from_doctor ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.is_from_doctor
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white'
                            }`}
                          >
                            <p>{message.content}</p>
                            <div
                              className={`text-xs mt-1 flex items-center ${
                                message.is_from_doctor ? 'text-gray-500' : 'text-white/80'
                              }`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {formatMessageTime(message.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-900">No conversation selected</h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  Select a doctor from the list to start a conversation and get medical advice
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Messaging;