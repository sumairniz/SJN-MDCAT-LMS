"use strict";
// Step 2 is an inert interface preview. There are NO auth or data endpoints,
// credentials are never collected, and no administration actions are enabled.
(function () {
  const signIn = document.getElementById("signin");
  const workspace = document.getElementById("workspace");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const menuToggle = document.getElementById("menu-toggle");
  const openButton = document.getElementById("preview-open");
  const closeButton = document.getElementById("preview-close");
  const overviewOnly = document.getElementById("overview-only");
  const placeholder = document.getElementById("module-placeholder");
  const teamPreview = document.getElementById("team-preview");
  const heading = document.getElementById("module-heading");
  const description = document.getElementById("module-description");
  const crumb = document.getElementById("header-crumb");
  const placeholderTitle = document.getElementById("module-placeholder-title");
  const placeholderCopy = document.getElementById("module-placeholder-copy");
  const phase = document.getElementById("page-phase");

  const modules = Object.freeze({
    overview: ["Academy Overview", "Your academy operations, organized in one place. Live metrics become available after secure staff authentication.", "FOUNDATION PREVIEW"],
    questions: ["Question Content Studio", "Create and review MCQs, organize SJN and Past Papers Question Banks, and manage subject, chapter and topic metadata.", "FUTURE CONTENT PHASE"],
    papers: ["Full-Length Past Papers", "Manage paper years, regions, codes, question sets and source-preserving academic corrections.", "FUTURE CONTENT PHASE"],
    courses: ["Courses & Sessions", "Configure course sessions, tests, schedules and content availability without changing the student exam engine.", "FUTURE COURSE PHASE"],
    resources: ["Academy Resources", "Organize protected folders, PDFs and supporting learning resources with authorized staff workflows.", "FUTURE RESOURCE PHASE"],
    students: ["Student Management", "View authorized student records, academic performance and account status once student-scoped permissions exist.", "FUTURE ACCESS PHASE"],
    access: ["Feature & Enrollment Access", "Manage whole-feature Free or Premium policies and whole-course/session enrollment. Individual questions are never premium products.", "FUTURE ACCESS PHASE"],
    reviews: ["Academic Reviews", "Choose direct publishing or one/two reviewers according to the Owner's content-review policy.", "FUTURE REVIEW PHASE"],
    team: ["Team & Permissions", "One protected Owner, peer Management Team Members and optional individual titles and nicknames — completely separate from technical permissions.", "NEXT: PHASE 1A"],
    reports: ["Reports & Activity", "Review academic issue reports, authorized operational events and transparent management audit records.", "FUTURE OPERATIONS PHASE"],
    settings: ["Academy Settings", "Manage supported academy configuration with explicit permission checks and activity history.", "FUTURE OPERATIONS PHASE"]
  });

  function closeMenu() {
    sidebar.classList.remove("sidebar--open");
    scrim.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  }
  function showPreview() {
    signIn.classList.add("is-hidden");
    workspace.classList.remove("is-hidden");
    workspace.setAttribute("aria-hidden", "false");
    signIn.setAttribute("aria-hidden", "true");
    selectModule("overview");
    window.scrollTo(0, 0);
    document.getElementById("module-heading").focus?.();
  }
  function returnToSignIn() {
    closeMenu();
    workspace.classList.add("is-hidden");
    workspace.setAttribute("aria-hidden", "true");
    signIn.classList.remove("is-hidden");
    signIn.setAttribute("aria-hidden", "false");
    window.scrollTo(0, 0);
    openButton.focus();
  }
  function selectModule(key) {
    const data = modules[key];
    if (!data) return;
    heading.textContent = data[0];
    description.textContent = data[1];
    crumb.textContent = key === "overview" ? "Overview" : data[0];
    phase.textContent = data[2];
    overviewOnly.classList.toggle("is-hidden", key !== "overview");
    teamPreview.classList.toggle("is-hidden", key !== "team");
    placeholder.classList.toggle("is-hidden", key === "overview" || key === "team");
    placeholderTitle.textContent = data[0];
    placeholderCopy.textContent = data[1];
    document.querySelectorAll("[data-module]").forEach(function (button) {
      const selected = button.dataset.module === key;
      button.classList.toggle("active", selected);
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    closeMenu();
    window.scrollTo(0, 0);
  }
  openButton.addEventListener("click", showPreview);
  closeButton.addEventListener("click", returnToSignIn);
  document.querySelectorAll("[data-module]").forEach(function (button) {
    button.addEventListener("click", function () { selectModule(button.dataset.module); });
  });
  menuToggle.addEventListener("click", function () {
    const open = !sidebar.classList.contains("sidebar--open");
    sidebar.classList.toggle("sidebar--open", open);
    scrim.hidden = !open;
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  scrim.addEventListener("click", closeMenu);
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeMenu();
  });
}());