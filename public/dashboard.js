// read institute from localStorage and show; if not present redirect to login
const instRaw = localStorage.getItem("mscitinstitute");
if (!instRaw) {
  window.location.replace("/login");
} else {
  const inst = JSON.parse(instRaw);
  document.getElementById("iname").innerText = inst.institute_name || "";
  document.getElementById("itype").innerText = inst.institute_type || "";
  document.getElementById("iaddress").innerText = inst.address || "";
  document.getElementById("iemail").innerText = inst.admin_email || "";
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("mscitinstitute");
  sessionStorage.setItem("mscit_logged_out", "1");
  window.location.replace("/");
});

// existing code ke niche add ye lines
document.getElementById("addStudentBtn").addEventListener("click", () => {
  window.location.href = "/add-student";
});

//student-search bar
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const instituteData = JSON.parse(localStorage.getItem("mscitinstitute"));

searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  if (query.length < 1) {
    searchResults.innerHTML = "";
    return;
  }

  const res = await fetch(
    `/search-students?name=${query}&inst=${instituteData.id}`
  );
  const data = await res.json();

  searchResults.innerHTML = data.length
    ? data
        .map(
          (s) =>
            `<div class="result-item" data-id="${s.id}">${s.student_name}</div>`
        )
        .join("")
    : '<p style="padding:10px;">No students found</p>';
});

// student name click
searchResults.addEventListener("click", async (e) => {
  const item = e.target.closest(".result-item");
  if (!item) return;
  const id = item.getAttribute("data-id");
  const res = await fetch(`/student/${id}`);
  const data = await res.json();

  if (data.error) return alert("Error fetching student");

  // show detail view
  showStudentDetail(data);
});

function showStudentDetail(stu) {
  searchResults.innerHTML = `
    <div class="student-detail">
      <h3>${stu.student_name}</h3>
      <p><b>Gender:</b> ${stu.gender}</p>
      <p><b>DOB:</b> ${stu.dob}</p>
      <p><b>Contact:</b> ${stu.contact_number}</p>
      <p><b>Address:</b> ${stu.address}</p>
      <p><b>Admission Date:</b> ${stu.admission_date}</p>
      <p><b>Total Fees:</b> ${stu.total_fees}</p>
      <p><b>Fees Paid:</b> ${stu.fees_paid}</p>
      ${stu.photo ? `<img src="${stu.photo}" width="120">` : ""}
      <div style="margin-top:10px;">
        <button id="editBtn">Edit</button>
        <button id="deleteBtn" style="background:red;color:white;">Delete</button>
      </div>
    </div>
  `;

  document.getElementById("editBtn").onclick = () => editStudent(stu);
  document.getElementById("deleteBtn").onclick = () => deleteStudent(stu.id);
}

function editStudent(stu) {
  searchResults.innerHTML = `
    <form id="editForm">
      <input name="student_name" value="${stu.student_name}" required>
      <input name="contact_number" value="${stu.contact_number}" required>
      <textarea name="address">${stu.address}</textarea>
      <input name="fees_paid" value="${stu.fees_paid}" required>
      <button type="submit">Save</button>
    </form>
  `;

  document.getElementById("editForm").onsubmit = async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));
    const res = await fetch(`/student/${stu.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    alert(result.message);
    searchInput.value = "";
    searchResults.innerHTML = "";
  };
}
async function deleteStudent(id) {
  if (!confirm("Delete this student?")) return;
  const res = await fetch(`/student/${id}`, { method: "DELETE" });
  const result = await res.json();
  alert(result.message);
  searchResults.innerHTML = "";
}

// pending fees student linst
const pendingFeesBtn = document.getElementById("pendingFeesBtn");
const pendingFeesList = document.getElementById("pendingFeesList");

pendingFeesBtn.addEventListener("click", async () => {
  const instituteData = JSON.parse(localStorage.getItem("mscitinstitute"));
  const res = await fetch(`/pending-fees?inst=${instituteData.id}`);
  const data = await res.json();

  if (!data.length) {
    pendingFeesList.innerHTML =
      '<p style="text-align:center; padding:10px;">No pending fees</p>';
    return;
  }

  pendingFeesList.innerHTML = data
    .map(
      (s) => `
    <div class="pending-item">
      <span>${s.student_name}</span>
      <span>Paid: ${s.fees_paid} / Total: ${s.total_fees} (Pending: ${
        s.total_fees - s.fees_paid
      })</span>
    </div>
  `
    )
    .join("");
});

//pending typing students fees
document
  .getElementById("pendingTypingFeesBtn")
  .addEventListener("click", () => {
    window.location.href = "/pending-typing-fees";
  });

async function loadTypingStudentCount() {
  const res = await fetch("/totalTypingStudents");
  const data = await res.json();
  document.getElementById("typingStudentCount").innerText =
    "Total Typing Students: " + data.total;
}

loadTypingStudentCount();

// Add new course
const addCourseForm = document.getElementById("addCourseForm");
addCourseForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(addCourseForm));

  const res = await fetch("/addCourse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const msg = await res.text();
  alert(msg);
  loadCourses();
});

// Load all courses
async function loadCourses() {
  const res = await fetch("/getCourses");
  const courses = await res.json();
  const list = document.getElementById("courseList");
  list.innerHTML = "";

  courses.forEach((c) => {
    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${c.name}</strong> - ${c.batch || "No Batch"} - Total Fees: ${
      c.total_fees
    }
      <button onclick="showAddStudent(${c.id}, '${
      c.name
    }')">Add Student</button>
      <button onclick="viewStudents(${c.id}, '${
      c.name
    }')">View Students</button>
      <button onclick="deleteCourse(${
        c.id
      })" style="background:red;color:white;">Delete Course</button>
      <div id="students_${c.id}" class="studentList"></div>
    `;
    list.appendChild(div);
  });
}

