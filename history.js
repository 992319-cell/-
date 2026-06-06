// vehicle-list
let vehicleList = document.querySelector(".vehicle-list");
vehicleList.addEventListener("click", function (e) {
  let current = document.querySelector(".vehicle-current");
  if (e.target.closest(".vehicle-current")) {
    vehicleList.classList.toggle("open");
    return;
  }
  let clickedLi = e.target.closest("li");
  if (!clickedLi) {
    return;
  }
  [current.textContent, clickedLi.textContent] = [
    clickedLi.textContent,
    current.textContent,
  ];
  vehicleList.classList.remove("open");
});

// history-list
document.querySelectorAll(".history-summary").forEach((summary) => {
  summary.addEventListener("click", function () {
    summary.closest(".history-item").classList.toggle("open");
  });
});
