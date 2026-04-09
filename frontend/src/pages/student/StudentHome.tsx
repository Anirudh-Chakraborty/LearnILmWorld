import { BookOpen, Calendar, Star, User, TrendingUp, Bold } from "lucide-react";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isSameMonth,
  subDays,
} from "date-fns";

type AnyObj = Record<string, any>;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const weeklyActivity = [
//   { day: "Mon", classes: 1 },
//   { day: "Tue", classes: 10 },
//   { day: "Wed", classes: 1 },
//   { day: "Thu", classes: 12 },
//   { day: "Fri", classes: 1 },
//   { day: "Sat", classes: 0 },
//   { day: "Sun", classes: 0 },
// ]

type View = "Daily" | "Weekly" | "Monthly";
const StudentHome: React.FC = () => {
  const { user } = useAuth() as AnyObj;

  const [stats, setStats] = useState({
    upcomingSessions: 0,
    totalSpent: 0,
    avgProgress: 85,
  });
  const [recentSessions, setRecentSessions] = useState<AnyObj[]>([]);
  const [allValidBookings, setAllValidBookings] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("Weekly");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch bookings to calculate dynamic "Upcoming" sessions and "Total Spent"
      const bookingsRes = await axios.get(
        `${API_BASE_URL}/api/bookings/my-bookings`,
        { headers },
      );
      const allBookings = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : [];

      const validBookings = allBookings.filter(
        (b: AnyObj) => b.paymentStatus === "completed",
      );
      const upcoming = validBookings.filter(
        (b: AnyObj) => b.status !== "completed",
      );
      const spent = validBookings.reduce(
        (sum: number, b: AnyObj) => sum + (b.amount || 0),
        0,
      );

      setAllValidBookings(validBookings);
      setStats((prev) => ({
        ...prev,
        upcomingSessions: upcoming.length,
        totalSpent: spent,
      }));
      // Set the 3 most recent classes
      setRecentSessions(validBookings.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate growth stats (e.g. +5% this week)
  // const growthStats = useMemo(() => {
  //   const now = new Date();
  //   const lastWeekStart = subDays(now, 7);
  //   const lastWeekEnd = now;
  //   const prevWeekStart = subDays(lastWeekStart, 7);
  //   const prevWeekEnd = lastWeekStart;
  //   const lastWeekCount = allValidBookings.filter((b) => {
  //     const createdAt = new Date(b.createdAt);
  //     return createdAt >= lastWeekStart && createdAt <= lastWeekEnd;
  //   }).length;
  //   const prevWeekCount = allValidBookings.filter((b) => {
  //     const createdAt = new Date(b.createdAt);
  //     return createdAt >= prevWeekStart && createdAt <= prevWeekEnd;
  //   }).length;
  //   if (prevWeekCount === 0) return "New this week";
  //   const growth = ((lastWeekCount - prevWeekCount) / prevWeekCount) * 100;
  //   return `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}% this week`;
  // }, [allValidBookings]);


// Prepare data for the line chart based on the selected view
  const chartData = useMemo(() => {
    const now = new Date();

    // daily - last 7 days
    if (view === "Daily") {
      return Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(now, 3 - i);
        const count = allValidBookings.filter((b) =>
          isSameDay(new Date(b.createdAt), date),
        ).length;
        return { label: format(date, "EEE"), classes: count };
      });

    }
      //weekly - current week Mon-Sun

    if (view === "Weekly") {
      // Current week Mon-Sun
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end }).map((date) => ({
        label: format(date, "EEE"),
        classes: allValidBookings.filter((b) =>
          isSameDay(new Date(b.createdAt), date),
        ).length,
      }));
    }
    if (view === "Monthly") {
      // Current year month by month
      return Array.from({ length: 12 }).map((_, i) => {
        const date = startOfMonth(subDays(now, (3 - i) * 30));
        const count = allValidBookings.filter((b) =>
          isSameMonth(new Date(b.createdAt), date),
        ).length;
        return { label: format(date, "MMM"), classes: count };
      });
    }
    return [];
  }, [allValidBookings, view]);

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

  return (
    <div className="max-w-[1250px] mx-auto px-6 py-8 space-y-8 bg-[#F5F7FB] min-h-screen">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-gray-800">
          Welcome back, {user?.name || "Student"}! 👋
        </h1>
        <p className="text-gray-500">
          You're making great progress. Keep up the learning momentum!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {user?.stats?.totalSessions || 0}
          </p>
          <p className="text-xs text-blue-500 font-medium mt-1">
            Lifetime booked
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Sessions Completed</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {user?.stats?.completedSessions || 0}
          </p>
          <p className="text-xs text-blue-500 font-medium mt-1">
            Successfully attended
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Upcoming Sessions</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {stats.upcomingSessions}
          </p>
          <p className="text-xs text-blue-500 font-medium mt-1">
            Scheduled ahead
          </p>
        </div>

        {/* Avg Progress */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Avg Progress</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {(
              (user?.stats?.completedSessions / user?.stats?.totalSessions) *
                100 || 0
            ).toFixed(2)}
            %
          </p>
          <p className="text-xs text-blue-500 font-medium mt-1">
            Learning progress
          </p>
        </div>
      </div>

      {/* ================= PROGRESS ANALYTICS ================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Progress Analytics
            </h2>
            <p className="text-sm text-gray-500">Track your learning journey</p>
          </div>
          {/* <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
            +5% this week
          </span> */}
        </div>
        {/* Switcher  */}
        <div className="flex bg-gray-100 rounded-full p-1 w-fit mx-auto my-6">
          {(["Daily", "Weekly", "Monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`px-6 py-2 rounded-full text-sm transition-all ${
                view === t
                  ? "bg-blue-500 text-white font-medium shadow"
                  : "text-gray-600 hover:text-blue-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 p-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label">
                  <Label
                    value={view}
                    position="insideBottom"
                    offset={-15}
                    fontSize={12}
                    fill="#5186CC"
                    fontWeight={600}
                  />
                </XAxis>
                <YAxis allowDecimals={false}>
                  <Label
                    value="Sessions"
                    angle={-90}
                    position="insideLeft"
                    fill="#5186CC"
                    fontSize={12}
                    fontWeight={600}
                  />
                </YAxis>
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="classes"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ================= RECENT SESSIONS ================= */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent Sessions
          </h2>
          <Link
            to="/student/sessions"
            className="text-blue-600 font-semibold hover:underline"
          >
            View All →
          </Link>
        </div>

        {recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session._id || session.id}
                className="flex justify-between items-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-semibold capitalize">
                    {session.bookingType?.replace("_", " ")} Class
                  </p>
                  <p className="text-sm text-gray-500">
                    with {session.trainer?.name}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                    session.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-10">No sessions yet</p>
        )}
      </div>
    </div>
  );
};

export default StudentHome;
