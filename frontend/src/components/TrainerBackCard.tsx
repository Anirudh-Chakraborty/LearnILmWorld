import { Link } from "react-router-dom";
import trainer_profile from "../assets/trainer_profile.png";
import axios from "axios";
import { useEffect } from "react";

/* -------------------------
   Types
------------------------- */

export interface Profile {
    imageUrl?: string;
    experience?: number;
    education?: string;
    subjects?: string[];
    languages?: string[];
    averageRating?: number;
    about?: string;
}

export interface Trainer {
    _id: string;
    name?: string;
    role?: string;
    profile?: Profile;
}

/* -------------------------
   Props
------------------------- */

interface TrainerBackCardProps {
    trainer: Trainer;
    displayList: string[];
    variant?: "grid" | "modal";
    className?: string;
    resolvedImageUrl?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function TrainerBackCard({
    trainer,
    displayList,
    variant = "grid",
    className = "",
    resolvedImageUrl,
}: TrainerBackCardProps) {
    const isModal = variant === "modal";
    const displayImage = resolvedImageUrl || trainer.profile?.imageUrl || trainer_profile;


    return (
        <div
            className={`
        bg-white text-[#2D274B]
        rounded-3xl
        shadow-2xl
        overflow-hidden
        ${isModal ? "w-[660px] max-w-[92vw]" : "h-[420px]"}
        ${className}
      `}
        >
            {/* HEADER */}
            <div className="relative h-[140px] bg-gradient-to-r from-[#276dc9] to-[#205eb0]">
                <Link
                    to={`/trainer-profile/${trainer._id}`}
                    className="absolute top-4 right-4 bg-yellow-400 text-black text-xs font-semibold px-3 py-1 rounded-full hover:bg-yellow-300 transition"
                >
                    Free Demo
                </Link>
            </div>

            {/* BODY */}
            <div
                className={`
          relative px-6 pb-6 
          ${isModal ? "pt-6 flex gap-6 items-start" : "-mt-10"}
        `}
            >
                {/* AVATAR + BASIC INFO */}
                <div className={`${isModal ? "w-[160px] shrink-0" : "text-center"}`}>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md bg-white mx-auto">
                        <img
                            src={displayImage}
                            alt={trainer.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <h3 className={`mt-4 text-lg font-bold ${isModal ? "" : "text-center"}`}>
                        {trainer.name}
                    </h3>

                    <div
                        className={`mt-1 text-sm text-gray-600 ${isModal ? "" : "flex justify-center"
                            }`}
                    >
                        <span className="font-semibold text-[#276dc9]">
                            ⭐ {trainer.profile?.averageRating ?? "4.9"}
                        </span>
                        <span className="ml-1">
                            • {trainer.profile?.experience ?? 0} yrs
                        </span>
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div className="flex-1">
                    {/* ABOUT */}
                    <div
                        className={`
              mt-2 text-sm text-gray-600 leading-relaxed
              ${isModal ? "h-[110px]" : "h-[90px] text-center"}
              overflow-y-auto no-scrollbar
            `}
                    >
                        {trainer.profile?.about ??
                            "Native speaker with PhD-level expertise, specialized in professional and academic preparation."}
                    </div>

                    {/* TAGS */}
                    <div
                        className={`
    flex items-center gap-2 mt-4
    ${isModal ? "flex-wrap" : "justify-center"}
  `}
                    >
                        {(isModal ? displayList : displayList.slice(0, 2)).map((item) => (
                            <span
                                key={item}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap"
                            >
                                {item}
                            </span>
                        ))}

                        {/* +X indicator (GRID ONLY) */}
                        {!isModal && displayList.length > 2 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 whitespace-nowrap">
                                +{displayList.length - 2}
                            </span>
                        )}
                    </div>


                    {/* CTA (MODAL ONLY) */}
                    {isModal && (
                        <Link
                            to={`/trainer-profile/${trainer._id}`}
                            className="mt-6 block w-full text-center bg-[#276dc9] text-white py-3 rounded-xl font-semibold hover:bg-[#205eb0] transition"
                        >
                            View Profile
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
