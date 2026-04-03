import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Video, Clock, User, Plus } from "lucide-react";
import ManageClasses from "../../components/ManageClasses";
import moment from "moment-timezone";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TrainerSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const trainerTz = user?.profile?.timezone || moment.tz.guess();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch both created Sessions AND pending Bookings
      const [sessionsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/sessions/my-sessions`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_BASE_URL}/api/bookings/my-bookings`, { headers }).catch(() => ({ data: [] }))
      ]);

      // 1. Filter out only the pending bookings
      const rawPendingBookings = (Array.isArray(bookingsRes.data) ? bookingsRes.data : [])
        .filter((b: any) => b.paymentStatus === "completed" && b.status !== "active" && !b.sessionId);

      const pendingPrivate: any[] = [];
      const pendingGroupMap = new Map<string, any>();

      // 2. Group the bookings together
      rawPendingBookings.forEach((b: any) => {
        
        // --- FIXED DATE PARSING LOGIC ---
        let safeDate = new Date();
        
        // If 'time' already contains the full valid ISO string, use it directly!
        if (b.time && !isNaN(new Date(b.time).getTime())) {
          safeDate = new Date(b.time);
        } 
        // Fallback for older bookings
        else if (b.date && b.time) {
          const combined = new Date(`${b.date}T${b.time}`);
          if (!isNaN(combined.getTime())) safeDate = combined;
          else if (!isNaN(new Date(b.date).getTime())) safeDate = new Date(b.date);
        } else if (b.startTime) {
          safeDate = new Date(b.startTime);
        }

        if (b.bookingType === 'group') {
          // GROUP SESSIONS: Group them by exact Date and Time
          const key = `${b.date}_${b.time}`;
          if (!pendingGroupMap.has(key)) {
            pendingGroupMap.set(key, {
              _id: b._id, 
              bookingIds: [b._id], 
              isPendingBooking: true,
              title: `Group Class`,
              scheduledDate: safeDate,
              duration: b.duration || 60,
              status: "scheduled",
              students: b.student ? [b.student] : []
            });
          } else {
            const existingGroup = pendingGroupMap.get(key);
            existingGroup.bookingIds.push(b._id);
            if (b.student) existingGroup.students.push(b.student);
          }
        } else {
          // PRIVATE SESSIONS
          pendingPrivate.push({
            ...b,
            _id: b._id,
            bookingIds: [b._id],
            isPendingBooking: true,
            title: `Private Class`,
            scheduledDate: safeDate,
            duration: b.duration || 60,
            status: "scheduled",
            students: b.student ? [b.student] : []
          });
        }
      });

      const pendingBookings = [...pendingPrivate, ...Array.from(pendingGroupMap.values())];

      // Format Active Sessions 
      const activeSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data
        .filter((s: any) => s.status !== 'ended') // Dont show the ended session
        .map((s: any) => {
          let sDate = new Date();
          if (s.scheduledDate && !isNaN(new Date(s.scheduledDate).getTime())) {
              sDate = new Date(s.scheduledDate);
          } else if (s.startTime && !isNaN(new Date(s.startTime).getTime())) {
              sDate = new Date(s.startTime);
          }
          return { ...s, scheduledDate: sDate };
      }) : [];

      // Merge both lists and sort by date
      const allUpcoming = [...activeSessions, ...pendingBookings].sort((a, b) => {
        const timeA = new Date(a.scheduledDate).getTime();
        const timeB = new Date(b.scheduledDate).getTime();

        // Push any invalid/missing dates to the very bottom of the list
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;

        // Sort chronologically (Earliest date and time appears first)
        return timeA - timeB; 
      });

      setSessions(allUpcoming);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Session State Updates ---------- */
  const updateSessionStatus = async (sessionId: string, status: string, roomId?: string) => {
    const token = localStorage.getItem("token");
    await axios.put(
      `${API_BASE_URL}/api/sessions/${sessionId}/status`,
      { status, roomId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  /* ---------- Trainer starts session ---------- */
  const handleStartSession = async (item: any) => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let targetSessionId = item._id;
      let generatedRoomId = item.roomId;

      if (item.isPendingBooking) {
        const roomRes = await axios.post(
          `${API_BASE_URL}/api/sessions/create-room`,
          {
            title: item.title,
            bookingIds: item.bookingIds, 
            duration: item.duration,
            scheduledDate: item.scheduledDate,
            region: "in",
            language: "English", 
            level: "beginner",
            description: "Live Class",
            maxStudents: item.students?.length || 1,
          },
          { headers }
        );

        targetSessionId = roomRes.data.session._id;
        generatedRoomId = roomRes.data.roomData.id;
      } 
      
      await updateSessionStatus(targetSessionId, "active", generatedRoomId);
      navigate(`/session/${targetSessionId}?roomId=${generatedRoomId}`);
    } catch (err: any) {
      console.error("Failed to start session:", err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Could not start session.\nError from server: ${errorMsg}`);
    }
  };

  /* ---------- Trainer joins active session ---------- */
  const handleJoinSession = (session: any) => {
    navigate(`/session/${session._id}?roomId=${session.roomId}`);
  };

  /* ---------- Trainer ends session ---------- */
  const handleEndSession = async (session: any) => {
    const confirmEnd = window.confirm("End this session for all participants?");
    if (!confirmEnd) return;

    try {
      const token = localStorage.getItem("token");
      if (session.roomId) {
        await axios.post(
          `${API_BASE_URL}/api/sessions/end-room/${session._id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchSessions();
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-dots">
          <div></div><div></div><div></div><div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Sessions</h2>
        <button 
          onClick={() => setIsManageModalOpen(true)}
          className="flex items-center gap-2 bg-[#024AAC] hover:bg-[#033c8c] text-white px-4 py-2 rounded-lg font-medium transition"
        >
          <Plus size={18} />
          Create Group Session
        </button>
      </div>

      <ManageClasses 
        isOpen={isManageModalOpen} 
        onClose={() => setIsManageModalOpen(false)} 
      />

      {/* Sessions */}
      <div className="bg-white rounded-2xl p-4 shadow-md border">
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => {
              const safeDateObj = new Date(session.scheduledDate);
              const isValidDate = !isNaN(safeDateObj.getTime());
              let displayDate = "Date Pending";
              let displayStartTime = "Time Pending";
              let displayEndTime = "";
              
              // let endTimeStr = "Time Pending";
              if (isValidDate) {
                const startMoment = moment(safeDateObj).tz(trainerTz);
                const endMoment = moment(safeDateObj).add((session.duration || 60), 'minutes').tz(trainerTz);

                displayDate = startMoment.format('ddd, MMM D, YYYY');
                displayStartTime = startMoment.format('hh:mm A');
                displayEndTime = endMoment.format('hh:mm A');
              }

              let studentDisplay = `${session.students?.length || 0} students enrolled`;
              if (session.students?.length === 1 && session.students[0]?.name) {
                 studentDisplay = session.students[0].name;
              } else if (session.students?.length > 1) {
                 studentDisplay = session.students.map((s: any) => s.name).join(', ');
              }

              return (
              <div
                key={session._id || session.id}
                className="p-4 sm:p-5 bg-gray-50 rounded-xl border"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="h-auto w-1.5 bg-[#5186CC] rounded-full"></div>
                    <div className="grid grid-col-1 gap-2" >
                      <h3 className="font-semibold flex gap-2 items-center text-sm sm:text-base">
                        <span> 
                          <Video className="w-4 h-4 bg-gray-200 rounded-full text-gray-600" />
                        </span>
                        {session.title}
                      </h3>
                      <p className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{displayDate}</span>
                      </p>
                      <p className="flex items-center text-sm gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {displayStartTime}
                          {displayEndTime && ` - ${displayEndTime}`}
                        </span>
                      </p>
                      <p className="text-blue-500 gap-2 flex items-center font-medium text-sm mt-1">
                        <span>
                          <User className="w-4 h-4" />
                        </span>
                        {studentDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col gap-2 justify-center items-center ">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-200 self-start sm:self-auto">
                      {(session.status || "scheduled").toUpperCase()}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {session.status === "scheduled" && (
                        <button
                          onClick={() => handleStartSession(session)}
                          className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg text-xs sm:text-sm"
                        >
                          Start
                        </button>
                      )}

                      {session.status === "active" && (
                        <>
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg text-xs sm:text-sm flex items-center"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join
                          </button>

                          <button
                            onClick={() => handleEndSession(session)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs sm:text-sm"
                          >
                            End
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="text-center py-10">
            <Calendar className="mx-auto h-7 w-7 text-gray-400" />
            <p className="mt-2 text-gray-600">No sessions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerSessions;