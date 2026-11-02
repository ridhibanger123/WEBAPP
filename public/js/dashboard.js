/**
 * Dashboard Controller (Frontend)
 * Handles data fetching, live search, filtering, CRUD modals, and session logout
 */

let currentAdmin = null;
let currentStudentsList = [];
let studentToDeleteId = null;
let studentToEditId = null;
let searchDebounceTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initial Authentication Guard
  await checkAuthStatus();

  // 2. Set Today's Date in Topbar
  displayCurrentDate();

  // 3. Load Stats & Students Data
  await loadDashboardStats();
  await fetchAndRenderStudents();

  // 4. Attach Event Listeners
  initEventListeners();
});

/**
 * 1. Verify if Admin is Logged In
 */
async function checkAuthStatus() {
  try {
    const res = await apiRequest('/api/auth/me');
    if (res.success && res.admin) {
      currentAdmin = res.admin;
      // Populate admin UI
      document.getElementById('sidebar-admin-name').textContent = currentAdmin.name;
      document.getElementById('sidebar-admin-email').textContent = currentAdmin.email;
      document.getElementById('admin-avatar-char').textContent = currentAdmin.name.charAt(0).toUpperCase();
    }
  } catch (error) {
    // If not authenticated, kick back to login page
    window.location.href = 'index.html';
  }
}

/**
 * 2. Display formatted current date
 */
function displayCurrentDate() {
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const todayStr = new Date().toLocaleDateString('en-US', options);
  const badge = document.getElementById('current-date-badge');
  if (badge) badge.textContent = `📅 ${todayStr}`;
}

/**
 * 3. Fetch Dashboard Summary Statistics
 */
async function loadDashboardStats() {
  try {
    const res = await apiRequest('/api/students/stats/dashboard');
    if (res.success && res.stats) {
      document.getElementById('stat-total').textContent = res.stats.totalStudents || 0;
      document.getElementById('stat-active').textContent = res.stats.activeStudents || 0;
      document.getElementById('stat-inactive').textContent = res.stats.inactiveStudents || 0;
      document.getElementById('stat-depts').textContent = res.stats.totalDepartments || 0;
    }
  } catch (error) {
    console.warn('Could not load statistics:', error.message);
  }
}

/**
 * 4. Fetch and Render Student List (with Search & Filters)
 */
async function fetchAndRenderStudents() {
  const tableBody = document.getElementById('students-table-body');
  const loadingContainer = document.getElementById('table-loading');
  const emptyContainer = document.getElementById('table-empty');
  const countBadge = document.getElementById('badge-record-count');

  // Read current filter and search inputs
  const searchVal = document.getElementById('search-input').value.trim();
  const deptVal = document.getElementById('filter-department').value;
  const yearVal = document.getElementById('filter-year').value;
  const statusVal = document.getElementById('filter-status').value;

  // Build query string
  const params = new URLSearchParams();
  if (searchVal) params.append('search', searchVal);
  if (deptVal && deptVal !== 'All') params.append('department', deptVal);
  if (yearVal && yearVal !== 'All') params.append('academicYear', yearVal);
  if (statusVal && statusVal !== 'All') params.append('status', statusVal);

  try {
    loadingContainer.style.display = 'block';
    emptyContainer.style.display = 'none';
    tableBody.innerHTML = '';

    const res = await apiRequest(`/api/students?${params.toString()}`);
    currentStudentsList = res.students || [];

    loadingContainer.style.display = 'none';
    countBadge.textContent = `${currentStudentsList.length} ${currentStudentsList.length === 1 ? 'Record' : 'Records'}`;

    if (currentStudentsList.length === 0) {
      emptyContainer.style.display = 'block';
      return;
    }

    // Render student rows
    renderTableRows(currentStudentsList);
  } catch (error) {
    loadingContainer.style.display = 'none';
    showToast(error.message || 'Error loading students', 'error');
  }
}

/**
 * Render array of student objects into HTML table rows
 */
