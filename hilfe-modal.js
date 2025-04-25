document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".hilfe-button");
  const modals = document.querySelectorAll(".hilfe-modal");

  buttons.forEach((button) => {
    const target = button.getAttribute("data-target");
    const modal = document.getElementById(target);

    if (!modal) return;

    button.addEventListener("mouseenter", () => {
      modal.style.display = "block";
    });

    button.addEventListener("mouseleave", () => {
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    });

    modal.addEventListener("mouseenter", () => {
      modal.style.display = "block";
    });

    modal.addEventListener("mouseleave", () => {
      modal.style.display = "none";
    });
  });
});
