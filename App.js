/* =========================================
   EduManage - App.js
   Features: Add, Edit, Delete, Search
   Data is saved in the browser's localStorage
   ========================================= */

// ---------- 1. Get all HTML elements we need ----------
const form = document.getElementById("studentForm");
const nameInput = document.getElementById("name");
const rollInput = document.getElementById("roll");
const courseInput = document.getElementById("course");
const phoneInput = document.getElementById("phone");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");
const message = document.getElementById("message");

const searchBox = document.getElementById("searchBox");
const courseFilter = document.getElementById("courseFilter");
const tableBody = document.getElementById("studentTable");
const emptyMsg = document.getElementById("emptyMsg");

const totalStudents = document.getElementById("totalStudents");
const totalCourses = document.getElementById("totalCourses");

const confirmBox = document.getElementById("confirmBox");
const confirmText = document.getElementById("confirmText");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

// ---------- 2. Variables ----------
const STORAGE_KEY = "edumanage_students"; // name used to save data in localStorage
let students = loadStudents();            // array that holds all students
let deleteId = null;                      // id of the student waiting for delete confirmation
let editId = null;                        // null = adding, otherwise = id of student being edited

// ---------- 3. localStorage functions ----------

// Read students from localStorage (returns empty array if nothing saved)
function loadStudents() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(function (student) {
        return student && typeof student === "object";
      })
      .map(function (student, index) {
        return {
          id: student.id ?? Date.now() + index,
          name: String(student.name ?? ""),
          roll: String(student.roll ?? ""),
          course: String(student.course ?? ""),
          phone: String(student.phone ?? "")
        };
      });
  } catch (error) {
    return [];
  }
}

// Save students array to localStorage (arrays must be converted to text first)
function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

// ---------- 4. Show students in the table ----------
function showStudents() {
  const keyword = searchBox.value.trim().toLowerCase();
  const selectedCourse = courseFilter.value; // "" means All Courses

  // Keep a student only if BOTH conditions are true:
  // 1) name or roll no matches the search text
  // 2) course matches the selected course (or All Courses is selected)
  const filtered = students.filter(function (student) {
    const matchText =
      student.name.toLowerCase().includes(keyword) ||
      student.roll.toLowerCase().includes(keyword);
    const matchCourse = selectedCourse === "" || student.course === selectedCourse;
    return matchText && matchCourse;
  });

  // Build the table rows
  let rows = "";
  filtered.forEach(function (student) {
    rows += `
      <tr>
        <td data-label="Name">${safe(student.name)}</td>
        <td data-label="Roll No">${safe(student.roll)}</td>
        <td data-label="Course"><span class="badge">${safe(student.course)}</span></td>
        <td data-label="Phone">${safe(student.phone)}</td>
        <td class="actions">
          <button class="btn btn-small btn-edit" onclick="editStudent(${student.id})">Edit</button>
          <button class="btn btn-small btn-delete" onclick="deleteStudent(${student.id})">Delete</button>
        </td>
      </tr>`;
  });
  tableBody.innerHTML = rows;

  // Show a message when there is nothing to display
  if (filtered.length === 0) {
    emptyMsg.classList.remove("hidden");
    emptyMsg.textContent = students.length === 0
      ? "No students yet. Add your first student using the form above."
      : "No student found for this search.";
  } else {
    emptyMsg.classList.add("hidden");
  }

  updateDashboard();
}

// ---------- 5. Dashboard numbers ----------
function updateDashboard() {
  totalStudents.textContent = students.length;

  // Count different courses that have at least one student
  const uniqueCourses = [];
  students.forEach(function (student) {
    if (student.course && !uniqueCourses.includes(student.course)) {
      uniqueCourses.push(student.course);
    }
  });
  totalCourses.textContent = uniqueCourses.length;
}

