import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Search, MessageCircle, User, ArrowLeft, Plus, X, Users as UsersIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { getUserMessages, sendMessage, getDoctors } from '../lib/mongodb';
import { useAuthStore } from '../lib/store';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws').replace('/api', '');

// Define interfaces for type safety
interface Conversation {
  id: string;
  participant: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  receiver: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

const Messaging: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to access messaging');
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
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

      // Update conversations list
      updateConversations();

      // Add to current conversation if it's the active one
      if (selectedConversation) {
        const isFromCurrentConversation =
          message.sender._id === selectedConversation.participant._id ||
          message.receiver._id === selectedConversation.participant._id;

        if (isFromCurrentConversation) {
          const transformedMessage: Message = {
            id: message._id,
            content: message.content,
            sender: message.sender,
            receiver: message.receiver,
            createdAt: message.createdAt
          };
          setMessages(prev => [...prev, transformedMessage]);
        }
      }
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [selectedConversation]);

  // Fetch conversations when component mounts
  useEffect(() => {
    if (user && isAuthenticated) {
      updateConversations();
      fetchAvailableContacts();
    }
  }, [user, isAuthenticated]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join room when conversation is selected
  useEffect(() => {
    if (socket && selectedConversation && user && isAuthenticated) {
      const roomId = `conversation-${user.id}-${selectedConversation.participant._id}`;
      socket.emit('join-room', roomId);
      console.log('Joined room:', roomId);
    }
  }, [socket, selectedConversation, user, isAuthenticated]);

  // Update conversations list
  const updateConversations = async () => {
    if (!user) return;

    try {
      const { data: messagesData, error } = await getUserMessages();

      if (error) {
        console.error('Failed to fetch messages:', error);
        return;
      }

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();

      (messagesData || []).forEach((message: any) => {
        const otherParticipant = message.sender._id === user.id ? message.receiver : message.sender;

        if (!conversationMap.has(otherParticipant._id)) {
          conversationMap.set(otherParticipant._id, {
            id: otherParticipant._id,
            participant: otherParticipant,
            lastMessage: {
              content: message.content,
              createdAt: message.createdAt,
              sender: message.sender._id
            },
            unreadCount: message.sender._id !== user.id ? 1 : 0,
            updatedAt: message.createdAt
          });
        } else {
          const conversation = conversationMap.get(otherParticipant._id)!;
          // Update last message if this is newer
          if (new Date(message.createdAt) > new Date(conversation.updatedAt)) {
            conversation.lastMessage = {
              content: message.content,
              createdAt: message.createdAt,
              sender: message.sender._id
            };
            conversation.updatedAt = message.createdAt;
          }
          // Increment unread count for messages from others
          if (message.sender._id !== user.id) {
            conversation.unreadCount++;
          }
        }
      });

      const conversationsList = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setConversations(conversationsList);
    } catch (error) {
      console.error('Error updating conversations:', error);
    }
  };

  // Fetch available contacts (doctors and other users)
  const fetchAvailableContacts = async () => {
    try {
      const { data: doctorsData, error } = await getDoctors();

      if (error) {
        console.error('Failed to fetch doctors:', error);
        return;
      }

      // Transform doctors data to match contact format
      const contacts = (doctorsData || []).map((doctor: any) => ({
        _id: doctor.user._id || doctor._id,
        name: doctor.name,
        email: doctor.user.email,
        role: 'doctor',
        specialization: doctor.specialization,
        hospital: doctor.hospital
      }));

      setAvailableContacts(contacts);
    } catch (error) {
      console.error('Error fetching available contacts:', error);
    }
  };

  // Select a conversation
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    try {
      const { data: messagesData, error } = await getUserMessages();

      if (error) {
        toast.error('Failed to fetch messages');
        return;
      }

      // Filter messages for this conversation
      const conversationMessages = (messagesData || []).filter((message: any) =>
        (message.sender._id === user!.id && message.receiver._id === conversation.participant._id) ||
        (message.sender._id === conversation.participant._id && message.receiver._id === user!.id)
      );

      // Transform messages
      const transformedMessages: Message[] = conversationMessages.map((message: any) => ({
        id: message._id,
        content: message.content,
        sender: message.sender,
        receiver: message.receiver,
        createdAt: message.createdAt
      }));

      // Sort by timestamp
      transformedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      setMessages(transformedMessages);

      // Mark as read (reset unread count)
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error('Error selecting conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedConversation || !newMessage.trim() || !user || !socket || !isAuthenticated) {
      toast.error('Please select a conversation and enter a message');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Create message object
    const messageData = {
      sender: {
        _id: user.id,
        name: user.name,
        role: user.role
      },
      receiver: {
        _id: selectedConversation.participant._id,
        name: selectedConversation.participant.name,
        role: selectedConversation.participant.role
      },
      content: messageContent,
      createdAt: new Date().toISOString()
    };

    // Optimistically update messages
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender: messageData.sender,
      receiver: messageData.receiver,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Send via Socket.IO for real-time communication
      const roomId = `conversation-${user.id}-${selectedConversation.participant._id}`;
      socket.emit('send-message', {
        roomId,
        message: messageData
      });

      // Also send via HTTP API as backup
      await sendMessage({
        senderId: user.id,
        receiverId: selectedConversation.participant._id,
        content: messageContent
      });

      // Update conversations
      updateConversations();

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(messageContent);
    }
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Format conversation timestamp
  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation =>
    conversation.participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.participant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter available contacts based on search
  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    (contact.specialization && contact.specialization.toLowerCase().includes(contactSearchTerm.toLowerCase()))
  );

  // Start a new conversation
  const startNewConversation = async (contact: any) => {
    // Check if conversation already exists
    const existingConversation = conversations.find(conv => conv.participant._id === contact._id);

    if (existingConversation) {
      // Select existing conversation
      handleSelectConversation(existingConversation);
    } else {
      // Create new conversation
      const newConversation: Conversation = {
        id: contact._id,
        participant: {
          _id: contact._id,
          name: contact.name,
          email: contact.email,
          role: contact.role
        },
        lastMessage: undefined,
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      };

      setSelectedConversation(newConversation);
      setMessages([]);
    }

    setShowNewMessage(false);
    setContactSearchTerm('');
  };

  return (
    <section className="min-h-screen bg-gray-50 pt-24 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Conversations Sidebar */}
          <div className="col-span-1 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                  Messages
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowNewMessage(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">New Message</span>
                  </button>
                  {isConnected && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected"></div>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No conversations yet</h3>
                  <p className="text-gray-500 text-sm">
                    Start a conversation to get medical advice
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors relative ${selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                        }`}
                    >
                      {/* Unread indicator */}
                      {conversation.unreadCount > 0 && (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </div>
                      )}

                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>

                        {/* Conversation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {conversation.participant.name}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatConversationTime(conversation.updatedAt)}
                            </span>
                          </div>

                          {conversation.lastMessage && (
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600 truncate max-w-[180px]">
                                {conversation.lastMessage.sender === user?.id ? 'You: ' : ''}
                                {conversation.lastMessage.content}
                              </p>
                              {conversation.participant.role === 'doctor' && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                                  Doctor
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-1 md:col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.participant.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {selectedConversation.participant.role}
                    </p>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 text-blue-500" />
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        Start a conversation
                      </h4>
                      <p className="text-gray-500 text-center max-w-sm">
                        Send a message to {selectedConversation.participant.name} to begin your conversation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isCurrentUser = message.sender._id === user?.id;
                        const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                          >
                            <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%]`}>
                              {showAvatar && (
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              )}
                              {!showAvatar && <div className="w-8"></div>}

                              <div className={`rounded-2xl px-4 py-2 max-w-full break-words ${isCurrentUser
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                  : 'bg-white border border-gray-200 text-gray-800'
                                }`}>
                                <p className="text-sm">{message.content}</p>
                                <div className={`text-xs mt-1 flex items-center ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatMessageTime(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <form onSubmit={handleSendMessage} className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedConversation.participant.name}...`}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center bg-gray-50">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                  <MessageCircle className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-500 max-w-md">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-blue-600" />
                  Start New Conversation
                </h3>
                <button
                  onClick={() => {
                    setShowNewMessage(false);
                    setContactSearchTerm('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                Choose a doctor to start messaging
              </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={contactSearchTerm}
                  onChange={(e) => setContactSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto max-h-96">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <UsersIcon className="w-12 h-12 text-gray-300 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h4>
                  <p className="text-gray-500 text-center text-sm">
                    {contactSearchTerm ? 'Try a different search term' : 'No doctors are currently available'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => startNewConversation(contact)}
                      className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>

                        {/* Contact Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {contact.name}
                            </h4>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                              Doctor
                            </span>
                          </div>

                          <div className="text-sm text-gray-600 space-y-1">
                            {contact.specialization && (
                              <div className="flex items-center">
                                <span className="font-medium">🏥</span>
                                <span className="ml-1 truncate">{contact.specialization}</span>
                              </div>
                            )}
                            {contact.hospital && (
                              <div className="flex items-center">
                                <span className="font-medium">🏢</span>
                                <span className="ml-1 truncate">{contact.hospital}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Messaging;