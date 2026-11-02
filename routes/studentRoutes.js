const express = require('express');
const router = express.Router();
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getDashboardStats,
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

// Protect all student routes below with session authentication
router.use(protect);

// Dashboard Statistics endpoint (MUST come before /:id so 'stats' isn't treated as an ID)
router.get('/stats/dashboard', getDashboardStats);

// Main Student CRUD endpoints
router.route('/')
  .get(getStudents)       // GET /api/students - Retrieve all with search/filters
  .post(createStudent);   // POST /api/students - Add new student

router.route('/:id')
  .get(getStudentById)    // GET /api/students/:id - View individual details
  .put(updateStudent)     // PUT /api/students/:id - Update student record
  .delete(deleteStudent); // DELETE /api/students/:id - Delete student record

module.exports = router;
