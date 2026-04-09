import express from "express";
import Course from "../../models/Course.js";

const router = express.Router();

//CREATE course (Admin)
router.post("/", async (req, res) => {
  try {
    const { title, description, thumbnail, pdfUrl } = req.body;

    if (!title || !thumbnail || !pdfUrl) {
      return res.status(400).json({
        message: "Title, thumbnail, and PDF are required",
      });
    }

    const course = new Course({
      title,
      description: Array.isArray(description) ? description : [],
      thumbnail, 
      pdfUrl,
    });

    const savedCourse = await course.save();
    res.status(201).json(savedCourse);
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ message: "Course creation failed" });
  }
});

// UPDATE course
router.put("/:id", async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update course" });
  }
});

//DELETE course
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course" });
  }
});

// GET all courses (Admin)
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 })
    res.json(courses)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" })
  }
})


export default router;
