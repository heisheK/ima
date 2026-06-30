const importedItems = [
  { id: "w1", type: "公众号", title: "AI 产品真正的分水岭，不是聊天，而是完成任务", meta: "微信收藏 · 今天 09:12", color: "#20c36b", selected: false },
  { id: "p1", type: "论文", title: "Generative AI for Sensemaking and Writing", meta: "PDF · 18 页 · 已标注", color: "#2f7df6", selected: false },
  { id: "n1", type: "笔记", title: "NotebookLM 对比记录：停在问答，没有进入产出", meta: "知识库笔记 · 昨天", color: "#8b5cf6", selected: false },
  { id: "m1", type: "会议", title: "产品训练营头脑风暴纪要", meta: "会议纪要 · 含 7 条待办", color: "#f59e0b", selected: false },
  { id: "web1", type: "网页", title: "AI 工作流工具的五种设计范式", meta: "网页剪藏 · 6 月 10 日", color: "#14b8a6", selected: false }
];

const presets = {
  wechat: { type: "公众号", title: "新导入：AI 原生产品小组讨论纪要", meta: "公众号 · 刚刚导入", color: "#20c36b" },
  paper: { type: "论文", title: "新导入：Human-AI Collaboration", meta: "PDF · 刚刚导入", color: "#2f7df6" },
  web: { type: "网页", title: "新导入：AI 知识库产品分析", meta: "网页 · 刚刚导入", color: "#14b8a6" },
  note: { type: "笔记", title: "新导入：ima 产品训练营想法", meta: "笔记 · 刚刚导入", color: "#8b5cf6" },
  meeting: { type: "会议", title: "新导入：项目讨论会议纪要", meta: "会议 · 刚刚导入", color: "#f59e0b" }
};

const outputModes = {
  notes: { hint: "结构化笔记实时生成", sections: ["一句话结论", "共同主题", "核心观点", "来源与证据", "我的行动清单"] },
  review: { hint: "多资料综述实时生成", sections: ["问题背景", "资料共识", "差异观点", "可引用证据", "后续研究问题"] },
  minutes: { hint: "纪要与待办实时生成", sections: ["讨论摘要", "关键结论", "分歧与风险", "待办事项", "下次跟进"] },
  outline: { hint: "文章/汇报大纲实时生成", sections: ["标题方向", "开头问题", "主体结构", "案例证据", "结尾落点"] },
  quotes: { hint: "金句与素材摘录实时生成", sections: ["可做标题", "开头素材", "观点金句", "案例表达", "结尾表达"] }
};

const sourceList = document.querySelector("#sourceList");
const selectedCount = document.querySelector("#selectedCount");
const cardBank = document.querySelector("#cardBank");
const canvas = document.querySelector("#canvas");
const outputDraft = document.querySelector("#outputDraft");
const outputHint = document.querySelector("#outputHint");
const answerBox = document.querySelector("#answerBox");
const toast = document.querySelector("#toast");
let currentMode = "notes";
let canvasCards = [];
let dragOffset = { x: 0, y: 0 };

