document.getElementById("eventForm").addEventListener("submit", function (e) {
  let valid = true;

  // Name
  const name = document.getElementById("name").value.trim();
  if (name.length < 3) {
    document.getElementById("nameError").innerText = "Name must be at least 3 chars";
    valid = false;
  } else document.getElementById("nameError").innerText = "";

  // Email
  const email = document.getElementById("email").value;
  const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,}$/;
  if (!email.match(emailPattern)) {
    document.getElementById("emailError").innerText = "Invalid email format";
    valid = false;
  } else document.getElementById("emailError").innerText = "";

  // Phone
  const phone = document.getElementById("phone").value;
  if (!/^\d{10}$/.test(phone)) {
    document.getElementById("phoneError").innerText = "Phone must be 10 digits";
    valid = false;
  } else document.getElementById("phoneError").innerText = "";

  // Event Date
  const eventDate = new Date(document.getElementById("eventDate").value);
  const today = new Date();
  if (eventDate <= today) {
    document.getElementById("dateError").innerText = "Pick a future date!";
    valid = false;
  } else document.getElementById("dateError").innerText = "";

  if (!valid) e.preventDefault();
});
