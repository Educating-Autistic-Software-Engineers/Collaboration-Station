document.addEventListener("DOMContentLoaded", () => {
  let form = document.getElementById("forgot-password__form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let email = e.target.email.value;

    console.log(email);

    try {
      // Verify if email exists
      let response = await fetch(
        `https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register?email=${email}`
      );

      const data = await response.json();
      // console.log(data); // debugging
      console.log('hi', data)

      if (response.ok) {
        // If the email exists, proceed with sending a password reset link
        alert(
          "Email found. A password reset link has been sent to your email."
        );
        // Send the password reset request
        response = await fetch(
          `https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/forgot-password?email=${email}`
        );
      } else {
        // If the email does not exist, show an error message
        alert(`Email not found. Please enter a registered email`);
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      alert("Error: " + error.message);
    }
  });
});
