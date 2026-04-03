import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectPeerScreenSharing,
  selectScreenShareByPeerID, 
  useScreenShare,
  useVideo,
  useHMSNotifications,
  selectHMSMessages,         
  HMSNotificationTypes,       
  selectIsPeerVideoEnabled,  
  selectIsPeerAudioEnabled,
  selectLocalPeer,          
} from '@100mslive/react-sdk';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, MessageSquare, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

//  Video Tile Component 
const VideoTile = ({ peer, isLocal }: { peer: any, isLocal: boolean }) => {
  const { videoRef } = useVideo({ trackId: peer.videoTrack });

  const isVideoOn = useHMSStore(selectIsPeerVideoEnabled(peer.id));
  const isAudioOn = useHMSStore(selectIsPeerAudioEnabled(peer.id));
  
  const initials = peer.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video shadow-lg">
      {/* VIDEO OR AVATAR */}
      {isVideoOn ? (
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
          autoPlay
          muted
          playsInline
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-3xl font-semibold">
          {initials}
        </div>
      )}

      {/* NAME TAG */}
      <div className="absolute bottom-3 left-3 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
        {peer.name} {isLocal && "(You)"}
      </div>

      {/* MIC OFF INDICATOR */}
      {!isAudioOn && (
        <div className="absolute bottom-3 right-3 bg-red-500 p-2 rounded-full shadow-md">
          <MicOff size={16} />
        </div>
      )}
    </div>
  );
};

// Screen Share Tile Component
const ScreenShareTile = ({ peer }: { peer: any }) => {
  const track = useHMSStore(selectScreenShareByPeerID(peer.id));
  const { videoRef } = useVideo({ trackId: track?.id }); 

  if (!track) return null;

  return (
    <div className="flex items-center justify-center bg-black w-full h-full rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
        {peer.name} • Sharing Screen
      </div>
    </div>
  );
};

