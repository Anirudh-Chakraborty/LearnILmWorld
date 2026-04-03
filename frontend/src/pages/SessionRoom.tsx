import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  //Added This for share screen : 26/03/26
  selectPeerScreenSharing,
  selectScreenShareByPeerID,
  useScreenShare,
  useVideo,
  useHMSNotifications,
  selectHMSMessages,         // Added for Chat
  HMSNotificationTypes,       // Added for Kick-out logic

  selectIsPeerVideoEnabled,  //for video on/off status
  selectIsPeerAudioEnabled,  //for audio on/off status
} from '@100mslive/react-sdk';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Video Tile Component 
// const VideoTile = ({ peer, isLocal }: { peer: any, isLocal: boolean }) => {
//   const { videoRef } = useVideo({
//     trackId: peer.videoTrack
//   });

//   return (
//     <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video shadow-lg">
//       <video
//         ref={videoRef}
//         className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
//         autoPlay
//         muted
//         playsInline
//       />
//       <div className="absolute bottom-3 left-3 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
//         {peer.name} {isLocal && "(You)"}
//       </div>
//     </div>
//   );
// };

const VideoTile = ({ peer, isLocal }: { peer: any, isLocal: boolean }) => {
  const { videoRef } = useVideo({
    trackId: peer.videoTrack
  });

  //to check if video/audio is on or off for the peer
  const isVideoOn = useHMSStore(selectIsPeerVideoEnabled(peer.id));
  const isAudioOn = useHMSStore(selectIsPeerAudioEnabled(peer.id));
  
  const initials = peer.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video shadow-lg">

      {/* 🎥 VIDEO OR AVATAR */}
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

      {/* 👤 NAME TAG */}
      <div className="absolute bottom-3 left-3 bg-black/50 text-white px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm">
        {peer.name} {isLocal && "(You)"}
      </div>

      {/* 🎤 MIC OFF INDICATOR */}
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
  // implemented for screen share : 26/03/26
  const track = useHMSStore(selectScreenShareByPeerID(peer.id));
  const { videoRef } = useVideo({
  trackId: track?.id
  }); 

    if (!track) return null;

  return (
    <div className="flex items-center justify-center bg-black w-full h-full">
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

// 2. The Main Room Interface
const RoomInterface = ({ sessionId, role }: { sessionId: string, role: string }) => {
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const navigate = useNavigate();
  // Added for screen share : 26/03/26
  const { amIScreenSharing, toggleScreenShare } = useScreenShare();
  const screenPeer = useHMSStore(selectPeerScreenSharing);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ---> REMOVED THE PROBLEMATIC USEEFFECT LEAVE() FUNCTION FROM HERE <---

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(isVideoOff);
    setIsVideoOff(!isVideoOff);
  };

  // The user will only leave when they explicitly click the red button
  const leaveRoom = async () => {
    await hmsActions.leave();
    if (role === 'trainer') {
      navigate('/trainer/sessions');
    } else {
      navigate('/student/sessions');
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="loading-dots mb-4"><div></div><div></div><div></div><div></div></div>
        <p className="text-gray-600 font-medium">Connecting to secure video room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 flex flex-col">
      <div className="text-white mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Live Session</h2>
        <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          LIVE
        </span>
      </div>

      {screenPeer ? (
        <div className="flex-1 relative bg-black mb-20">
          {/* SCREEN SHARE (MAIN) */}
          <ScreenShareTile peer={screenPeer} />

          {/* CAMERA GRID (SMALL OVERLAY) */}
          <div className="absolute bottom-4 right-4 w-56 max-h-64 overflow-y-auto bg-black/40 p-2 rounded-lg">
            <div className="grid grid-cols-1 gap-2">
              {peers.map((peer) => (
                <VideoTile key={peer.id} peer={peer} isLocal={peer.isLocal} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max mb-20">
          {peers.map((peer) => (
            <VideoTile key={peer.id} peer={peer} isLocal={peer.isLocal} />
          ))}
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-2xl px-6 py-3 flex gap-4 shadow-2xl">

        <button onClick={toggleAudio} className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button onClick={toggleVideo} className={`p-4 rounded-full transition ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>
        
        <button
        // added screen share toggle : 26/03/26
        onClick={() => toggleScreenShare?.()}
       // oonClick={toggleScreenShare}
        className="p-4 rounded-full bg-gray-700 text-white hover:bg-gray-600"
        >
        {amIScreenSharing ? "Stop Share" : "Share"}
        </button>
        
        <button onClick={leaveRoom} className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition ml-4">
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

// 3. The API Connection Component
const SessionRoom = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  
  const [error, setError] = useState("");
  const hmsActions = useHMSActions();
  const notification = useHMSNotifications(); 

  // Lock the join request so it ONLY runs exactly once
  const joinInitiated = useRef(false);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const role = currentUser.role || 'student'; 

  // Catch background 100ms errors
  useEffect(() => {
    if (notification && notification.type === 'ERROR') {
      console.error("[100ms Background Error]:", notification.data);
      setError(notification.data?.message || "100ms Connection Error");
    }
  }, [notification]);

  useEffect(() => {
    // If we already started joining, DO NOT run again!
    if (!sessionId || joinInitiated.current) return;

    const join100msSession = async () => {
      joinInitiated.current = true; // Lock the door

      try {
        const authToken = localStorage.getItem('token');
        if (!authToken) {
          setError("You must be logged in to join a session.");
          return;
        }

        console.log("[100ms] Fetching token from backend...");

        const response = await axios.post(
          `${API_BASE_URL}/api/sessions/join-room`,
          { session_id: sessionId, role: role },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (response.data.success && response.data.token) {
          console.log("[100ms] Token received, joining room...");
          
          await hmsActions.join({
            userName: response.data.userName || "User",
            authToken: response.data.token,
          });
          
          console.log("[100ms] Successfully sent join command!");
        }
      } catch (err: any) {
        console.error("Error joining 100ms session:", err);
        setError(err.response?.data?.message || "Failed to join session. Please try again.");
        joinInitiated.current = false; // Unlock if it failed so user can retry
      }
    };

    join100msSession();

    // ---> REMOVED THE CLEANUP LEAVE() FUNCTION FROM HERE TOO <---
  }, [sessionId, hmsActions, role, currentUser.name]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <RoomInterface sessionId={sessionId as string} role={role} />;
};

// 4. Wrap everything in the 100ms Provider
const SessionRoomWrapper = () => (
  <HMSRoomProvider>
    <SessionRoom />
  </HMSRoomProvider>
);

export default SessionRoomWrapper;