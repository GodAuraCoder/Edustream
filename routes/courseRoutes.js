const express = require("express");
const router = express.Router();

const courseController = require("../controllers/courseController");
const {
  protect,
  clerkMiddleware,
  teacherOnly,
} = require("../middleware/authMiddleware");

/* ===========================
   PUBLIC ROUTES
=========================== */
router.get("/", courseController.getAllCourses);

// ⚠️ NEVER keep this as `/:id`
router.get("/:id", courseController.getCourseById);

/* ===========================
   PROTECTED ROUTES
=========================== */
router.use(protect, clerkMiddleware);

/* ===========================
   TEACHER ROUTES
=========================== */
router.post("/", teacherOnly, courseController.createCourse);
router.get("/stats", teacherOnly, courseController.getTeacherStats);
router.get(
  "/enrolled-students",
  teacherOnly,
  courseController.getEnrolledStudents
);
router.put("/:id", teacherOnly, courseController.updateCourse);
router.delete("/:id", teacherOnly, courseController.deleteCourse);

/* ===========================
   STUDENT ROUTES
=========================== */
router.post("/:id/enroll", courseController.enrollCourse);

module.exports = router;
