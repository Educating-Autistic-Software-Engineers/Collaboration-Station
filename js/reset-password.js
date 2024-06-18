document.addEventListener("DOMContentLoaded", (event) => {
  let form = document.getElementById("reset-password__form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get("token");
    let email = urlParams.get("email");

    let password = e.target.password.value;
    let confirmPassword = e.target.confirmPassword.value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Hash the password before sending it to the server
    const hashedPassword = CryptoJS.SHA256(password).toString();

    const requestBody = {
      email: email,
      token: token,
      password: hashedPassword,
    };

    console.log(requestBody);

    try {
      const response = await fetch(
        `https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("POST successful");

      const data = await response.json();
      console.log(data); // debugging

      if (response.ok) {
        alert("Password reset successful!");
        // Redirect to login page after successful password reset
        window.location.href = "homepage.html";
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      alert("Error: " + error.message);
    }
  });
});