function selectedItems() { return importedItems.filter(item => item.selected); }
function sourceSummary() {
  const map = selectedItems().reduce((acc, item) => { acc[item.type] = (acc[item.type] || 0) + 1; return acc; }, {});
  return Object.entries(map).map(([type, count]) => `${count} 个${type}`).join("、") || "未选择资料";
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}
function cards() {
  const count = selectedItems().length;
  return [
    { type: "主题摘要", title: `从 ${count} 个资料中提炼共同主题`, body: count ? `已选资料包含 ${sourceSummary()}。它们共同指向：AI 产品需要从回答问题进入整理资料、形成结构、沉淀知识的工作流。` : "请先选择至少一个资料来源。", source: count ? `${count} 个已选来源` : "未选择来源", color: "#20c36b" },
    { type: "观点合并", title: "合并相似观点，保留差异", body: "系统把论文概念、公众号表达、笔记判断和会议行动项合并到同一结构里，避免重复整理。", source: "跨来源观点聚类", color: "#2f7df6" },
    { type: "证据索引", title: "每条结论都能回到来源", body: "生成内容保留来源，便于回看原文、插入引用或追溯会议结论。", source: "来源追溯", color: "#8b5cf6" },
    { type: "可复用表达", title: "提炼可写进文章/汇报的表达", body: "不是把资料塞进知识库就结束，而是把资料变成可理解、可复习、可调用的内容资产。", source: "表达提炼", color: "#f59e0b" },
    { type: "下一步行动", title: "生成后继续沉淀和调用", body: "保存到 ima 知识库后，可继续追问生成公众号文章、论文综述、会议纪要、PPT 大纲或研究问题。", source: "知识库沉淀建议", color: "#ef4444" }
  ];
}
function renderSources() {
  sourceList.innerHTML = "";
  importedItems.forEach(item => {
    const label = document.createElement("label");
    label.className = `source-item ${item.selected ? "selected" : ""}`;
    label.innerHTML = `<input type="checkbox" ${item.selected ? "checked" : ""}><span class="source-dot" style="background:${item.color}"></span><span class="source-copy"><strong>${item.title}</strong><small>${item.type} · ${item.meta}</small></span>`;
    label.querySelector("input").addEventListener("change", event => { item.selected = event.target.checked; renderAll(false); });
    sourceList.appendChild(label);
  });
  selectedCount.textContent = `已选 ${selectedItems().length} 项`;
}
function renderAnswer() {
  answerBox.innerHTML = `<p>当前目标：把 ${selectedItems().length} 个已选资料合并整理成「${outputModes[currentMode].hint.replace("实时生成", "")}」。</p><p>已选来源：${sourceSummary()}。ima 会自动去重相似观点，保留来源，生成主题摘要、观点卡片、证据索引和行动清单。</p>`;
}
function renderCardBank() {
  cardBank.innerHTML = "";
  cards().forEach((card, index) => {
    const node = document.createElement("article");
    node.className = "research-card";
    node.draggable = true;
    node.style.borderLeftColor = card.color;
    node.innerHTML = `<div class="card-top"><span class="card-type">${card.type}</span><button class="add-card" type="button">＋</button></div><h4>${card.title}</h4><p>${card.body}</p><span class="source-chip">${card.source}</span>`;
    node.addEventListener("dragstart", event => event.dataTransfer.setData("text/plain", String(index)));
    node.querySelector("button").addEventListener("click", () => addToCanvas(index));
    cardBank.appendChild(node);
  });
}
function addToCanvas(index, position = null, notify = true) {
  const card = cards()[index];
  const count = canvasCards.length;
  canvasCards.push({ ...card, id: crypto.randomUUID(), x: position?.x ?? 18 + (count % 2) * 226, y: position?.y ?? 18 + Math.floor(count / 2) * 128 });
  renderCanvas(); renderOutput();
  if (notify) showToast(`已加入输出结构：${card.type}`);
}
function seedCanvas() { canvasCards = []; addToCanvas(0, { x: 18, y: 18 }, false); addToCanvas(1, { x: 244, y: 18 }, false); }
function renderCanvas() {
  canvas.querySelectorAll(".canvas-card").forEach(node => node.remove());
  canvas.querySelector(".canvas-empty").style.display = canvasCards.length ? "none" : "grid";
  canvasCards.forEach(item => {
    const node = document.createElement("article");
    node.className = "canvas-card";
    node.style.left = `${item.x}px`;
    node.style.top = `${item.y}px`;
    node.style.borderLeftColor = item.color;
    node.dataset.id = item.id;
    node.innerHTML = `<span class="card-type">${item.type}</span><h4>${item.title}</h4><p>${item.body}</p>`;
    node.addEventListener("pointerdown", startMove);
    canvas.appendChild(node);
  });
}
function startMove(event) {
  const node = event.currentTarget;
  const rect = node.getBoundingClientRect();
  dragOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  node.setPointerCapture(event.pointerId);
  node.classList.add("dragging");
  node.addEventListener("pointermove", moveCard);
  node.addEventListener("pointerup", stopMove, { once: true });
}
function moveCard(event) {
  const node = event.currentTarget;
  const rect = canvas.getBoundingClientRect();
  const item = canvasCards.find(card => card.id === node.dataset.id);
  item.x = Math.max(12, event.clientX - rect.left - dragOffset.x + canvas.scrollLeft);
  item.y = Math.max(12, event.clientY - rect.top - dragOffset.y + canvas.scrollTop);
  node.style.left = `${item.x}px`; node.style.top = `${item.y}px`;
}
function stopMove(event) { event.currentTarget.classList.remove("dragging"); event.currentTarget.removeEventListener("pointermove", moveCard); renderOutput(); }
function renderOutput() {
  const config = outputModes[currentMode];
  outputHint.textContent = config.hint;
  const selected = canvasCards.length ? canvasCards : cards().slice(0, 3);
  outputDraft.innerHTML = config.sections.map((section, index) => {
    const card = selected[index % selected.length];
    return `<section class="draft-section"><h4>${index + 1}. ${section}</h4><p>${card.body} 来源：${card.source}。</p></section>`;
  }).join("");
}
function renderAll(resetCanvas = true) { renderSources(); renderAnswer(); renderCardBank(); if (resetCanvas) seedCanvas(); else seedCanvas(); renderOutput(); }
function addAllCards() { canvasCards = []; cards().forEach((_, index) => addToCanvas(index, { x: 18 + (index % 2) * 226, y: 18 + Math.floor(index / 2) * 128 }, false)); renderCanvas(); renderOutput(); showToast("已把全部卡片加入输出结构"); }
function importKind(kind) { importedItems.unshift({ id: crypto.randomUUID(), ...presets[kind], selected: true }); renderAll(); showToast(`已导入 1 个${presets[kind].type}并自动选中`); }

