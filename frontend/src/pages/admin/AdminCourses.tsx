import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Plus, Edit, X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Course {
  _id: string;
  title: string;
  description?: string[];
  thumbnail: string;
  // videoUrl?: string
  pdfUrl?: string;
  createdAt: string;
}

const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [descriptionPoints, setDescriptionPoints] = useState<string[]>([""]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // fetch courses
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/api/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async () => {
    if (!title || !thumbnailFile || !pdfFile) {
      alert("Title, Cover Image (Thumbnail) and PDF are required");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      // Upload files to R2
      const thumbnailKey = await uploadToR2(thumbnailFile, "thumbnails");
      const pdfKey = await uploadToR2(pdfFile, "pdfs");

      // Filter out empty points
      const validPoints = descriptionPoints.filter((p) => p.trim() !== "");

      // Save course data
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/courses`,
        {
          title,
          description: validPoints,
          thumbnail: thumbnailKey,
          pdfUrl: pdfKey,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCourses([res.data, ...courses]);

      setTitle("");
      setDescriptionPoints([""]);
      setThumbnailFile(null);
      setPdfFile(null);

      const thumbInput = document.getElementById(
        "thumbInput",
      ) as HTMLInputElement | null;
      const pdfInput = document.getElementById(
        "pdfInput",
      ) as HTMLInputElement | null;

      if (thumbInput) thumbInput.value = "";
      if (pdfInput) pdfInput.value = "";
    } catch (err) {
      console.error("Create course error:", err);
      alert("Failed to create course. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingId(course._id);
    setTitle(course.title);

    setDescriptionPoints(
      course.description && course.description.length > 0
        ? [...course.description]
        : [""],
    );
    setThumbnailFile(null);
    setPdfFile(null);

    // Scroll up to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateCourse = async () => {
    if (!editingId) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");

      const currentCourse = courses.find((c) => c._id === editingId);
      let thumbKey = currentCourse?.thumbnail || "";
      let pdfKey = currentCourse?.pdfUrl || "";

      if (thumbnailFile) {
        thumbKey = await uploadToR2(thumbnailFile, "thumbnails");
      }
      if (pdfFile) {
        pdfKey = await uploadToR2(pdfFile, "pdfs");
      }

      const validPoints = descriptionPoints.filter((p) => p.trim() !== "");

      const res = await axios.put(
        `${API_BASE_URL}/api/admin/courses/${editingId}`,
        {
          title,
          description: validPoints,
          thumbnail: thumbKey,
          pdfUrl: pdfKey,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Update local state
      setCourses(courses.map((c) => (c._id === editingId ? res.data : c)));

      setEditingId(null);
      setTitle("");
      setDescriptionPoints([""]);
      setThumbnailFile(null);
      setPdfFile(null);

      // Reset file inputs visually
      const thumbInput = document.getElementById(
        "thumbInput",
      ) as HTMLInputElement | null;
      const pdfInput = document.getElementById(
        "pdfInput",
      ) as HTMLInputElement | null;
      if (thumbInput) thumbInput.value = "";
      if (pdfInput) pdfInput.value = "";

      alert("Course updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update course");
    } finally {
      setSubmitting(false);
    }
  };

  // Add/Remove Points Logic
  const handlePointChange = (index: number, value: string) => {
    const newPoints = [...descriptionPoints];
    newPoints[index] = value;
    setDescriptionPoints(newPoints);
  };
  const addPoint = () => setDescriptionPoints([...descriptionPoints, ""]);
  const removePoint = (index: number) => {
    setDescriptionPoints(descriptionPoints.filter((_, i) => i !== index));
  };

  // Helper: Upload to Cloudflare R2
  const uploadToR2 = async (file: File, folderSub: string) => {
    const token = localStorage.getItem("token");

    // 1. URL lane ke liye Axios theek hai
    const resUrl = await axios.post(
      `${API_BASE_URL}/api/upload/get-upload-url`,
      {
        fileName: file.name,
        fileType: file.type,
        folderMain: "courses",
        folderSub: folderSub,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const { uploadUrl, key } = resUrl.data;

    // 2. Upload karne ke liye FETCH use karenge (Axios yahan signature hag deta hai)
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    // Agar phir bhi fail hua, toh hume exact reason console me dikh jayega
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("R2 Upload Failed Detail:", errorText);
      throw new Error("Upload Failed");
    }

    return key;
  };

  const ThumbnailCell = ({ thumbnailKey }: { thumbnailKey: string }) => {
    const [url, setUrl] = useState<string>("");

    useEffect(() => {
      if (!thumbnailKey) return;
      if (thumbnailKey.startsWith("http") || thumbnailKey.startsWith("data:")) {
        setUrl(thumbnailKey);
        return;
      }

      const fetchUrl = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.post(
            `${API_BASE_URL}/api/upload/get-download-url`,
            {
              fileKey: thumbnailKey,
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setUrl(res.data.signedUrl);
        } catch (err) {
          console.error("Failed to load thumbnail", err);
        }
      };

      fetchUrl();
    }, [thumbnailKey]);

    if (!url)
      return (
        <div className="w-16 h-10 bg-gray-200 animate-pulse rounded"></div>
      );

    return (
      <img
        src={url}
        alt="Course Thumbnail"
        className="w-16 h-10 object-cover rounded"
      />
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/admin/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(courses.filter((c) => c._id !== id));
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="glass-effect rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Courses</h2>
        <p className="text-gray-600 mb-6">Create courses</p>

        <div className="grid grid-cols-1 gap-4 mb-6">
          <input
            type="text"
            placeholder="Course title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Cover Image (Thumbnail)
              </label>
              <input
                id="thumbInput"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Course PDF
              </label>
              <input
                id="pdfInput"
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="input w-full"
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <label className="block text-sm text-gray-600">
              Description Points
            </label>
            {descriptionPoints.map((point, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder={`Point ${idx + 1}`}
                  value={point}
                  onChange={(e) => handlePointChange(idx, e.target.value)}
                  className="input flex-1"
                />
                {descriptionPoints.length > 1 && (
                  <button
                    onClick={() => removePoint(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPoint}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              + Add another point
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={editingId ? handleUpdateCourse : handleCreateCourse}
            disabled={submitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition ${
              editingId
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-[#0ea5a3] hover:bg-[#0c8f8d]"
            } text-white`}
          >
            <Plus size={18} />
            {submitting
              ? "Processing..."
              : editingId
                ? "Update Course"
                : "Create Course"}
          </button>

          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setDescriptionPoints([""]);
                setThumbnailFile(null);
                setPdfFile(null);
              }}
              className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      {/* </div> */}

      {/* COURSES TABLE */}
      <div className="glass-effect rounded-2xl p-6 shadow-xl">
        {courses.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No courses created.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl overflow-hidden">
              <thead className="bg-[#0ea5a3] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Thumbnail</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                        <ThumbnailCell thumbnailKey={course.thumbnail} />
                    </td>
                    <td className="px-4 py-3 font-medium">{course.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit course"
                      >
                        <Edit size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(course._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete course"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;
