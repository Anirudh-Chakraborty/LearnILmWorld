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
    <div className="bg-white rounded-xl border p-1 shadow-sm">
      {/* Container */}
      <div className="flex justify-center ">
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              className={`flex-1 text-center px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200
              ${
                isActive
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
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