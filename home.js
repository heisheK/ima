const skillUrl = "skill.html";
const toast = document.querySelector("#homeToast");

function showHomeToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showHomeToast.timer);
  showHomeToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function enterSkill() {
  showHomeToast("正在进入多源资料整理 Skill");
  window.setTimeout(() => {
    window.location.href = skillUrl;
  }, 280);
}

["#sidebarSkillBtn", "#promptSkillBtn", "#exampleSkillBtn", "#sendHomeBtn"].forEach(selector => {
  document.querySelector(selector)?.addEventListener("click", enterSkill);
});

document.querySelector("#attachHomeBtn")?.addEventListener("click", () => {
  showHomeToast("可先添加论文、网页、笔记、会议纪要，再进入多源整理");
});
