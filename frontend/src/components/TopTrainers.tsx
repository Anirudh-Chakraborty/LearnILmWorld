import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import trainer_profile from "../assets/trainer_profile.png";
import spanish from "../assets/Spanish_Trainer.png";
import german from "../assets/German_Trainer.jpeg";
import english from "../assets/English_Trainer.png";

import TrainerBackCard, { Trainer } from "../components/TrainerBackCard";
import { BookOpen, CheckCircle, Play, Star, User, Users } from "lucide-react";
import axios from "axios";


// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Moved types in TrainerBackCard.tsx component
/* small helper for rendering label */
type PickRole = "language" | "subject" | "other";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const top = [

      {
        _id: "69ca438681483defd20dcc68",
        name: "Srikrishna Baitmangalkar",
        role: "trainer",
        profile: {
          imageUrl: "trainers/profiles/1774877961235-my photo 2.jpeg",
          languages: ["Sanskrit"],
          subjects: [],
          hobbies: [],
          experience: 20,
          education: "M.A IN SANSKRIT",
          about: "Committed to integrating  Sanskrit into creative extra-curricular activities that spark curiosity and love for learning.- Passionate about helping young learners build language confidence while preserving and promoting Indian cultural heritage."
        },
        pickRole: "language",
      },

      {
        _id: "69c78acc38a980c2c07de752",
        name: "Antara Sarkar",
        role: "trainer",
        profile: {
          imageUrl: "trainers/profiles/1775029070247-Antara_Sarkar.jpg",
          languages: ["Bengali"],
          subjects: [],
          hobbies: [],
          experience: 5,
          education: "MA,B.ED",
          about: "I am an educator ,hailed from West Bengal. I have done my degrees from Visva-Bharati University by the great Nobel laureate Rabindranath Tagore. Teaching is for me like shaping minds for the better purpose."
        },
        pickRole: "language",
      },

      {
        _id: "69bbd950c946b4e2719ae022",
        name: "Poulami Paul",
        role: "trainer",
        profile: {
          imageUrl: 'trainers/profiles/1775795077182-1000145071.jpg',
          languages: ["Hindi"],
          subjects: [],
          hobbies: [],
          experience: 10,
          education: "M.ed",
          about: "Dedicated educator focused on simple and effective learning."
        },
        pickRole: "language",
      },


      {
        _id: "69c26e629871a287781c303f",
        name: "Shabana Saheed",
        role: "trainer",
        profile: {
          imageUrl: "trainers/profiles/1775737097395-WhatsApp Image 2026-04-09 at 5.44.48 PM.jpeg",
          subjects: [],
          languages: ["Hindi"],
          hobbies: [],
          experience: 12,
          education: "M.A, D.Ed",
          about: "I am passionate about teaching and I love helping people in gaining knowledge."
        },
        pickRole: "language",
      },
    ];

