const Student = require('../models/Student');

/**
 * @desc    Create a new student record
 * @route   POST /api/students
 * @access  Private (Admin only)
 */
const createStudent = async (req, res) => {
  try {
    const {
      studentId,
      fullName,
      email,
      phone,
      department,
      course,
      academicYear,
      dateOfBirth,
      gender,
      address,
      enrollmentDate,
      status,
    } = req.body;

    // 1. Check for duplicate Student ID
    const existingId = await Student.findOne({
      studentId: studentId ? studentId.toUpperCase().trim() : '',
    });
    if (existingId) {
      return res.status(400).json({
        success: false,
        message: `Student ID "${studentId}" is already registered. Please use a unique ID.`,
      });
    }

    // 2. Check for duplicate Email
    const existingEmail = await Student.findOne({
      email: email ? email.toLowerCase().trim() : '',
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Email address "${email}" is already registered to another student.`,
      });
    }

    // 3. Create student in MongoDB
    const student = await Student.create({
      studentId: studentId.toUpperCase().trim(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      department: department.trim(),
      course: course.trim(),
      academicYear: academicYear.trim(),
      dateOfBirth,
      gender,
      address: address.trim(),
      enrollmentDate: enrollmentDate || Date.now(),
      status: status || 'Active',
    });

    return res.status(201).json({
      success: true,
      message: 'Student added successfully!',
      student,
    });
  } catch (error) {
    console.error('Create Student Error:', error);

    // Mongoose validation error formatting
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating student record',
    });
  }
};

/**
 * @desc    Get all students with search & filter capabilities
 * @route   GET /api/students
 * @access  Private (Admin only)
 */
const getStudents = async (req, res) => {
  try {
    const { search, department, academicYear, status } = req.query;

    // Build dynamic query object
    let query = {};

    // 1. Search by name or student ID
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive regex
      query.$or = [{ fullName: searchRegex }, { studentId: searchRegex }];
    }

    // 2. Filter by department
    if (department && department !== 'All') {
      query.department = department;
    }

    // 3. Filter by academic year
    if (academicYear && academicYear !== 'All') {
      query.academicYear = academicYear;
    }

    // 4. Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Execute query sorted by creation time descending (newest first)
    const students = await Student.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error('Get Students Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving students',
    });
  }
};

/**
 * @desc    Get a single student by MongoDB ID
 * @route   GET /api/students/:id
 * @access  Private (Admin only)
 */
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Student not found with invalid ID format',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving student details',
    });
  }
};

/**
 * @desc    Update an existing student record
 * @route   PUT /api/students/:id
 * @access  Private (Admin only)
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, email } = req.body;

    // 1. Verify student exists
    const existingStudent = await Student.findById(id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    // 2. If studentId is changing, ensure it is not taken by another student
    if (studentId && studentId.toUpperCase() !== existingStudent.studentId) {
      const idConflict = await Student.findOne({
        studentId: studentId.toUpperCase().trim(),
        _id: { $ne: id },
      });
      if (idConflict) {
        return res.status(400).json({
          success: false,
          message: `Student ID "${studentId}" is already used by another student`,
        });
      }
    }

    // 3. If email is changing, ensure it is not taken by another student
    if (email && email.toLowerCase() !== existingStudent.email) {
      const emailConflict = await Student.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (emailConflict) {
        return res.status(400).json({
          success: false,
          message: `Email "${email}" is already used by another student`,
        });
      }
    }

    // 4. Update the student record
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      {
        ...req.body,
        studentId: studentId ? studentId.toUpperCase().trim() : existingStudent.studentId,
        email: email ? email.toLowerCase().trim() : existingStudent.email,
      },
      {
        new: true, // Returns the newly updated document
        runValidators: true, // Re-runs schema validations
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully!',
      student: updatedStudent,
    });
  } catch (error) {
    console.error('Update Student Error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error updating student',
    });
  }
};

/**
 * @desc    Delete a student record
 * @route   DELETE /api/students/:id
 * @access  Private (Admin only)
 */
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student "${student.fullName}" (ID: ${student.studentId}) removed successfully!`,
    });
  } catch (error) {
    console.error('Delete Student Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting student',
    });
  }
};

/**
 * @desc    Get dashboard statistics (counts, department breakdown, recent students)
 * @route   GET /api/students/stats/dashboard
 * @access  Private (Admin only)
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    const inactiveStudents = await Student.countDocuments({ status: 'Inactive' });

    // Distinct department count
    const departments = await Student.distinct('department');

    // 5 Most recently registered students
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('studentId fullName department academicYear status createdAt');

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalDepartments: departments.length,
        recentStudents,
      },
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving dashboard statistics',
    });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getDashboardStats,
};
