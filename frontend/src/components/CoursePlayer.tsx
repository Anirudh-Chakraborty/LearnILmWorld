import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FileText, ArrowLeft } from "lucide-react";

const CoursePlayer = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [openingPdf, setOpeningPdf] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/courses/${id}`)
      .then(res => setCourse(res.data))
      .catch(err => console.error("Error fetching course:", err));
  }, [id]);

  if (!course) return <div className="p-10 text-center">Loading Content...</div>;

  const openNotesInNewTab = async () => {
    if (!course.pdfUrl) return;
    
    try {
      setOpeningPdf(true);
      // Fetch signed URL from your R2 backend controller
      const res = await axios.post(`${API_BASE_URL}/api/upload/get-download-url`, { 
        fileKey: course.pdfUrl 
      });
      window.open(res.data.signedUrl, "_blank");
    } catch (error) {
      console.error("Failed to load PDF:", error);
      alert("Could not open PDF at this time.");
    } finally {
      setOpeningPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/courses" className="inline-flex items-center text-gray-500 hover:text-pink-600 font-medium mb-6 transition-colors">
          <ArrowLeft size={20} className="mr-2"/> Back to Courses
        </Link>

        {/* Top Header Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{course.title}</h1>
            
            {/* Description rendered as list points */}
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Course Topics</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 text-base leading-relaxed">
              {course.description && course.description.length > 0 ? (
                course.description.map((point: string, idx: number) => (
                  <li key={idx}>{point}</li>
                ))
              ) : (
                <li>No description provided.</li>
              )}
            </ul>
          </div>

          {/* PDF Button */}
          {course.pdfUrl && (
            <button 
              onClick={openNotesInNewTab}
              disabled={openingPdf}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap ${openingPdf ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 hover:-translate-y-1 text-white'}`}
            >
              <FileText size={20} />
              {openingPdf ? 'Loading...' : 'Open Notes PDF ↗'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CoursePlayer;