// ---------- 6. Add or Update student (form submit) ----------
form.addEventListener("submit", function (event) {
  event.preventDefault(); // stop page from reloading

  const name = nameInput.value.trim();
  const roll = rollInput.value.trim();
  const course = courseInput.value;
  const phone = phoneInput.value.trim();

  // --- Validation ---
  if (name === "" || roll === "" || course === "" || phone === "") {
    showMessage("Please fill in all the fields.", "error");
    return;
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    showMessage("Phone number must be exactly 10 digits.", "error");
    return;
  }

  // Roll no must be unique (ignore the student we are editing)
  const duplicate = students.some(function (student) {
    return student.roll.toLowerCase() === roll.toLowerCase() && student.id !== editId;
  });
  if (duplicate) {
    showMessage("This Roll No already exists.", "error");
    return;
  }

  if (editId === null) {
    // ADD new student
    students.push({
      id: Date.now(), // unique id based on current time
      name: name,
      roll: roll,
      course: course,
      phone: phone
    });
    showMessage("Student added successfully.", "success");
  } else {
    // UPDATE existing student
    const student = students.find(function (s) {
      return s.id === editId;
    });
    student.name = name;
    student.roll = roll;
    student.course = course;
    student.phone = phone;
    showMessage("Student updated successfully.", "success");
  }

  saveStudents();
  resetForm();
  showStudents();
});

// ---------- 7. Edit student ----------
function editStudent(id) {
  const student = students.find(function (s) {
    return s.id === id;
  });

  // Put the student's data back in the form
  nameInput.value = student.name;
  rollInput.value = student.roll;
  courseInput.value = student.course;
  phoneInput.value = student.phone;

  editId = id;
  formTitle.textContent = "Edit Student";
  submitBtn.textContent = "Update Student";
  cancelBtn.classList.remove("hidden");
  message.classList.add("hidden");

  // Scroll up to the form and focus the first box
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  nameInput.focus();
}

// ---------- 8. Delete student ----------

// Step 1: delete button clicked -> show our own popup (not the browser's confirm box)
function deleteStudent(id) {
  const student = students.find(function (s) {
    return s.id === id;
  });

  deleteId = id;
  confirmText.textContent =
    "Are you sure you want to delete " + student.name + " (Roll No " + student.roll + ")?";
  confirmBox.classList.remove("hidden");
}

// Step 2: user clicked "Yes, Delete" -> really delete
confirmYes.addEventListener("click", function () {
  // Keep every student except the one with this id
  students = students.filter(function (s) {
    return s.id !== deleteId;
  });

  // If the deleted student was being edited, reset the form
  if (editId === deleteId) {
    resetForm();
  }

  saveStudents();
  closeConfirm();
  showStudents();
});

// "Cancel" button, or clicking outside the popup -> close without deleting
confirmNo.addEventListener("click", closeConfirm);
confirmBox.addEventListener("click", function (event) {
  if (event.target === confirmBox) {
    closeConfirm();
  }
});

function closeConfirm() {
  confirmBox.classList.add("hidden");
  deleteId = null;
}

// ---------- 9. Cancel edit ----------
cancelBtn.addEventListener("click", function () {
  resetForm();
  message.classList.add("hidden");
});

// ---------- 10. Search and course filter ----------
searchBox.addEventListener("input", showStudents);

// Course dropdown (runs when the selected course changes)
courseFilter.addEventListener("change", showStudents);

// ---------- 11. Helper functions ----------

// Clear the form and go back to "Add" mode
function resetForm() {
  form.reset();
  editId = null;
  formTitle.textContent = "Add Student";
  submitBtn.textContent = "Add Student";
  cancelBtn.classList.add("hidden");
}

// Show a message (type = "error" or "success")
function showMessage(text, type) {
  message.textContent = text;
  message.className = "message " + type;

  // Hide after 3 seconds
  setTimeout(function () {
    message.classList.add("hidden");
  }, 3000);
}

// Makes text safe before putting it in HTML (stops people typing HTML/script tags)
function safe(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ---------- 12. Run when page loads ----------
showStudents();