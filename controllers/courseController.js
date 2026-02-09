const Course = require("../models/Course");
const User = require("../models/User");

/* ===========================
   1. CREATE COURSE
=========================== */
exports.createCourse = async (req, res) => {
  try {
    const { title, description, price, thumbnail, category, modules } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newCourse = await Course.create({
      title,
      description,
      price: Number(price),
      thumbnail,
      category,
      lessons: modules,
      teacher: req.user.id, // Clerk ID (string)
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

/* ===========================
   2. GET ALL COURSES (PUBLIC)
=========================== */
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   3. GET COURSE BY ID
=========================== */
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ message: "Invalid Course ID" });
  }
};

/* ===========================
   4. INSTRUCTOR STATS
=========================== */
exports.getTeacherStats = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const teacherId = req.user.id; 
    const courses = await Course.find({ teacher: teacherId });

    if (!courses || courses.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: { totalCourses: 0, totalStudents: 0, totalRevenue: 0 } 
      });
    }

    let totalStudents = 0;
    let totalRevenue = 0;

    courses.forEach(course => {
      if (course && Array.isArray(course.enrolledStudents)) {
        totalStudents += course.enrolledStudents.length;
        course.enrolledStudents.forEach(enrollment => {
          totalRevenue += (enrollment.amountPaid || 0);
        });
      }
    });

    res.status(200).json({
      success: true,
      data: { totalCourses: courses.length, totalStudents, totalRevenue }
    });
  } catch (err) {
    console.error("STATS CRASH:", err.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/* ===========================
    5. ENROLL IN COURSE (Final Validation Fix)
=========================== */
exports.enrollCourse = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Missing credentials" });
    }

    const courseId = req.params.id;
    const studentId = req.user.id; 

    // 1. Find the Course First
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // 2. Auto-Sync/Find Student
    let student = await User.findOne({ clerkId: studentId });

    if (!student) {
      console.log("Syncing new user...");
      student = await User.create({
        _id: studentId,
        clerkId: studentId,
        email: `user_${studentId.slice(-5)}@edustream.com`,
        name: "EduStream Student",
        enrolledCourses: []
      });
    }

    if (student.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: "Already enrolled" });
    }

    // 3. Update Student document
    await User.findByIdAndUpdate(studentId, {
      $push: { enrolledCourses: courseId }
    });

    // 4. THE CRITICAL FIX: Update Course using findByIdAndUpdate 
    // This bypasses the "teacher path is required" validation error
    await Course.findByIdAndUpdate(courseId, {
      $push: {
        enrolledStudents: {
          studentId: studentId,
          amountPaid: course.price,
          userRef: studentId // Using the String ID as per your schema
        }
      }
    });

    res.status(200).json({ success: true, message: "Enrollment successful 🎓" });
  } catch (error) {
    console.error("FINAL ENROLL ERROR:", error.message);
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   6. UPDATE/DELETE/OTHER (UNCHANGED)
=========================== */
exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!updatedCourse) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ success: true, data: updatedCourse });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
    if (!course) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id });
    res.status(200).json({ success: true, data: courses });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getEnrolledStudents = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id }).populate({
      path: "enrolledStudents.userRef",
      select: "name email",
    });
    const students = [];
    courses.forEach(c => {
      c.enrolledStudents.forEach(s => {
        students.push({ id: s.studentId, course: c.title });
      });
    });
    res.status(200).json({ success: true, data: students });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

/* ===========================
   7. DELETE COURSE
=========================== */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findOneAndDelete({
      _id: id,
      teacher: req.user.id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Unauthorized or course not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   8. INSTRUCTOR COURSES
=========================== */
exports.getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   9. ENROLLED STUDENTS (SAFE + POPULATE)
=========================== */
exports.getEnrolledStudents = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id }).populate({
      path: "enrolledStudents",
      select: "name email",
    });

    const students = [];
    courses.forEach(course => {
      course.enrolledStudents.forEach(student => {
        students.push({
          id: student._id,
          name: student.name,
          email: student.email,
          courseTitle: course.title,
        });
      });
    });

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ===========================
   10. Handle Payouts (Example Endpoint)
=========================== */
const handlePurchase = async () => {
  setIsProcessing(true);
  try {
    const token = await getToken();
    
    // FIXED: Moved ${id} before /enroll to match your CourseRoutes.js
    await API.post(`/courses/${id}/enroll`, 
      { amountPaid: course.price }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setIsEnrolled(true);
    alert("Purchase Successful! Welcome to the course. 🎓");
  } catch (err) {
    console.error("Enrollment error details:", err.response?.data || err.message);
    alert("Enrollment failed. Please check the console for details.");
  } finally {
    setIsProcessing(false);
  }
};