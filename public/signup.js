const form = document.getElementById("signupForm");
const otpDiv = document.getElementById("otpDiv");
const otpInput = document.getElementById("otpInput");
const verifyBtn = document.getElementById("verifyOtpBtn");
const message = document.getElementById("message");

let userEmail = "";

const fieldLabels = {
  institute_name: "Institute name",
  institute_type: "Institute type",
  registration_number: "Registration number",
  address: "Address",
  admin_name: "Admin name",
  admin_email: "Admin email",
  admin_mobile: "Mobile number",
  username: "Username",
  password: "Password",
};

function showMessage(text, type = "error") {
  message.className = type === "success" ? "success visible" : "error visible";
  message.innerText = text;
}

function formatValidationErrors(errors) {
  if (!Array.isArray(errors)) return "Please check all fields and try again.";
  return errors
    .map((e) => {
      const field = e.param || e.path || "field";
      const label = fieldLabels[field] || field;
      let hint = e.msg;
      if (hint === "Invalid value" || hint === "Invalid")
        hint = "is required or invalid";
      if (field === "admin_email") hint = "must be a valid email address";
      if (field === "password") hint = "must be at least 6 characters";
      if (field === "admin_mobile") hint = "must be a valid 10-digit number";
      return `• ${label}: ${hint}`;
    })
    .join("\n");
}

function formatServerError(errText) {
  if (!errText) return "Something went wrong. Please try again.";
  const lower = errText.toLowerCase();
  if (lower.includes("duplicate")) {
    if (lower.includes("username"))
      return "This username is already taken. Please choose a different username.";
    if (lower.includes("email"))
      return "This email is already registered. Please use another email or log in.";
    return "Some details are already in use. Please change username, email, or registration number.";
  }
  return errText;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const data = {};
  formData.forEach((v, k) => (data[k] = v));
  userEmail = data.admin_email;

  try {
    const res = await fetch("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (res.ok) {
      showMessage(result.message, "success");
      form.style.display = "none";
      otpDiv.style.display = "block";
      document.querySelector(".auth-link").style.display = "none";
    } else {
      let text = "";
      if (result.error) text = formatServerError(result.error);
      else if (result.errors) text = formatValidationErrors(result.errors);
      else text = "Signup failed. Please check your details.";
      showMessage(text, "error");
    }
  } catch {
    showMessage("Network error. Please check your connection and try again.", "error");
  }
});

verifyBtn.addEventListener("click", async () => {
  const otp = otpInput.value.trim();
  if (!otp || otp.length < 4) {
    showMessage("Please enter the OTP sent to your email.", "error");
    return;
  }

  try {
    const res = await fetch("/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, otp }),
    });
    const result = await res.json();

    if (res.ok) {
      form.reset();
      otpInput.value = "";
      otpDiv.style.display = "none";
      showMessage(
        result.message + "\n\nRedirecting to login in 3 seconds...",
        "success"
      );
      setTimeout(() => {
        sessionStorage.removeItem("mscit_logged_out");
        window.location.href = "/login";
      }, 3000);
    } else {
      showMessage(
        result.error || "Invalid OTP. Please check and try again.",
        "error"
      );
    }
  } catch {
    showMessage("Network error during verification. Please try again.", "error");
  }
});