export default function TopTrainers(): JSX.Element {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  // keep mapping of trainerId -> pick role for rendering
  const [pickRoleMap, setPickRoleMap] = useState<Record<string, PickRole>>({});

  const [activeTrainer, setActiveTrainer] = useState<Trainer | null>(null);

  //Card flipping control
  const [hoveredTrainerId, setHoveredTrainerId] = useState<string | null>(null);


  useEffect(() => {
    

    setTrainers(top);

    // role map for badge + correct display
    const map: Record<string, "language" | "subject"> = {};
    top.forEach((t) => {
      map[t._id] = t.pickRole as "language" | "subject";
    });

    setPickRoleMap(map);
  }, []);

  const [resolvedImages, setResolvedImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchImages = async () => {
      const newResolvedImages: Record<string, string> = {};

      for (const trainer of top) {
        const key = trainer.profile.imageUrl;

        if (!key) {
          newResolvedImages[trainer._id] = "";
          continue;
        }

        // If it's already a full URL or base64, use it directly
        if (key.startsWith('http') || key.startsWith('blob:') || key.startsWith('data:')) {
          newResolvedImages[trainer._id] = key;
          continue;
        }
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/upload/get-download-url`, {
            fileKey: key
          });
          newResolvedImages[trainer._id] = data.signedUrl;
        } catch (err) {
          console.error(`Failed to fetch image for ${trainer.name}:`, err);
          newResolvedImages[trainer._id] = "";
        }
      }

      setResolvedImages(newResolvedImages);
    };

    fetchImages();
  }, []);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold text-[#1a56ad] text-center"
        >
          Meet Our Top Trainers
        </motion.h2>

        <p className="text-center text-lg md:text-xl text-[#2D274B] mt-4 max-w-2xl mx-auto">
          Highly rated & verified mentors across languages and subjects.
        </p>

        {/* Trainer Cards */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trainers.map((trainer, idx) => {
            const id = trainer._id;

            return (
              <div
                key={id ?? idx}
                onClick={() => setActiveTrainer(trainer)}
                className="flex flex-col h-[530px]  border-blue-100 border-2 rounded-[2rem] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-lg transition-all"
              >
                <div className="relative w-full h-[200px] rounded-2xl overflow-hidden mb-4 shrink-0 bg-gray-50">
                  <div className="absolute top-0 right-0 z-10">
                    <div className="bg-[#fcd574] text-[#1e293b] text-xs font-bold px-4 py-2 rounded-bl-xl shadow-sm">
                      Free Demo
                    </div>
                  </div>
                  <img
                    src={resolvedImages[trainer._id] ||trainer.profile?.imageUrl || trainer_profile}
                    alt={trainer.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                {/* Name & Badge */}
                <div className="flex items-center gap-1.5 mb-2 shrink-0">
                  <h3 className="text-[20px] font-bold text-[#1e293b] truncate">
                    {trainer.name}
                  </h3>
                  <CheckCircle className="text-blue-400 fill-white text-blue-400" size={20} />
                </div>

                {/* about */}
                {/* <p className="text-[10px] mt-2  text-gray-700 leading-relaxed overflow-y-auto no-scrollbar flex-1 ">
                  {trainer.profile?.about}
                </p> */}

                {/* Ratings & Experience */}
                <div className="flex items-center gap-3 mb-4 mt-4 shrink-0 text-[13px]">
                  <div className="flex items-center gap-1 font-bold text-gray-900">
                    <Star className="w-4 h-4 text-[#fbbf24] fill-current" />
                    4.9
                  </div>
                  <div className="font-bold text-gray-900">
                    {trainer.profile?.experience ?? 0}+ Years Exp.
                  </div>
                </div>

                {/* Tags Section*/}
                <div className="shrink-0 mb-5">
                  {/* Expertise */}
                  {trainer.profile?.languages && trainer.profile.languages.length > 0 && (
                    <div className="mb-2.5">
                      <p className="text-[15px] text-gray-500 mb-1.5">Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {trainer.profile.languages.slice(0, 2).map((lang, i) => (
                          <span
                            key={i}
                            className="bg-purple-50/50 border border-purple-100 text-[#7186ce] text-[14px] px-3 py-1 rounded-lg"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Class */}
                  {trainer.profile?.subjects && trainer.profile.subjects.length > 0 && (
                    <div>
                      <p className="text-[12px] text-gray-500 mb-1.5">Subject</p>
                      <div className="flex flex-wrap gap-2">
                        {trainer.profile.subjects.slice(0, 2).map((sub, i) => (
                          <span
                            key={i}
                            className="bg-purple-50/50 border border-purple-100 text-[#7186ce] text-[12px] px-3 py-1 rounded-lg"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  to={`/trainer-profile/${trainer._id}`}
                  className="mt-auto block w-full text-center bg-[#276dc9] text-white py-2.5 rounded-2xl text-[15px] font-semibold  transition-colors shrink-0"
                >
                  View Profile
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Buttons */}
        <div className="flex justify-center gap-6 mt-14 w-full max-w-xl mx-auto">
          
          <Link
                    to="/become-trainer"
                    className="
                    flex-1 flex items-center justify-center gap-2 h-[57px] bg-[#276dc9] text-white font-semibold rounded-xl shadow-md border border-white hover:bg-[#205eb0] transition text-lg hover:scale-105"
                  >
                    <User className="w-5 h-5 " />Become a Trainer
                  </Link>
          
          {/* More Trainers */}
          <Link
            to="/main"
            className="
            flex flex-1 gap-3 justify-center items-center  bg-white text-[#024AAC] font-bold rounded-2xl border-2 border-[#024AAC] shadow-md hover:bg-gray-50 hover:scale-105 transition-colors text-lg"
          >
            <Users className="w-5 h-5 fill-current stroke-0" />
            More Trainers
          </Link>

        </div>

      </div>

      {activeTrainer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
          onClick={() => setActiveTrainer(null)} // Bahar click karne pe modal band ho jayega
        >
          <div onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <TrainerBackCard
                trainer={activeTrainer}
                resolvedImageUrl={resolvedImages[activeTrainer._id]}
                displayList={
                  activeTrainer.profile?.languages?.length
                    ? activeTrainer.profile.languages
                    : activeTrainer.profile?.subjects ?? []
                }
                variant="modal"
              />
            </motion.div>
          </div>
        </div>
      )}
    </section>
  );

}
