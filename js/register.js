document.addEventListener("DOMContentLoaded", (event) => {
  let form = document.getElementById("register__form");

  // Only these emails can register
  const predefinedEmails = [];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      let email = e.target.email.value;
      let password = e.target.password.value;
      let confirmPassword = e.target.confirmPassword.value;

      // Check if the entered email is in the predefined list
      if (!predefinedEmails.includes(email)) {
        alert(
          "This email is not authorized to register. Please use an authorized email."
        );
        return;
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return; // Stop form submission
      }

      // console.log("Email:", email); // debugging

      // Hash the password before sending it to the server
      const hashedPassword = CryptoJS.SHA256(password).toString();

      const requestBody = {
        email: email,
        password: hashedPassword,
      };

      // console.log("Request Body:", requestBody); // debugging

      const response = await fetch(
        "https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/v1/test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      // console.log(data); // debugging

      if (response.ok) {
        alert("Registration successful!");
        // Redirect to login page after successful registration
        window.location.href = "homepage.html";
      } else {
        alert(`${data.Message}`);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      alert("Error: " + error.message);
    }
  });
});
