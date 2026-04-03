import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ManageClassesProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageClasses: React.FC<ManageClassesProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const durationMinutes = 90;
  const [price, setPrice] = useState<number>(15);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!user?.id) {
      setError('User authentication required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        teacherId: user.id,
        title,
        startTime,
        durationMinutes,
        price
      };

      const res = await axios.post(`${API_BASE_URL}/api/class-schedule/group-session`, payload);
      setSuccess(res.data.message || 'Group class created!');
      setTitle('');
      setStartTime('');
      setPrice(15);
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule group class.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-gray-50 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto mt-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Create a Group Session</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          Close
        </button>
      </div>
      
      {success && (
        <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5186cd] outline-none"
              placeholder="e.g., Advanced Conversational English"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date & Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5186cd] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
              <div className="w-full px-4 py-2 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg cursor-not-allowed">
                90 Minutes
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#5186cd] text-white rounded-lg font-bold shadow hover:bg-[#3f6fb0] transition disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : 'Schedule Group Class'}
          </button>
        </form>
    </div>
  );
};

export default ManageClasses;