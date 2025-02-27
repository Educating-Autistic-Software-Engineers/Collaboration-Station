let form = document.getElementById('lobby__form')
let label = document.getElementById('label')

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let redirect = urlParams.get('redirect');
console.log("redirect",redirect);
if (redirect && redirect != "null") {
    label.innerHTML = "Enter your email to join the project";
}

let displayName = sessionStorage.getItem('display_email')
console.log(displayName);
// if(displayName!=null){
//     form.email.value = displayName
// }

function newAuth() {
    window.location.href = 'new_index.html';
}

function createStars() {
    const container = document.body;
    const starCount = 100;

    for (let i = 0; i < starCount; i++) {
        const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        star.classList.add("star");
        star.setAttribute("viewBox", "0 0 24 24");
        
        const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
        useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#star");
        star.appendChild(useElement);
        
        const size = 10 + Math.random() * 15;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        const duration = 3 + Math.random() * 7;
        star.style.setProperty('--twinkle-duration', `${duration}s`);
        
        container.appendChild(star);
        console.log(star);
    }
}

// createStars();


document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    let email = e.target.email.value;
    let password = e.target.password.value;
    console.log(email);

    let emailExists = await checkEmail(email);

    if (emailExists) {

        if (password !== "password") {
            alert("Incorrect Password. Please try again.");
            return;
        }

        if (redirect && redirect != "null") {
            const viewType = urlParams.get('view') == "true" ? "view" : "project";
            window.location = `room.html?${viewType}=${redirect}`;
        } else {
            window.location = `projects.html?email=${email}`;
        }
    } else {
        // Show an error message if the email does not exist
        alert('Email not found. Please contact prodegh@clemson.edu to sign up.');
    }


});


async function checkEmail(email) {
    // return new Promise((resolve) => {
    //     setTimeout(() => {
    //         // Simulate checking email; return true if email exists, false otherwise
    //         resolve(email === 'test@example.com'); // Example condition
    //     }, 1000);
    // });

    console.log(email);

    try {
        const response = await fetch(`https://p497lzzlxf.execute-api.us-east-2.amazonaws.com/Phase1/register?email=${email}`);
        console.log(response);
        console.log(response.ok);
        const data = await response.json();
        sessionStorage.setItem('display_name',data.name);
        sessionStorage.setItem('email',data.requestId);
        sessionStorage.setItem('role',data.role);
        console.log(data);
        console.log(data.name);
        return data.requestId;
    } catch (error) {
        console.error('Error checking email:', error);
        return false;
    }
}

