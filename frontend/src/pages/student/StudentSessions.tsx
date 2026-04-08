import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Calendar, Clock, Video } from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const StudentSessions: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(
        `${API_BASE_URL}/api/bookings/my-bookings`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBookings(
        Array.isArray(response.data)
          ? response.data.filter((b) => b.paymentStatus === "completed")
          : []
      );
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (booking: any) => {
    if (booking.roomId) {
      const sessionIdToUse =
        typeof booking.sessionId === "object" && booking.sessionId !== null
          ? booking.sessionId._id
          : booking.sessionId;

      navigate(`/session/${sessionIdToUse}?roomId=${booking.roomId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  // ✅ CORRECT FILTER (based on YOUR data)
  const filteredBookings = bookings.filter((booking) => {
    if (!booking.time) return false;

    // Show:
    // - confirmed (upcoming)
    // - active

    return booking.status === "confirmed" || booking.status === "active";
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        My Learning Sessions
      </h2>

      {filteredBookings.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
          No upcoming sessions.
          <Link
            to="/main"
            className="text-[#5186cd] font-bold ml-2 hover:underline"
          >
            Browse Trainers
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            // ✅ USE CORRECT FIELD
            const sessionDateObj = booking.time ? new Date(booking.time) : null;

            const sessionDate = sessionDateObj
              ? sessionDateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "Date Pending";

            const sessionTime = sessionDateObj
              ? sessionDateObj.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
              : "";

            const isGroup = booking.bookingType === "group";
            const tagColor = isGroup
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700";

            const isSessionActive =
              booking.status === "active" && booking.roomId;

            return (
              <div
                key={booking._id}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:shadow-md"
              >
                {/* Trainer */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f0f5fb] text-[#5186cd] flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Teacher</p>
                    <p className="text-[17px] font-bold text-gray-800">
                      {booking.trainer?.name || "Trainer"}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${tagColor}`}
                  >
                    {booking.bookingType} Class
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {booking.duration} min
                  </p>
                </div>

                {/* Time */}
                <div className="bg-gray-50 px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>{sessionDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{sessionTime}</span>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => handleJoinSession(booking)}
                  disabled={!isSessionActive}
                  className={`px-4 py-2 rounded-lg ${
                    isSessionActive
                      ? "bg-[#5186cd] text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Video size={16} /> Join
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentSessions;