loadCourses();

// Show Add Student Form
function showAddStudent(course_id, course_name) {
  const section = document.getElementById("addStudentSection");
  section.innerHTML = `
    <div class="student-form-container">
      <div class="form-header">
        <h3>Add Student for ${course_name}</h3>
        <span class="close-btn" onclick="closeAddStudent()">×</span>
      </div>
      <form id="addStudentForm" enctype="multipart/form-data">
        <input type="hidden" name="course_id" value="${course_id}">
        <input type="text" name="name" placeholder="Full Name" required />
        <input type="text" name="gender" placeholder="Gender" />
        <p style="margin: 0">Enter Date-Of-Birth</p>
        <input type="date" name="dob" />
        <input type="text" name="contact" placeholder="Contact" />
        <textarea name="address" placeholder="Address"></textarea>
        <p style="margin: 0">Enter Addmission Date</p>
        <input type="date" name="admission_date" />
        <input type="number" name="fees_paid" placeholder="Fees Paid" />
        <input type="email" name="gmail" placeholder="Gmail" />
        <input type="file" name="photo" />
        <button type="submit">Add Student</button>
      </form>
    </div>
  `;

  const form = document.getElementById("addStudentForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const res = await fetch("/addCourseStudent", {
      method: "POST",
      body: data,
    });
    const msg = await res.text();
    alert(msg);
    form.reset();
  });
}

// Close form function
function closeAddStudent() {
  document.getElementById("addStudentSection").innerHTML = "";
}

// 🔹 View Students + Edit/Delete Options
async function viewStudents(course_id, course_name) {
  const res = await fetch(`/getCourseStudents/${course_id}`);
  const students = await res.json();
  const div = document.getElementById(`students_${course_id}`);

  if (!students.length) {
    div.innerHTML = `<p>No students found in ${course_name}</p>`;
    return;
  }

  let html = `<h4>Students in ${course_name}</h4><ul>`;
  students.forEach((s) => {
    html += `
      <li id="student_${s.id}">
        <strong>${s.name}</strong> - ${s.contact || "N/A"} - Fees: ${
      s.fees_paid || 0
    }
        <button onclick="editStudent(${s.id}, '${s.name}', '${s.contact}', ${
      s.fees_paid || 0
    })">Edit</button>
        <button onclick="deleteStudent(${
          s.id
        }, ${course_id})" style="background:red;color:white;">Delete</button>
      </li>
    `;
  });
  html += "</ul>";
  div.innerHTML = html;
}

// 🔹 Edit Student
function editStudent(id, name, contact, fees_paid) {
  const li = document.getElementById(`student_${id}`);
  li.innerHTML = `
    <form id="editForm_${id}">
      <input type="text" name="name" value="${name}" required />
      <input type="text" name="contact" value="${contact}" />
      <input type="number" name="fees_paid" value="${fees_paid}" />
      <button type="submit">Save</button>
      <button type="button" onclick="cancelEdit(${id}, '${name}', '${contact}', ${fees_paid})">Cancel</button>
    </form>
  `;

  const form = document.getElementById(`editForm_${id}`);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch(`/updateStudent/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const msg = await res.text();
    alert(msg);
    loadCourses();
  });
}

function cancelEdit(id, name, contact, fees_paid) {
  const li = document.getElementById(`student_${id}`);
  li.innerHTML = `
    <strong>${name}</strong> - ${contact || "N/A"} - Fees: ${fees_paid || 0}
    <button onclick="editStudent(${id}, '${name}', '${contact}', ${fees_paid})">Edit</button>
    <button onclick="deleteStudent(${id})" style="background:red;color:white;">Delete</button>
  `;
}

// 🔹 Delete Student
async function deleteStudent(id, course_id) {
  if (!confirm("Delete this student?")) return;
  const res = await fetch(`/deleteStudent/${id}`, { method: "DELETE" });
  const msg = await res.text();
  alert(msg);
  viewStudents(course_id);
}

// Delete Course
async function deleteCourse(course_id) {
  if (!confirm("Are you sure you want to delete this course?")) return;
  const res = await fetch(`/deleteCourse/${course_id}`, { method: "DELETE" });
  const msg = await res.text();
  alert(msg);
  loadCourses();
}

// Load courses in dropdown
async function loadCourseDropdown() {
  const res = await fetch("/getCourses");
  const courses = await res.json();
  const select = document.getElementById("courseSelect");
  select.innerHTML = `<option value="">-- Select Course --</option>`;
  courses.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}
loadCourseDropdown();

// Send Message Handler for cources
const sendMsgForm = document.getElementById("sendMsgForm");
sendMsgForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = {
    course_id: document.getElementById("courseSelect").value,
    message: document.getElementById("messageText").value,
    sendType: document.querySelector("input[name='sendType']:checked").value,
  };

  const res = await fetch("/sendCourseMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  const msg = await res.text();
  alert(msg);
  sendMsgForm.reset();
});
// Prevent browser back while logged in on dashboard
history.pushState(null, "", location.href);
window.addEventListener("popstate", () => {
  history.pushState(null, "", location.href);
});

// Block bfcache return without session
window.addEventListener("pageshow", (e) => {
  if (!localStorage.getItem("mscitinstitute")) {
    window.location.replace("/login");
  } else if (e.persisted) {
    history.pushState(null, "", location.href);
  }
});
