const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

function showMsg(text, type = "error") {
  msg.className = type === "success" ? "msg success visible" : "msg error visible";
  msg.innerText = text;
}

if (localStorage.getItem("mscitinstitute")) {
  window.location.replace("/dashboard");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "msg";
  msg.innerText = "";

  const data = {
    username: form.username.value.trim(),
    password: form.password.value,
  };

  if (!data.username || !data.password) {
    showMsg("Please enter both username and password.");
    return;
  }

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!res.ok) {
      let text = result.error || "Login failed. Please try again.";
      if (text === "Email not verified") {
        text =
          "Your email is not verified yet. Complete OTP verification after signup.";
      } else if (text === "Invalid username or password") {
        text = "Wrong username or password. Please check and try again.";
      }
      showMsg(text, "error");
      return;
    }

    sessionStorage.removeItem("mscit_logged_out");
    localStorage.setItem("mscitinstitute", JSON.stringify(result.institute));
    window.location.replace("/dashboard");
  } catch {
    showMsg("Network error. Please check your connection.", "error");
  }
});

window.addEventListener("pageshow", () => {
  if (localStorage.getItem("mscitinstitute")) {
    window.location.replace("/dashboard");
  }
});
