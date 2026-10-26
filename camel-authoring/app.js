const promptField = document.querySelector("#prompt");
const createButton = document.querySelector("#create");
const status = document.querySelector("#status");
const result = document.querySelector("#result");

createButton.addEventListener("click", () => {
  if (!promptField.value.trim()) {
    promptField.focus();
    status.textContent = "Describe the game you want to make.";
    return;
  }

  const heading = document.createElement("h2");
  heading.textContent = "Authoring service not connected";
  const details = document.createElement("p");
  details.textContent = "This is the hosted presentation module. Prompt generation and Cerebras key handling require a separate private CAMEL and NexusEngine service.";
  result.replaceChildren(heading, details);
  result.hidden = false;
  status.textContent = "Presentation preview · generation service pending";
});

promptField.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") createButton.click();
});
