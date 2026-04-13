import mongoose from "mongoose";


const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: [{ type: String }],
  thumbnail: String,
  // videoUrl: {type: String},
  pdfUrl: String,
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);