// Chat Panel Component
const ChatPanel = ({ onClose }: { onClose: () => void }) => {
  const hmsActions = useHMSActions();
  const messages = useHMSStore(selectHMSMessages);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await hmsActions.sendBroadcastMessage(input);
    setInput("");
  };

  return (
    <div className="w-full sm:w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-full absolute right-0 top-0 sm:relative z-20">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <h3 className="text-white font-bold">Room Chat</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-10">No messages yet. Say hi! 👋</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <span className="text-xs text-gray-400 mb-1 font-medium">
                {msg.senderName} • {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="bg-gray-700 text-white p-3 rounded-xl rounded-tl-none w-fit max-w-[90%] text-sm shadow-sm break-words">
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-900 text-white placeholder-gray-500 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
          />
          <button 
            type="submit" 
            disabled={!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

// The Main Room Interface
const RoomInterface = ({ sessionId, role }: { sessionId: string, role: string }) => {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const navigate = useNavigate();
  
  const { amIScreenSharing, toggleScreenShare } = useScreenShare();
  const screenPeer = useHMSStore(selectPeerScreenSharing);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  const leaveRoom = async () => {
    await hmsActions.leave();
    const isAdmin = localPeer?.roleName === 'admin' || role === 'admin';
    const isTrainer = localPeer?.roleName === 'host' || role === 'trainer';

    if (isAdmin) {
      navigate('/admin/sessions');
    } else if (isTrainer) {
      navigate('/trainer');
    } else {
      navigate('/student');
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="loading-dots mb-4"><div></div><div></div><div></div><div></div></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      
      {/* LEFT SIDE: Video Area */}
      <div className="flex-1 flex flex-col p-4 relative">
        <div className="text-white mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Live Session</h2>
          <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            LIVE
          </span>
        </div>

        {screenPeer ? (
          <div className="flex-1 relative bg-black mb-20 rounded-xl overflow-hidden">
            <ScreenShareTile peer={screenPeer} />
            <div className="absolute bottom-4 right-4 w-48 max-h-[60%] overflow-y-auto bg-black/60 p-2 rounded-xl backdrop-blur-md z-10 custom-scrollbar">
              <div className="grid grid-cols-1 gap-2">
                {peers.map((peer) => (
                  <VideoTile key={peer.id} peer={peer} isLocal={peer.isLocal} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max mb-20 overflow-y-auto">
            {peers.map((peer) => (
              <VideoTile key={peer.id} peer={peer} isLocal={peer.isLocal} />
            ))}
          </div>
        )}

        {/* Control Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-2xl px-6 py-3 flex gap-3 shadow-2xl z-10">
          <button onClick={toggleAudio} className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          
          <button onClick={toggleVideo} className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
          
          <button onClick={() => toggleScreenShare?.()} className={`p-4 rounded-full transition ${amIScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
            <span className="text-sm font-bold block leading-none px-1">{amIScreenSharing ? "Stop Share" : "Share"}</span>
          </button>

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)} 
            className={`p-4 rounded-full transition ml-2 relative ${isChatOpen ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
          >
            <MessageSquare size={22} />
          </button>
          
          <button onClick={leaveRoom} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition ml-4">
            <PhoneOff size={22} />
          </button>
        </div>
      </div>

      {/* RIGHT SIDE: Chat Panel */}
      {isChatOpen && <ChatPanel onClose={() => setIsChatOpen(false)} />}
      
    </div>
  );
};

// The API Connection Component
const SessionRoom = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  const navigate = useNavigate();
  
  const [error, setError] = useState("");
  const hmsActions = useHMSActions();
  const notification = useHMSNotifications(); 
  
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const localPeer = useHMSStore(selectLocalPeer); 

  const hasJoinedRef = useRef(false);

  // Deep Role & ENV Check
  const userStr = localStorage.getItem('user');
  let currentUser: any = {};
  try { currentUser = userStr ? JSON.parse(userStr) : {}; } catch(e) {}
  
  let roleStr = currentUser?.role || currentUser?.user?.role || 'student';
  let role = roleStr.toLowerCase();
  
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  if (currentUser?.email === adminEmail || currentUser?.user?.email === adminEmail) {
    role = 'admin';
  }

  // Handle Notifications (Kickouts)
  useEffect(() => {
    if (!notification) return;

    if (notification.type === 'ERROR') {
      console.error("[100ms Background Error]:", notification.data);
      setError(notification.data?.message || "100ms Connection Error");
    }

    if (notification.type === HMSNotificationTypes.ROOM_ENDED || notification.type === HMSNotificationTypes.REMOVED_FROM_ROOM) {
      alert("The session has ended.");
      
      const isAdmin = localPeer?.roleName === 'admin' || role === 'admin';
      const isTrainer = localPeer?.roleName === 'host' || role === 'trainer';

      if (isAdmin) {
        navigate('/admin/sessions');
      } else if (isTrainer) {
        navigate('/trainer');
      } else {
        navigate('/student');
      }
    }
  }, [notification, navigate, role, localPeer]);

  // Handle Joining Room 
  useEffect(() => {
    if (!sessionId || hasJoinedRef.current || isConnected) return;

    const join100msSession = async () => {
      hasJoinedRef.current = true; 

      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          setError("You must be logged in to join a session.");
          return;
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/sessions/join-room`,
          { session_id: sessionId, role: role },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        if (response.data.success && response.data.token) {
          await hmsActions.join({
            userName: response.data.userName || currentUser.name || "User",
            authToken: response.data.token,
          });
        }
      } catch (err: any) {
        console.error("Error joining 100ms session:", err);
        setError(err.response?.data?.message || "Failed to join session. Please try again.");
        hasJoinedRef.current = false; // Reset on failure (from SessionRoom1)
      }
    };

    join100msSession();
  }, [sessionId, hmsActions, role, currentUser.name, isConnected]);

  // Handle Unmount Cleanup 
  useEffect(() => {
    return () => {
      hmsActions.leave();
      hasJoinedRef.current = false;
    };
  }, [hmsActions]);

  // Handle Popstate (Browser Back Button)
  useEffect(() => {
    const handleBack = async () => {
      try {
        await hmsActions.leave();
        hasJoinedRef.current = false;
      } catch (err) {
        console.error("Error leaving room:", err);
      }
    };

    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [hmsActions]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <RoomInterface sessionId={sessionId as string} role={role} />;
};

const SessionRoomWrapper = () => (
  <HMSRoomProvider>
    <SessionRoom />
  </HMSRoomProvider>
);

export default SessionRoomWrapper;