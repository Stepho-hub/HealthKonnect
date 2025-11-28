import React, { useState, useEffect, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, MessageSquare, Settings, Monitor, MonitorOff } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../lib/store';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Error Boundary Component
class VideoConsultationErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('VideoConsultation Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <h2 className="text-xl font-bold mb-4">Video Consultation Error</h2>
            <p className="mb-4">Something went wrong with the video consultation.</p>
            <p className="text-sm text-gray-400 mb-4">
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface VideoConsultationProps {
  appointmentId?: string;
  doctorId?: string;
  patientId?: string;
  isDoctor?: boolean;
}

const VideoConsultation: React.FC<VideoConsultationProps> = ({
  appointmentId,
  doctorId,
  patientId,
  isDoctor = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Generate demo IDs if not provided
  const demoAppointmentId = appointmentId || `demo-${Date.now()}`;
  const demoDoctorId = doctorId || 'demo-doctor';
  const demoPatientId = patientId || user?.id || 'demo-patient';

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{sender: string, message: string, timestamp: Date}>>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<number | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws').replace('/api', '');

  // ICE servers for WebRTC
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        setIsInitializing(true);
        setInitializationError(null);

        // Check if WebRTC is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('WebRTC is not supported in this browser');
        }

        // Check if Socket.IO is available
        if (!io) {
          throw new Error('Real-time communication is not available');
        }

        await initializeSocket();
        setIsInitializing(false);
      } catch (error: any) {
        console.error('Failed to initialize video consultation:', error);
        setInitializationError(error.message || 'Failed to initialize video consultation');
        setIsInitializing(false);
      }
    };

    initializeComponent();

    // Add beforeunload listener to ensure cleanup on page navigation/close
    const handleBeforeUnload = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (isInCall) {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDuration(0);
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [isInCall]);

  const initializeSocket = () => {
    // Prevent multiple socket connections
    if (socket) {
      console.log('Socket already exists, skipping initialization');
      return;
    }

    const socketConnection = io(WS_BASE_URL, {
      transports: ['websocket', 'polling'],
      forceNew: false, // Prevent duplicate connections
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000
    });

    socketConnection.on('connect', () => {
      console.log('Connected to video consultation server');
      setIsConnected(true);
      socketConnection.emit('join-consultation-room', {
        appointmentId: demoAppointmentId,
        userId: user?.id,
        userType: isDoctor ? 'doctor' : 'patient'
      });
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from video consultation server');
      setIsConnected(false);
    });

    // WebRTC signaling
    socketConnection.on('offer', async (data) => {
      if (isComponentMounted) await handleOffer(data);
    });

    socketConnection.on('answer', async (data) => {
      if (isComponentMounted) await handleAnswer(data);
    });

    socketConnection.on('ice-candidate', async (data) => {
      if (isComponentMounted) await handleIceCandidate(data);
    });

    socketConnection.on('call-ended', () => {
      if (isComponentMounted) handleCallEnd();
    });

    socketConnection.on('consultation-started', () => {
      if (isComponentMounted) {
        setIsWaiting(false);
        setIsInCall(true);
        toast.success('Consultation started!');
      }
    });

    socketConnection.on('chat-message', (data) => {
      if (isComponentMounted) {
        setChatMessages(prev => [...prev, {
          sender: data.sender,
          message: data.message,
          timestamp: new Date()
        }]);
      }
    });

    setSocket(socketConnection);
  };

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          appointmentId: demoAppointmentId
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setIsInCall(true);
        setIsWaiting(false);
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const startLocalStream = async () => {
    try {
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });

      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);

      let errorMessage = 'Unable to access camera/microphone.';
      if (error.name === 'NotAllowedError') {
        errorMessage += ' Please check permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += ' No camera/microphone found.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += ' Media access not supported.';
      }

      toast.error(errorMessage);
      return null;
    }
  };

  const startCall = async () => {
    if (!isComponentMounted) return;

    const pc = initializePeerConnection();
    const stream = await startLocalStream();

    if (stream && pc && isComponentMounted) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (socket) {
          socket.emit('offer', {
            offer,
            appointmentId: demoAppointmentId
          });
        }

        setIsWaiting(true);
        toast.success('Calling...');
      } catch (error) {
        console.error('Error creating offer:', error);
        toast.error('Failed to start call');
      }
    }
  };

  const handleOffer = async (data: any) => {
    const pc = initializePeerConnection();
    const stream = await startLocalStream();

    if (stream && pc) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (socket) {
          socket.emit('answer', {
            answer,
            appointmentId: demoAppointmentId
          });
        }

        setIsInCall(true);
        setIsWaiting(false);
        toast.success('Call connected!');
      } catch (error) {
        console.error('Error handling offer:', error);
        toast.error('Failed to join call');
      }
    }
  };

  const handleAnswer = async (data: any) => {
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        setIsInCall(true);
        setIsWaiting(false);
        toast.success('Call connected!');
      } catch (error) {
        console.error('Error handling answer:', error);
        toast.error('Failed to connect call');
      }
    }
  };

  const handleIceCandidate = async (data: any) => {
    if (peerConnection && data.candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        if (peerConnection && screenShareRef.current) {
          const screenTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');

          if (sender) {
            await sender.replaceTrack(screenTrack);
          }

          screenShareRef.current.srcObject = screenStream;
          setIsScreenSharing(true);

          screenTrack.onended = () => {
            toggleScreenShare();
          };
        }
      } else {
        // Stop screen sharing
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];

        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }

        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Screen sharing not available');
    }
  };

  const endCall = () => {
    if (socket) {
      socket.emit('end-call', { appointmentId: demoAppointmentId });
    }
    handleCallEnd();
  };

  const handleCallEnd = () => {
    setIsInCall(false);
    setIsWaiting(false);
    setRemoteStream(null);

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    toast.success('Call ended');
  };

  const sendChatMessage = () => {
    if (chatMessage.trim() && socket) {
      socket.emit('chat-message', {
        appointmentId: demoAppointmentId,
        message: chatMessage.trim(),
        sender: user?.name || 'Anonymous'
      });

      setChatMessages(prev => [...prev, {
        sender: 'You',
        message: chatMessage.trim(),
        timestamp: new Date()
      }]);

      setChatMessage('');
    }
  };

  const cleanup = () => {
    try {
      console.log('Cleaning up video consultation resources...');

      // Stop all media tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (error) {
            console.warn('Error stopping media track:', error);
          }
        });
        setLocalStream(null);
      }

      // Close peer connection
      if (peerConnection) {
        try {
          peerConnection.close();
        } catch (error) {
          console.warn('Error closing peer connection:', error);
        }
        setPeerConnection(null);
      }

      // Disconnect socket
      if (socket) {
        try {
          socket.disconnect();
        } catch (error) {
          console.warn('Error disconnecting socket:', error);
        }
        setSocket(null);
      }

      // Clear timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      // Reset states
      setIsInCall(false);
      setIsWaiting(false);
      setRemoteStream(null);
      setChatMessages([]);
      setCallDuration(0);
      setIsComponentMounted(false);

      console.log('Video consultation cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent rendering if component is not mounted
  if (!isComponentMounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p>Video consultation ended</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Show initialization screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Initializing video consultation...</p>
        </div>
      </div>
    );
  }

  // Show initialization error
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-4">Initialization Error</h2>
          <p className="mb-4">{initializationError}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-white text-xl font-semibold">Video Consultation</h1>
            {!appointmentId && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-medium">
                Demo Mode
              </span>
            )}
            {isInCall && (
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">{formatDuration(callDuration)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                cleanup();
                navigate('/');
              }}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className={`flex-1 relative ${showChat ? 'mr-80' : ''}`}>
          {isWaiting && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white text-lg">Connecting to consultation...</p>
              </div>
            </div>
          )}

          {/* Remote Video */}
          <div className="h-full bg-gray-800">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                onLoadedData={() => {
                  try {
                    if (remoteVideoRef.current && remoteStream) {
                      remoteVideoRef.current.srcObject = remoteStream;
                    }
                  } catch (error) {
                    console.error('Error setting remote video stream:', error);
                  }
                }}
                onError={(e) => {
                  console.error('Remote video error:', e);
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Video className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">Waiting for other participant...</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          {localStream && (
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Local video error:', e);
                }}
              />
            </div>
          )}

          {/* Screen Share */}
          {isScreenSharing && (
            <div className="absolute top-4 left-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-blue-400">
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                Screen Sharing
              </div>
            </div>
          )}

          {/* Call Controls */}
          {isInCall && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-800 bg-opacity-90 rounded-full px-6 py-3">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full transition-colors ${
                  isAudioEnabled
                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoEnabled
                    ? 'bg-gray-600 hover:bg-gray-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-colors ${
                  isScreenSharing
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
                }`}
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
              </button>

              <button
                onClick={endCall}
                className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Start Call Button */}
          {!isInCall && !isWaiting && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
              {!appointmentId && (
                <div className="mb-4 p-4 bg-yellow-500 bg-opacity-20 rounded-lg border border-yellow-500">
                  <p className="text-yellow-300 text-sm mb-2">
                    🎥 Demo Mode: Open this page in another tab/window to simulate a real consultation
                  </p>
                  <p className="text-white text-xs">
                    One tab will be the "patient", the other will be the "doctor"
                  </p>
                </div>
              )}
              <button
                onClick={startCall}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-full transition-colors flex items-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>Start Consultation</span>
              </button>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Consultation Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-gray-400 text-sm font-medium">{msg.sender}</span>
                    <span className="text-gray-500 text-xs">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-white text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    );
  } catch (error) {
    console.error('VideoConsultation render error:', error);
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-bold mb-4">Video Consultation Error</h2>
          <p className="mb-4">An error occurred during video consultation.</p>
          <button
            onClick={() => {
              cleanup();
              navigate('/');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }
};

export default VideoConsultation;
export { VideoConsultationErrorBoundary };