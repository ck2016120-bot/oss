const form = document.getElementById("plannerForm");
const planList = document.getElementById("planList");

let plans = [];

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const date = document.getElementById("date").value;
  const venue = document.getElementById("venue").value;
  const theme = document.getElementById("theme").value;
  const budget = document.getElementById("budget").value;

  const plan = { name, date, venue, theme, budget };
  plans.push(plan);
  displayPlans();
  form.reset();
});

function displayPlans() {
  planList.innerHTML = "";
  plans.forEach((plan, index) => {
    const div = document.createElement("div");
    div.classList.add("plan");
    div.innerHTML = `
      <strong>${plan.name}</strong> 🎂<br>
      📅 ${plan.date}<br>
      📍 ${plan.venue}<br>
      🌈 Theme: ${plan.theme}<br>
      💰 Budget: ₹${plan.budget}
      <button class="delete-btn" onclick="deletePlan(${index})">Delete</button>
    `;
    planList.appendChild(div);
  });
}

function deletePlan(index) {
  plans.splice(index, 1);
  displayPlans();
}
