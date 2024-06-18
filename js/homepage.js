let form = document.getElementById("lobby__form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let email = e.target.email.value;
  let password = e.target.password.value;

  // Hash the password using CryptoJS
  let hashedPassword = CryptoJS.SHA256(password).toString();

  try {
    const response = await fetch(
      `https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register?email=${email}&hashedPassword=${hashedPassword}`
    );
    const data = await response.json();
    console.log(data);
    if (!data || !data.requestId) {
      alert("Email not found. Please sign up first.");
    } else if (data.password !== hashedPassword) {
      alert("Incorrect Password. Please try again.");
    } else {
      // Redirect to the next page if email and password are correct

      sessionStorage.setItem('display_name',data.name);
      sessionStorage.setItem('email',data.requestId);

      window.location = `projects.html?email=${email}`;
    }
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
});
