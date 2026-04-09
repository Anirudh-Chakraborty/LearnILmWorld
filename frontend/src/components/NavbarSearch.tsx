import React, { FormEvent } from "react";
import { Search } from 'lucide-react'

interface Props {
    value: string;
    onChange: (v: string) => void;
    onSubmit: () => void; 
}

const NavbarSearch: React.FC<Props> = React.memo(({ value, onChange, onSubmit }) => {
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="w-full max-w-xl">
            {/* Form add kiya */}
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    placeholder="Search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full h-10 pl-5 pr-12 rounded-full border
                     border-blue-300 bg-transparent text-gray-700
                      placeholder:text-[#02277a] shadow-[0_2px_10px_rgba(59,130,246,0.15)]
                       focus:outline-none focus:ring-2 focus:ring-blue-400 
                       focus:shadow-[0_4px_20px_rgba(59,130,246,0.25)] transition-all duration-300
                       ${value ? "text-left" : "text-center"}
                       `}
                />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 flex items-center justify-center">
                    <Search className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
});

export default NavbarSearch;