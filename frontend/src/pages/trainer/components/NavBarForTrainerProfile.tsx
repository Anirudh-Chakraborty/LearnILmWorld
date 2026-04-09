type Props = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

const TrainerTabs = ({ activeTab, setActiveTab }: Props) => {
  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "teaching", label: "Teaching" },
    { id: "availability", label: "Availability" },
    { id: "certifications", label: "Certifications" },
    { id: "media", label: "Media" },
    { id: "security", label: "Security" },
  ];

  return (
    <div className="w-full flex justify-center mt-4 mb-6">
      {/* Container */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-gray-200 p-1.5 rounded-full shadow-inner">
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 text-center px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200
              ${
                isActive
                  ? "bg-white text-blue-600 shadow-md"
                  : "text-gray-600 hover:bg-gray-300 hover:text-gray-900"
              }
              active:scale-95`}
            >
              {tab.label}
            </button>
          );
        })}

      </div>
    </div>
  );
};

export default TrainerTabs;