document.querySelector("#selectAllBtn").addEventListener("click", () => { importedItems.forEach(item => item.selected = true); renderAll(); });
document.querySelector("#invertSelectBtn").addEventListener("click", () => { importedItems.forEach(item => item.selected = !item.selected); renderAll(); });
document.querySelector("#generateBtn").addEventListener("click", addAllCards);
document.querySelector("#addAllBtn").addEventListener("click", addAllCards);
document.querySelector("#clearCanvasBtn").addEventListener("click", () => { canvasCards = []; renderCanvas(); renderOutput(); showToast("输出结构已清空"); });
document.querySelector("#docBtn").addEventListener("click", () => showToast("已保存到 ima 知识库，并可导出为腾讯文档"));
document.querySelector("#importWechatBtn").addEventListener("click", () => importKind("wechat"));
document.querySelector("#importPaperBtn").addEventListener("click", () => importKind("paper"));
document.querySelector("#importWebBtn").addEventListener("click", () => importKind("web"));
document.querySelector("#importNoteBtn").addEventListener("click", () => importKind("note"));
document.querySelector("#importMeetingBtn").addEventListener("click", () => importKind("meeting"));
document.querySelectorAll(".mode-tabs button").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".mode-tabs button").forEach(btn => btn.classList.remove("active")); button.classList.add("active"); currentMode = button.dataset.mode; renderAnswer(); renderOutput(); }));
canvas.addEventListener("dragover", event => { event.preventDefault(); canvas.classList.add("drag-over"); });
canvas.addEventListener("dragleave", () => canvas.classList.remove("drag-over"));
canvas.addEventListener("drop", event => { event.preventDefault(); canvas.classList.remove("drag-over"); const index = Number(event.dataTransfer.getData("text/plain")); const rect = canvas.getBoundingClientRect(); addToCanvas(index, { x: event.clientX - rect.left + canvas.scrollLeft - 96, y: event.clientY - rect.top + canvas.scrollTop - 30 }); });
renderAll();
