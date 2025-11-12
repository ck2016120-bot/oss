const contactForm = document.getElementById("contact-form");
const statusMsg = document.getElementById("statusMsg");

contactForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const params = {
    from_name: document.getElementById("fromName").value,
    from_email: document.getElementById("fromEmail").value,
    message: document.getElementById("message").value
  };

  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", params)
    .then(() => {
      statusMsg.textContent = "✅ Message sent successfully!";
      contactForm.reset();
    })
    .catch(() => {
      statusMsg.textContent = "❌ Failed to send. Try again later.";
    });
});