function renderTableRows(students) {
  const tableBody = document.getElementById('students-table-body');
  tableBody.innerHTML = '';

  students.forEach((student) => {
    const tr = document.createElement('tr');

    const statusBadgeClass = student.status === 'Active' ? 'badge-active' : 'badge-inactive';

    tr.innerHTML = `
      <td>
        <strong style="color: var(--primary); letter-spacing: 0.03em;">${student.studentId}</strong>
      </td>
      <td>
        <div style="font-weight: 600;">${student.fullName}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${student.email}</div>
      </td>
      <td>
        <div style="font-weight: 500;">${student.department}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${student.course}</div>
      </td>
      <td>
        <span style="font-weight: 500;">${student.academicYear}</span>
      </td>
      <td>
        <span class="badge ${statusBadgeClass}">
          ${student.status === 'Active' ? '● Active' : '○ Inactive'}
        </span>
      </td>
      <td style="text-align: right;">
        <div class="action-btns" style="justify-content: flex-end;">
          <button class="btn-icon view" title="View Student Details" onclick="handleViewDetails('${student._id}')">
            👁️
          </button>
          <button class="btn-icon edit" title="Edit Student Record" onclick="handleOpenEditModal('${student._id}')">
            ✏️
          </button>
          <button class="btn-icon delete" title="Delete Student" onclick="handleOpenDeleteModal('${student._id}', '${student.fullName}', '${student.studentId}')">
            🗑️
          </button>
        </div>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

/**
 * 5. Add / Edit Student Modal Operations
 */
function openAddModal() {
  document.getElementById('student-form').reset();
  document.getElementById('student-doc-id').value = '';
  document.getElementById('form-modal-title').textContent = 'Add New Student';
  
  // Set default enrollment date to today
  document.getElementById('inp-enrollment').value = new Date().toISOString().split('T')[0];
  
  // Enable student ID field (editable when adding)
  document.getElementById('inp-student-id').disabled = false;

  document.getElementById('modal-student-form').classList.add('active');
}

async function handleOpenEditModal(studentId) {
  try {
    const res = await apiRequest(`/api/students/${studentId}`);
    const student = res.student;

    if (!student) return;

    studentToEditId = student._id;

    // Populate modal inputs
    document.getElementById('student-doc-id').value = student._id;
    document.getElementById('form-modal-title').textContent = 'Edit Student Record';
    document.getElementById('inp-student-id').value = student.studentId;
    document.getElementById('inp-full-name').value = student.fullName;
    document.getElementById('inp-email').value = student.email;
    document.getElementById('inp-phone').value = student.phone;
    document.getElementById('inp-department').value = student.department;
    document.getElementById('inp-course').value = student.course;
    document.getElementById('inp-year').value = student.academicYear;
    document.getElementById('inp-dob').value = formatDateForInput(student.dateOfBirth);
    document.getElementById('inp-gender').value = student.gender;
    document.getElementById('inp-status').value = student.status;
    document.getElementById('inp-enrollment').value = formatDateForInput(student.enrollmentDate);
    document.getElementById('inp-address').value = student.address;

    // Close details modal if open
    closeDetailsModal();

    // Show form modal
    document.getElementById('modal-student-form').classList.add('active');
  } catch (error) {
    showToast(error.message || 'Error loading student for edit', 'error');
  }
}

function closeFormModal() {
  document.getElementById('modal-student-form').classList.remove('active');
}

/**
 * Handle Add/Edit Form Submit
 */
async function handleStudentFormSubmit(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('btn-save-student');
  const docId = document.getElementById('student-doc-id').value;

  const payload = {
    studentId: document.getElementById('inp-student-id').value.trim(),
    fullName: document.getElementById('inp-full-name').value.trim(),
    email: document.getElementById('inp-email').value.trim(),
    phone: document.getElementById('inp-phone').value.trim(),
    department: document.getElementById('inp-department').value,
    course: document.getElementById('inp-course').value.trim(),
    academicYear: document.getElementById('inp-year').value,
    dateOfBirth: document.getElementById('inp-dob').value,
    gender: document.getElementById('inp-gender').value,
    status: document.getElementById('inp-status').value,
    enrollmentDate: document.getElementById('inp-enrollment').value || undefined,
    address: document.getElementById('inp-address').value.trim(),
  };

  // Basic client-side validation
  if (!payload.studentId || !payload.fullName || !payload.email || !payload.department) {
    showToast('Please fill all required fields.', 'warning');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    let res;
    if (docId) {
      // Update existing student (PUT)
      res = await apiRequest(`/api/students/${docId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast(res.message || 'Student updated successfully!', 'success');
    } else {
      // Create new student (POST)
      res = await apiRequest('/api/students', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast(res.message || 'Student added successfully!', 'success');
    }

    closeFormModal();
    await loadDashboardStats();
    await fetchAndRenderStudents();
  } catch (error) {
    showToast(error.message || 'Failed to save student', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Student';
  }
}

/**
 * 6. Student Profile Details View
 */
async function handleViewDetails(studentId) {
  try {
    const res = await apiRequest(`/api/students/${studentId}`);
    const student = res.student;
    if (!student) return;

    studentToEditId = student._id;

    const modalBody = document.getElementById('details-modal-content');
    const statusBadgeClass = student.status === 'Active' ? 'badge-active' : 'badge-inactive';

    modalBody.innerHTML = `
      <div class="details-profile-header">
        <div class="details-avatar">
          ${student.fullName.charAt(0).toUpperCase()}
        </div>
        <div class="details-title">
          <h3>${student.fullName}</h3>
          <p>
            <strong>ID:</strong> ${student.studentId} &bull; 
            <span class="badge ${statusBadgeClass}">
              ${student.status}
            </span>
          </p>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Email Address</div>
          <div class="detail-value">${student.email}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">Phone Number</div>
          <div class="detail-value">${student.phone}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">Department</div>
          <div class="detail-value">${student.department}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">Degree / Course</div>
          <div class="detail-value">${student.course}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">Academic Year</div>
          <div class="detail-value">${student.academicYear}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">Gender</div>
          <div class="detail-value">${student.gender}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">Date of Birth</div>
          <div class="detail-value">${formatDate(student.dateOfBirth)}</div>
        </div>

        <div class="detail-item">
          <div class="detail-label">Enrollment Date</div>
          <div class="detail-value">${formatDate(student.enrollmentDate)}</div>
        </div>
      </div>

      <div class="detail-item" style="margin-top: 16px;">
        <div class="detail-label">Residential Address</div>
        <div class="detail-value">${student.address}</div>
      </div>
    `;

    document.getElementById('modal-student-details').classList.add('active');
  } catch (error) {
    showToast(error.message || 'Error viewing details', 'error');
  }
}

function closeDetailsModal() {
  document.getElementById('modal-student-details').classList.remove('active');
}

/**
 * 7. Delete Confirmation Operations
 */
function handleOpenDeleteModal(id, name, studentId) {
  studentToDeleteId = id;
  document.getElementById('delete-student-name').textContent = name;
  document.getElementById('delete-student-id').textContent = `ID: ${studentId}`;
  document.getElementById('modal-delete-confirm').classList.add('active');
}

function closeDeleteModal() {
  studentToDeleteId = null;
  document.getElementById('modal-delete-confirm').classList.remove('active');
}

async function handleConfirmDelete() {
  if (!studentToDeleteId) return;

  const deleteBtn = document.getElementById('btn-confirm-delete');

  try {
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';

    const res = await apiRequest(`/api/students/${studentToDeleteId}`, {
      method: 'DELETE',
    });

    showToast(res.message || 'Student deleted successfully', 'success');
    closeDeleteModal();

    await loadDashboardStats();
    await fetchAndRenderStudents();
  } catch (error) {
    showToast(error.message || 'Failed to delete student', 'error');
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.textContent = 'Delete Permanently';
  }
}

/**
 * 8. User Logout
 */
async function handleLogout() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    showToast('Signed out successfully. Redirecting...', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 600);
  } catch (error) {
    showToast(error.message || 'Logout failed', 'error');
  }
}

/**
 * Attach DOM Event Listeners
 */
function initEventListeners() {
  // Modal Open & Close Buttons
  document.getElementById('btn-open-add-modal').addEventListener('click', openAddModal);
  document.getElementById('btn-close-form-modal').addEventListener('click', closeFormModal);
  document.getElementById('btn-cancel-form-modal').addEventListener('click', closeFormModal);
  
  // Student Form Submit
  document.getElementById('student-form').addEventListener('submit', handleStudentFormSubmit);

  // Details Modal Close
  document.getElementById('btn-close-details-modal').addEventListener('click', closeDetailsModal);
  document.getElementById('btn-close-details-footer').addEventListener('click', closeDetailsModal);
  document.getElementById('btn-details-edit-shortcut').addEventListener('click', () => {
    if (studentToEditId) {
      handleOpenEditModal(studentToEditId);
    }
  });

  // Delete Modal Buttons
  document.getElementById('btn-close-delete-modal').addEventListener('click', closeDeleteModal);
  document.getElementById('btn-cancel-delete').addEventListener('click', closeDeleteModal);
  document.getElementById('btn-confirm-delete').addEventListener('click', handleConfirmDelete);

  // Logout Buttons
  document.getElementById('btn-sidebar-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-topbar-logout').addEventListener('click', handleLogout);

  // Search Input with Debounce (Wait 300ms after user stops typing)
  document.getElementById('search-input').addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(fetchAndRenderStudents, 300);
  });

  // Filter Dropdowns
  document.getElementById('filter-department').addEventListener('change', fetchAndRenderStudents);
  document.getElementById('filter-year').addEventListener('change', fetchAndRenderStudents);
  document.getElementById('filter-status').addEventListener('change', fetchAndRenderStudents);

  // Reset Filters Button
  document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-department').value = 'All';
    document.getElementById('filter-year').value = 'All';
    document.getElementById('filter-status').value = 'All';
    fetchAndRenderStudents();
  });

  // Close modals when clicking outside the dialog on overlay
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });
}

// Global functions accessible from inline HTML onclick attributes
window.handleViewDetails = handleViewDetails;
window.handleOpenEditModal = handleOpenEditModal;
window.handleOpenDeleteModal = handleOpenDeleteModal;
