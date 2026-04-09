import { useState } from "react";
import { useLocation } from "react-router-dom"; // URL padhne ke liye
import TrainersGrid from "./TrainersGrid";
const SearchResultDisplay = () => {
  const location = useLocation();
  const [nationalities, setNationalities] = useState<string[]>([]);
  
  // 1. Navbar se bheja gaya search word URL se nikalein
  const queryParams = new URLSearchParams(location.search);
  const navbarSearchTerm = queryParams.get("search") || "";

  // 2. Dummy ya existing filters state (agar aapke page par pehle se hain toh unhe use karein)
  const [filters, setFilters] = useState({});

  return (
    <div className="main-page-container">
      
      {/* 3. Navbar ka word as a prop 'searchTerm' bhejein */}
      <TrainersGrid 
        searchTerm={navbarSearchTerm} 
        filters={filters} 
        learningType="subject" 
        setNationalities={setNationalities} 
      />

    </div>
  );
};

export default SearchResultDisplay;