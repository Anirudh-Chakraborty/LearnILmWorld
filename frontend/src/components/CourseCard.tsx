import { Link } from "react-router-dom";
import heroImage from '../assets/Indian_student1.jpeg'
import { useState, useEffect } from "react";
import axios from "axios";

interface CourseProps {
  _id: string;
  title: string;
  thumbnail: string;
}

const CourseCard = ({ course }: { course: CourseProps }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>("");
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchImage = async () => {
      if (!course.thumbnail) {
        setResolvedImageUrl(heroImage);
        return;
      }
      if (course.thumbnail.startsWith('http') || course.thumbnail.startsWith('data:')) {
        setResolvedImageUrl(course.thumbnail);
        return;
      }

      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/upload/get-download-url`, {
          fileKey: course.thumbnail
        });
        setResolvedImageUrl(data.signedUrl);
      } catch (err) {
        console.error(`Failed to fetch image for course: ${course.title}`, err);
        setResolvedImageUrl(heroImage); // Error aane par default image
      }
    };

    fetchImage();
  }, [course.thumbnail, API_BASE_URL]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="h-48 w-full overflow-hidden relative group">
        
        {/* Loading State jab tak signed URL na aaye ya image load na ho */}
        {(!isImageLoaded || !resolvedImageUrl) && (
          <div className="absolute inset-0 bg-gray-300 animate-pulse flex items-center justify-center z-10">
            <span className="text-gray-400 text-xs font-medium">Loading...</span>
          </div>
        )}

        {/* Image Tag */}
        {resolvedImageUrl && (
          <img
            src={resolvedImageUrl}
            alt={course.title}
            loading="lazy"
            className={`h-full w-full object-cover transition-all duration-700 transform group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setIsImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = heroImage;
              e.currentTarget.onerror = null;
              setIsImageLoaded(true);
            }}
          />
        )}
        
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="font-bold text-xl text-gray-900 mb-2">{course.title}</h3>
        
        <div className="mt-auto pt-4 border-t border-gray-100">
          <Link
            to={`/courses/${course._id}`}
            className="inline-flex items-center font-semibold text-sm text-gray-900 hover:text-[#276dc9] transition-colors"
          >
            View Details
            <span className="ml-2 text-lg">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;