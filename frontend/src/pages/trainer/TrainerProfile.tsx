// src/pages/trainer/TrainerProfile.tsx
import { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "../../contexts/AuthContext";
import ReactFlagsSelect from "react-flags-select";
import axios from "axios";

import SecurityTab from '../student/SecurityTab';

import TrainerTabs from "./components/NavBarForTrainerProfile";
import { Instagram, Youtube, Linkedin, Video } from "lucide-react";


//  commented out trainers hourly rate

// const FRONTEND_URL= import.meta.env.VITE_FRONTEND_URL;
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/* ---------- TrainerProfile (form) ---------- */
const TrainerProfile = () => {
  const { user, updateProfile } = useAuth();
  const CURRENT_YEAR = new Date().getFullYear();
  const [originalCertKeys, setOriginalCertKeys] = useState<string[]>([]);
  const [certPreviews, setCertPreviews] = useState<Record<number, string>>({});

  const defaultProfile = {
    bio: user?.profile?.bio || "",
    imageUrl: user?.profile?.imageUrl || "",
    avatar: user?.profile?.avatar || "",
    languages: Array.isArray(user?.profile?.languages)
      ? [...user.profile.languages]
      : [],
    trainerLanguages: Array.isArray(user?.profile?.trainerLanguages)
      ? [...user.profile.trainerLanguages]
      : [],
    hobbies: Array.isArray(user?.profile?.hobbies)
      ? [...user.profile.hobbies]
      : [],
    experience: user?.profile?.experience ?? 0,
    nationalityCode: user?.profile?.nationalityCode || "",
    standards: Array.isArray(user?.profile?.standards)
      ? [...user.profile.standards]
      : [],
    hourlyRate: user?.profile?.hourlyRate ?? 25,
    // pricing: user?.profile?.pricing || { min30: 25, min60: 45, min90: 65 },
    phone: user?.profile?.phone || "",
    location: user?.profile?.location || "",
    timezone: user?.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    specializations: Array.isArray(user?.profile?.specializations)
      ? [...user.profile.specializations]
      : [],
    certifications: Array.isArray(user?.profile?.certifications)
      ? user.profile.certifications.map((cert: any) => ({
        name: cert.name || "",
        issuer: cert.issuer || "",
        year: cert.year || null,
        certificateImage: cert.certificateImage || "",
        certificateLink: cert.certificateLink || "",
      }))
      : [],
    availability: Array.isArray(user?.profile?.availability)
      ? [...user.profile.availability]
      : [],
    profileImages: Array.isArray(user?.profile?.profileImages)
      ? [...user.profile.profileImages]
      : [],
    socialMedia: {
      instagram:
        (user?.profile?.socialMedia &&
          (user.profile.socialMedia.get
            ? user.profile.socialMedia.get("instagram")
            : user.profile.socialMedia.instagram)) ||
        "",
      youtube:
        (user?.profile?.socialMedia &&
          (user.profile.socialMedia.get
            ? user.profile.socialMedia.get("youtube")
            : user.profile.socialMedia.youtube)) ||
        "",
      linkedin:
        (user?.profile?.socialMedia &&
          (user.profile.socialMedia.get
            ? user.profile.socialMedia.get("linkedin")
            : user.profile.socialMedia.linkedin)) ||
        "",
    },
    teachingStyle: user?.profile?.teachingStyle || "Conversational",
    studentAge: Array.isArray(user?.profile?.studentAge)
      ? [...user.profile.studentAge]
      : [],
    demoVideo: user?.profile?.demoVideo || "",
    isAvailable: user?.profile?.isAvailable ?? true,
    totalBookings: user?.profile?.totalBookings ?? 0,
    averageRating: user?.profile?.averageRating ?? 5.0,
  };

  type ProfileType = typeof defaultProfile;

  const certFields = [
    { key: "name", type: "text", placeholder: "Certification Name" },
    { key: "issuer", type: "text", placeholder: "Issuer" },
    {
      key: "year", type: "number", placeholder: "Year",
      min: 1950, max: CURRENT_YEAR,
    },
    {
      key: "certificateLink", type: "url",
      placeholder: "https://certificate-link.com",
    },
  ];

  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    profile: ProfileType;
  }>({
    name: user?.name || "",
    email: user?.email || "",
    profile: defaultProfile,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newSpecialization, setNewSpecialization] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [previewLink, setPreviewLink] = useState<string>(""); //for preview of the image
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); //for viewing the image without upload
  const [originalImageKey, setOriginalImageKey] = useState<string>("");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [newStandard, setNewStandard] = useState("");

  // Availability useeffect
  useEffect(() => {
    // ensure availability has 7 days (preserve existing)
    const ALL_DAYS = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const existing = (formData.profile.availability || []).reduce((acc, a) => {
      if (a && a.day) acc[a.day] = a;
      return acc;
    }, {});
    const availability = ALL_DAYS.map(
      (d) =>
        existing[d] || {
          day: d,
          startTime: null,
          endTime: null,
          available: false,
        },
    );
    if ((formData.profile.availability || []).length < 7) {
      setFormData((prev) => ({
        ...prev,
        profile: { ...prev.profile, availability },
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- Generic handlers --- */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    // Checkbox handler
    if (type === "checkbox") {
      const isChecked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: isChecked }));
      return;
    }

    // Social media: profile.socialMedia.youtube, .linkedin, etc.
    if (name.startsWith("profile.socialMedia.")) {
      const key = name.split(".")[2];
      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          socialMedia: {
            ...prev.profile.socialMedia,
            [key]: value,
          },
        },
      }));
      return;
    }

    // Other profile fields
    if (name.startsWith("profile.")) {
      const key = name.replace("profile.", "");
      const parsed =
        key === "experience" || key === "hourlyRate"
          ? parseFloat(value) || 0
          : value;

      setFormData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [key]: parsed,
        },
      }));
      return;
    }

    // Top-level fields (name, email)
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addToArray = (field: keyof typeof defaultProfile, value: any) => {
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: [...(prev.profile[field] || []), value],
      },
    }));
  };
  const removeFromArray = (
    field: keyof typeof defaultProfile,
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: (prev.profile[field] || []).filter(
          (_: any, i: number) => i !== index,
        ),
      },
    }));
  };

  const updateObjectInArray = (
    field: keyof typeof defaultProfile,
    index: number,
    subfield: string,
    value: any,
  ) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev.profile[field])
        ? [...prev.profile[field]]
        : [];
      arr[index] = { ...arr[index], [subfield]: value };
      return { ...prev, profile: { ...prev.profile, [field]: arr } };
    });
  };

  const addComplexToArray = (field: keyof typeof defaultProfile, obj: any) => {
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: [...(prev.profile[field] || []), obj],
      },
    }));
  };

  const updateTrainerLangLevels = (index: number, value: string) => {
    const levels = String(value)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateObjectInArray("trainerLanguages", index, "teachingLevel", levels);
  };

  const updateAvailability = (index: number, subfield: string, value: any) => {
    setFormData((prev) => {
      const arr = Array.isArray(prev.profile.availability)
        ? [...prev.profile.availability]
        : [];
      arr[index] = { ...arr[index], [subfield]: value };
      // if available turned off, clear times
      if (subfield === "available" && !value) {
        arr[index].startTime = null;
        arr[index].endTime = null;
      }
      return { ...prev, profile: { ...prev.profile, availability: arr } };
    });
  };

  useEffect(() => {
    if (user?.profile) {

      // Capture original certification keys
      if (user.profile.certifications) {
        const keys = user.profile.certifications
          .map((c: any) => c.certificateImage)
          .filter((k: string) => k && !k.startsWith("http"));
        setOriginalCertKeys(keys);
      }
      // Capture the Original Profile Image Key
      const dbImage = user.profile.imageUrl;
      if (dbImage && !dbImage.startsWith("blob:") && !dbImage.startsWith("data:")) {
        setOriginalImageKey(dbImage);
      }

      // If your form is empty but user data exists, sync the form
      if (formData.email === "" && user.email) {
        setFormData(prev => ({
          ...prev,
          name: user.name || "",
          email: user.email || "",
          profile: { ...prev.profile, ...user.profile }
        }));
      }
    }
  }, [user]);
  // for certificate useffect
  useEffect(() => {
    const loadCertPreviews = async () => {
      const previews: Record<number, string> = {};

      await Promise.all(
        (formData.profile.certifications || []).map(async (cert: any, i: number) => {
          if (
            typeof cert.certificateImage === "string" &&
            cert.certificateImage &&
            !cert.certificateImage.startsWith("http")
          ) {
            try {
              const { data } = await axios.post(
                `${API_BASE_URL}/api/upload/get-download-url`,
                { fileKey: cert.certificateImage }
              );
              previews[i] = data.signedUrl;
            } catch {
              previews[i] = "";
            }
          }
        })
      );

      setCertPreviews(previews);
    };

    loadCertPreviews();
  }, [formData.profile.certifications]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImageFile(file);
    const localPreviewUrl = URL.createObjectURL(file);

    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        imageUrl: localPreviewUrl,
      },
    }));
  };
  //for the image as when someone upload the image it loads
  useEffect(() => {
    const getPreview = async () => {
      const currentImage = formData.profile.imageUrl;

      if (!currentImage) {
        setPreviewLink("");
        return;
      }
      if (
        currentImage.startsWith("blob:") ||
        currentImage.startsWith("data:")
      ) {
        setPreviewLink(currentImage);
        return;
      }
      if (!currentImage.startsWith("http")) {
        try {
          const { data } = await axios.post(
            `${API_BASE_URL}/api/upload/get-download-url`,
            {
              fileKey: currentImage,
            },
          );
          setPreviewLink(data.signedUrl);
        } catch (err) {
          console.error("Preview failed", err);
        }
      } else {
        setPreviewLink(currentImage);
      }
    };

    getPreview();
  }, [formData.profile.imageUrl]);

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setFormData((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        imageUrl: "",
      },
    }));
    setPreviewLink("");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const badCert = (formData.profile.certifications || []).some((c: any) => c.year && (c.year < 1950 || c.year > CURRENT_YEAR))
    if (badCert) {
      setError(`Certification year must be between 1950 and ${CURRENT_YEAR}`)
      setLoading(false); return
    }

    try {
      if (!user) { setError('User not found'); setLoading(false); return; }

      // UPLOAD NEW IMAGE 
      let finalImageKey = formData.profile.imageUrl;
      //check that's the link is new https image
      const isNewHttpLink = finalImageKey.startsWith("http") && finalImageKey !== originalImageKey;

      //this is when someone set the image url
      if (finalImageKey.startsWith("data:") || isNewHttpLink) {
        try {
          const res = await fetch(finalImageKey);
          if (!res.ok) throw new Error("Network response was not ok");
          const blob = await res.blob();
          const fileType = blob.type || "image/jpeg";
          const fileName = `pasted-image-${Date.now()}.jpg`;

          // 1. Get Upload URL
          const { data } = await axios.post(`${API_BASE_URL}/api/upload/get-upload-url`, {
            fileName,
            fileType,
          });

          // Upload to R2
          await fetch(data.uploadUrl, {
            method: 'PUT',
            body: blob,
            headers: { 'Content-Type': fileType },
          });

          // Update the key to the R2 path
          finalImageKey = data.key;

        } catch (err) {
          setError("Failed to upload the pasted image.");
          setLoading(false);
          return;
        }
      } else if (selectedImageFile) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/upload/get-upload-url`, {
            fileName: selectedImageFile.name,
            fileType: selectedImageFile.type,
          });

          await fetch(data.uploadUrl, {
            method: 'PUT',
            body: selectedImageFile,
            headers: { 'Content-Type': selectedImageFile.type },
          });

          finalImageKey = data.key;
        } catch (uploadErr) {
          setError("Failed to upload image.");
          setLoading(false);
          return;
        }
      }

      // --- HANDLE CERTIFICATE UPLOADS ---
      const updatedCerts = [];

      for (const cert of formData.profile.certifications || []) {
        let imageKey = cert.certificateImage;

        // If new file selected
        if (cert.certificateImage instanceof File) {
          try {
            const { data } = await axios.post(
              `${API_BASE_URL}/api/upload/get-upload-url`,
              {
                fileName: cert.certificateImage.name,
                fileType: cert.certificateImage.type,
                folderMain: "trainers",
                folderSub: "certificates",
              }
            );

            await fetch(data.uploadUrl, {
              method: "PUT",
              body: cert.certificateImage,
              headers: { "Content-Type": cert.certificateImage.type },
            });

            imageKey = data.key;
          } catch (err) {
            setError("Failed to upload certificate image.");
            setLoading(false);
            return;
          }
        }

        updatedCerts.push({
          ...cert,
          certificateImage: imageKey,
        });
      }

      const updatedProfile = {
        ...user.profile,
        ...formData.profile,
        imageUrl: finalImageKey,
        certifications: updatedCerts,
      };

      const result = await updateProfile({
        name: formData.name,
        profile: updatedProfile
      });

      // DELETE OLD IMAGE
      if (result?.success) {
        setSuccess('Profile updated successfully!');

        // Check if we actually have an OLD key to delete
        if (originalImageKey) {

          // Check if the image has CHANGED
          if (originalImageKey !== finalImageKey) {

            // Check if the OLD image is an R2 file (not a website link)
            const isR2File = !originalImageKey.startsWith("http") && !originalImageKey.startsWith("https");

            if (isR2File) {
              console.log("Condition Met: Deleting R2 file...", originalImageKey);
              try {
                await axios.delete(`${API_BASE_URL}/api/upload/delete-file`, {
                  data: { fileKey: originalImageKey }
                });
                console.log("Old R2 file deleted!");
              } catch (delErr) {
                console.error("Delete failed", delErr);
              }
            } else {
              console.log("Skipping Delete: Old image was a public URL (Google/Brave), not an R2 file.");
            }
          } else {
            console.log("Skipping Delete: Image did not change.");
          }
        } else {
          console.log("Skipping Delete: No original image was found on load.");
        }

        // DELETE REMOVED CERTIFICATES
        const currentKeys = updatedCerts
          .map((c: any) => c.certificateImage)
          .filter((k: string) => k);

        for (const oldKey of originalCertKeys) {
          if (!currentKeys.includes(oldKey)) {
            try {
              await axios.delete(`${API_BASE_URL}/api/upload/delete-file`, {
                data: { fileKey: oldKey },
              });
              console.log("Deleted old certificate:", oldKey);
            } catch (err) {
              console.error("Failed to delete old certificate", err);
            }
          }
        }

        setOriginalCertKeys(currentKeys);

        setOriginalImageKey(finalImageKey);
        setSelectedImageFile(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  const [activeTab, setActiveTab] = useState("basic");
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  

  return (
    <div className="space-y-8">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
      
          {/* Top Section */}
          <div className="flex items-center gap-4">

            {/* Profile Image */}
            <div className="relative w-20 h-20">
              <div className="w-20 h-20 rounded-full overflow-hidden border">
                {previewLink ? (
                  <img
                    src={previewLink}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>

              {/* Camera Icon */}
              <button
                type="button"
                onClick={() => setShowPhotoEditor(!showPhotoEditor)}
                className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center 
                          bg-gray-100 hover:bg-gray-200 border border-white 
                          rounded-full shadow-sm transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-gray-600"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 3L7.17 5H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2h-3.17L15 3H9zm3 14a4 4 0 110-8 4 4 0 010 8z" />
                </svg>
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.name || "Your Name"}
              </h3>

              
              <div className="flex gap-2 mt-1">
                {formData.profile.languages.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {formData.profile.languages}
                </span>
                )}

                {formData.profile.specializations.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  {formData.profile.specializations}
                </span>
                )}
              </div>


              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 flex-wrap">
                <span>
                  <span className="font-semibold text-gray-800">
                    {formData.profile.experience}
                  </span>{" "}
                  years of experience
                </span>

                <span>•</span>

                {/* Location with Icon */}
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 text-gray-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
                  </svg>
                  {formData.profile.location}
                </span>
              </div>
            </div>
          </div>

          {/* 🔥 Photo Editor Panel (Appears on Click) */}
          {showPhotoEditor && (
            <div className="mt-6 flex items-center gap-4 bg-gray-50 p-4 rounded-xl border">

              {/* Small Preview */}
              <div className="w-14 h-14 rounded-full overflow-hidden border">
                {previewLink ? (
                  <img
                    src={previewLink}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    👤
                  </div>
                )}
              </div>

              {/* Input */}
              <input
                type="url"
                name="profile.imageUrl"
                value={formData.profile.imageUrl}
                onChange={(e) => {
                  handleChange(e);
                  setSelectedImageFile(null);
                }}
                placeholder="Enter Image URL"
                className="flex-1 px-4 py-2 border rounded-lg"
              />

              {/* Upload Button */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="px-4 py-2 bg-gray-200 rounded-lg text-sm">
                  Update Photo
                </span>
              </label>

              {/* Remove */}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm"
              >
                Remove
              </button>

              {/* Done */}
              <button
                type="button"
                onClick={() => setShowPhotoEditor(false)}
                className="text-blue-600 text-sm underline"
              >
                Done
              </button>
            </div>
          )}

          
        </div>
        
        <TrainerTabs activeTab={activeTab} setActiveTab={setActiveTab} />

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

        <div className="bg-white rounded-xl border p-6 shadow-sm">

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
        
            {activeTab === "basic" && (
              <div>
                
                {/* Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Basic Information
                  </h3>
                </div>

                {/* Form Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Full Names
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field focus:ring-2 focus:ring-blue-500 transition"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      className="input-field bg-gray-100 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      name="profile.phone"
                      value={formData.profile.phone}
                      onChange={handleChange}
                      className="input-field focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Nationality */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Nationality
                    </label>

                    <ReactFlagsSelect
                      selected={formData.profile.nationalityCode}
                      onSelect={(code) =>
                        setFormData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, nationalityCode: code },
                        }))
                      }
                      searchable
                      className="w-full"
                      selectButtonClassName="input-field flex items-center justify-between"
                      placeholder="Select Nationality"
                    />
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Location
                    </label>
                    <input
                      name="profile.location"
                      value={formData.profile.location}
                      onChange={handleChange}
                      className="input-field focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="City, Country"
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Timezone
                  </label>
                  <select
                    name="profile.timezone"
                    value={formData.profile.timezone}
                    onChange={handleChange}
                    className="input-field focus:ring-2 focus:ring-blue-500 transition"
                  >
                    {(Intl as any)
                      .supportedValuesOf("timeZone")
                      .map((tz: string) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Bio */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Bio
                  </label>
                  <textarea
                    name="profile.bio"
                    value={formData.profile.bio}
                    onChange={handleChange}
                    className="input-field focus:ring-2 focus:ring-blue-500 transition"
                    rows={4}
                    placeholder="Tell students about yourself..."
                  />
                </div>

              </div>
            )}


            {/* Teaching Info */}
            {activeTab === "teaching" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Teaching Information
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="profile.experience"
                      value={formData.profile.experience}
                      onChange={handleChange}
                      className="input-field"
                      min={0}
                      step={0.5}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teaching Style
                    </label>
                    <select
                      name="profile.teachingStyle"
                      value={formData.profile.teachingStyle}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option>Conversational</option>
                      <option>Grammar-focused</option>
                      <option>Immersive</option>
                      <option>Business-oriented</option>
                      <option>Exam Preparation</option>
                    </select>
                  </div>

                  {/*<div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Is Available for New Bookings
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="profile.isAvailable"
                        checked={!!formData.profile.isAvailable}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              isAvailable: e.target.checked,
                            },
                          }))
                        }
                      />
                      <span>Yes</span>
                    </label>
                  </div> */}
                </div>

                {/* Languages */}
                {formData.profile.languages.length !== 0 && (
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Languages
                    </label>

                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                      {(formData.profile.languages || []).map((lang, idx) => (
                        <span
                          key={idx}
                          className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                        >
                          {lang}
                          
                        </span>
                      ))}

                      
                      
                    </div>
                  </div>
                )}

                {/* Hobbies */}
                {formData.profile.hobbies.length !== 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hobbies
                  </label>

                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {(formData.profile.hobbies || []).map((hobby, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {hobby}
                      </span>
                    ))}
                    
                  </div>
                </div>
                )}

                {/* Specializations / Subjects */}
                {formData.profile.specializations.length !== 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Specializations
                  </label>

                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {(formData.profile.specializations || []).map((spec, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {spec}
                        
                      </span>
                    ))}

                    
                  </div>
                </div>
                )}

                {/* Standards */}
                {formData.profile.standards.length !== 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Standards / Grades Taught
                  </label>

                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {(formData.profile.standards || []).map((std, idx) => (
                      <span
                        key={idx}
                        className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        {std}
                        
                      </span>
                    ))}

                    
                  </div>
                </div>
                )}

                
              </div>
            )}


            {/* Availability */}
            {activeTab === "availability" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Weekly Availability
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Set your availability for each day of the week
                </p>

                <div className="space-y-4">
                  {(formData.profile.availability || []).map((av, idx) => (
                    <div
                      key={String(av.day || idx)}
                      className="flex items-center justify-between bg-gray-100 px-4 py-3 rounded-xl"
                    >
                      {/* Left Section (Day + Toggle) */}
                      <div className="flex items-center gap-4 w-1/3">
                        <span className="font-medium text-gray-700 capitalize w-24">
                          {av.day}
                        </span>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!av.available}
                            onChange={(e) =>
                              updateAvailability(idx, "available", e.target.checked)
                            }
                            className="sr-only peer"
                          />

                          {/* Toggle Switch */}
                          <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 transition-all"></div>
                          <div className="absolute left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                        </label>

                        <span
                          className={`text-sm ${
                            av.available ? "text-blue-600" : "text-gray-400"
                          }`}
                        >
                          {av.available ? "Available" : "Not Available"}
                        </span>
                      </div>

                      {/* Right Section (Time Inputs) */}
                      {av.available && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">From</span>
                          <input
                            type="time"
                            value={av.startTime || ""}
                            onChange={(e) =>
                              updateAvailability(idx, "startTime", e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />

                          <span className="text-gray-400">—</span>

                          <span className="text-sm text-gray-500">To</span>
                          <input
                            type="time"
                            value={av.endTime || ""}
                            onChange={(e) =>
                              updateAvailability(idx, "endTime", e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Certifications */}
            {activeTab === "certifications" && (
              <div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Certifications & Qualificationss
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add your teaching certifications and qualifications
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      addComplexToArray("certifications", {
                        name: "",
                        issuer: "",
                        year: null,
                        certificateImage: "",
                        certificateLink: "",
                      })
                    }
                    className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    + Add Certification
                  </button>
                </div>

                {/* Certification Cards */}
                <div className="space-y-4">
                  {(formData?.profile?.certifications ?? []).map(
                    (cert: any, idx: number) => {
                      return (
                        <div
                          key={idx}
                          className="border border-gray-200 rounded-xl p-4 bg-gray-50"
                        >
                          {/* Top Section */}
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {cert?.name || "Certification Name"}
                              </h4>

                              <div className="flex gap-10 mt-2 text-sm text-gray-600">
                                <div>
                                  <p className="text-xs text-gray-400">Issuer</p>
                                  <p>{cert?.issuer || "-"}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-gray-400">Year</p>
                                  <p>{cert?.year || "-"}</p>
                                </div>
                              </div>

                              {cert?.certificateLink && (
                                <a
                                  href={cert.certificateLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 text-sm mt-2 inline-block"
                                >
                                  View Certificate →
                                </a>
                              )}
                            </div>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => removeFromArray("certifications", idx)}
                              className="text-red-500 hover:text-red-600"
                            >
                              🗑
                            </button>
                          </div>

                          {/* Divider */}
                          <div className="border-t my-4"></div>

                          {/* Inputs */}
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <input
                              type="text"
                              placeholder="Certification Name"
                              value={cert?.name || ""}
                              onChange={(e) =>
                                updateObjectInArray(
                                  "certifications",
                                  idx,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="input-field"
                            />

                            <input
                              type="text"
                              placeholder="Issuer"
                              value={cert?.issuer || ""}
                              onChange={(e) =>
                                updateObjectInArray(
                                  "certifications",
                                  idx,
                                  "issuer",
                                  e.target.value
                                )
                              }
                              className="input-field"
                            />

                            <input
                              type="number"
                              placeholder="Year"
                              value={cert?.year || ""}
                              onChange={(e) =>
                                updateObjectInArray(
                                  "certifications",
                                  idx,
                                  "year",
                                  parseInt(e.target.value, 10) || null
                                )
                              }
                              className="input-field"
                            />

                            <input
                              type="url"
                              placeholder="Certificate Link (optional)"
                              value={cert?.certificateLink || ""}
                              onChange={(e) =>
                                updateObjectInArray(
                                  "certifications",
                                  idx,
                                  "certificateLink",
                                  e.target.value
                                )
                              }
                              className="input-field"
                            />
                          </div>

                          {/* Upload */}
                          <div>
                            <label className="text-sm text-gray-600 block mb-1">
                              Upload Certificate Image
                            </label>

                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                updateObjectInArray(
                                  "certifications",
                                  idx,
                                  "certificateImage",
                                  file
                                );
                              }}
                              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
                            />

                            {/* Preview */}
                            {cert?.certificateImage && (
                              <img
                                src={
                                  cert.certificateImage instanceof File
                                    ? URL.createObjectURL(cert.certificateImage)
                                    : certPreviews?.[idx] || ""
                                }
                                alt="Cert"
                                className="w-32 h-32 mt-3 object-cover rounded-lg border"
                              />
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}


            {/* Media & Social */}
            {activeTab === "media" && (
              <div>
                
                {/* Header */}
                <h3 className="text-xl font-bold text-gray-900">
                  Media & Social Links
                </h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Add your demo video and social media links to showcase your teaching style
                </p>

                <div className="space-y-5">

                  {/* Demo Video */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                      <Youtube size={16} className="text-red-500" />
                      Demo Video URL (YouTube)
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      Add a video introducing yourself and your teaching style
                    </p>
                    <input
                      type="url"
                      name="profile.demoVideo"
                      value={formData.profile.demoVideo}
                      onChange={handleChange}
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                      <Instagram size={16} className="text-pink-500" />
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      name="profile.socialMedia.instagram"
                      value={formData.profile.socialMedia.instagram}
                      onChange={handleChange}
                      placeholder="https://instagram.com/username"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                      <Linkedin size={16} className="text-blue-600" />
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      name="profile.socialMedia.linkedin"
                      value={formData.profile.socialMedia.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>

                  {/* YouTube Channel */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                      <Youtube size={16} className="text-red-500" />
                      YouTube Channel URL
                    </label>
                    <input
                      type="url"
                      name="profile.socialMedia.youtube"
                      value={formData.profile.socialMedia.youtube}
                      onChange={handleChange}
                      placeholder="https://youtube.com/@channel"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>

                  {/* Website */}
                  {/* <div>
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                      <Globe size={16} className="text-gray-500" />
                      Website / Portfolio (Optional)
                    </label>
                    <input
                      type="url"
                      name="profile.website"
                      value={formData.profile.website}
                      onChange={handleChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-gray-500 outline-none"
                    />
                  </div> */}

                  {/* Preview Tip Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
                    <p className="text-blue-700 font-medium mb-1">💡 Preview Tip</p>
                    <p className="text-blue-600 text-xs">
                      Students will be able to view your demo video and follow your social
                      media accounts from your public profile
                    </p>
                  </div>

                </div>
              </div>
            )}

            

            {/*Submit/ Update Profile & Loading  */}
            {activeTab !== 'security' && (
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: user?.name || "",
                    email: user?.email || "",
                    profile: defaultProfile,
                  });
                  setSuccess("");
                  setError("");
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
            )}
          </form>
          

          {/* Security (password change) */}
            {activeTab === 'security' && (
            <SecurityTab />
            )}
          
        </div>
        
      
    </div>
  );
};

export default TrainerProfile;
