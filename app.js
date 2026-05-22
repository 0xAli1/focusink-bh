const modes = {
  pomodoro: { label: "Pomodoro", seconds: 25 * 60, minutes: 25, color: "#38D5C8" },
  short: { label: "Short Break", seconds: 5 * 60, minutes: 5, color: "#F7B955" },
  long: { label: "Long Break", seconds: 15 * 60, minutes: 15, color: "#F2685B" }
};

let mode = "pomodoro";
let remaining = modes[mode].seconds;
let total = modes[mode].seconds;
let timer = null;
let sessions = Number(localStorage.getItem("focusink.sessions") || 0);
let minutes = Number(localStorage.getItem("focusink.minutes") || 0);
let tasks = JSON.parse(localStorage.getItem("focusink.tasks") || "[]");

const timeValue = document.querySelector("#timeValue");
const modeLabel = document.querySelector("#modeLabel");
const progressCircle = document.querySelector("#progressCircle");
const startPause = document.querySelector("#startPause");
const reset = document.querySelector("#reset");
const skip = document.querySelector("#skip");
const complete = document.querySelector("#complete");
const taskInput = document.querySelector("#taskInput");
const inkPath = document.querySelector("#inkPath");
const focusMinutes = document.querySelector("#focusMinutes");
const streak = document.querySelector("#streak");
const tasksDone = document.querySelector("#tasksDone");
const sessionBadge = document.querySelector("#sessionBadge");
const statusMessage = document.querySelector("#statusMessage");

function format(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function render() {
  document.body.dataset.mode = mode;
  timeValue.textContent = format(remaining);
  modeLabel.textContent = modes[mode].label;
  const fraction = remaining / total;
  progressCircle.style.stroke = modes[mode].color;
  progressCircle.style.strokeDashoffset = String(590 * (1 - fraction));
  focusMinutes.textContent = minutes;
  streak.textContent = sessions > 0 ? 1 : 0;
  tasksDone.textContent = tasks.length;
  sessionBadge.textContent = `${sessions} session${sessions === 1 ? "" : "s"}`;
  inkPath.style.strokeDashoffset = String(Math.max(0, 980 - sessions * 110));
}

function setMode(next) {
  mode = next;
  remaining = modes[mode].seconds;
  total = remaining;
  clearInterval(timer);
  timer = null;
  startPause.textContent = "Start";
  document.querySelectorAll(".mode").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  render();
}

function nextMode() {
  if (mode !== "pomodoro") return "pomodoro";
  return sessions > 0 && sessions % 4 === 0 ? "long" : "short";
}

function completeSession() {
  clearInterval(timer);
  timer = null;
  startPause.textContent = "Start";
  if (mode === "pomodoro") {
    sessions += 1;
    minutes += modes.pomodoro.minutes;
    const note = taskInput.value.trim() || "Untitled focus session";
    tasks.unshift({ note, at: new Date().toLocaleString() });
    tasks = tasks.slice(0, 8);
    localStorage.setItem("focusink.sessions", String(sessions));
    localStorage.setItem("focusink.minutes", String(minutes));
    localStorage.setItem("focusink.tasks", JSON.stringify(tasks));
    const next = sessions % 4 === 0 ? "long" : "short";
    setMode(next);
    statusMessage.textContent = `Session complete. Ink map updated. Next: ${modes[next].label}.`;
  } else {
    setMode("pomodoro");
    statusMessage.textContent = "Break complete. Pomodoro mode ready.";
  }
}

function skipSession() {
  const next = nextMode();
  setMode(next);
  statusMessage.textContent = `Skipped to ${modes[next].label}. No focus progress was added.`;
}

document.querySelectorAll(".mode").forEach((button) => button.addEventListener("click", () => {
  setMode(button.dataset.mode);
  statusMessage.textContent = `${modes[mode].label} mode ready.`;
}));

startPause.addEventListener("click", () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
    startPause.textContent = "Resume";
    statusMessage.textContent = "Paused. Resume when ready.";
    return;
  }
  startPause.textContent = "Pause";
  statusMessage.textContent = `${modes[mode].label} timer running.`;
  timer = setInterval(() => {
    remaining = Math.max(0, remaining - 1);
    render();
    if (remaining === 0) completeSession();
  }, 1000);
});

reset.addEventListener("click", () => {
  setMode(mode);
  statusMessage.textContent = `${modes[mode].label} reset.`;
});
skip.addEventListener("click", skipSession);
complete.addEventListener("click", completeSession);

document.querySelector("#downloadReport").addEventListener("click", () => {
  const lines = [
    "FocusInk BH Focus Report",
    `Generated: ${new Date().toLocaleString()}`,
    `Completed Pomodoro sessions: ${sessions}`,
    `Focus minutes: ${minutes}`,
    "",
    "Recent task notes:",
    ...tasks.map((task, index) => `${index + 1}. ${task.note} (${task.at})`)
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "focusink-report.txt";
  a.click();
  URL.revokeObjectURL(url);
});

render();
