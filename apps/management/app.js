"use strict";
// Management shell navigation. Authentication and authorization live in auth-client.js
// and the verified Supabase Edge function, never in visible labels or client roles.
(function () {
  const signIn = document.getElementById("signin");
  const workspace = document.getElementById("workspace");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  const menuToggle = document.getElementById("menu-toggle");
  const auditPreview = document.getElementById("audit-preview");
  const closeButton = document.getElementById("preview-close");
  const overviewOnly = document.getElementById("overview-only");
  const placeholder = document.getElementById("module-placeholder");
  const teamPreview = document.getElementById("team-preview");
  const contentStudioPreview = document.getElementById("content-studio-preview");
  const syllabusManager = document.getElementById("syllabus-manager");
  const profilePreview = document.getElementById("profile-preview");
  const heading = document.getElementById("module-heading");
  const description = document.getElementById("module-description");
  const crumb = document.getElementById("header-crumb");
  const placeholderTitle = document.getElementById("module-placeholder-title");
  const placeholderCopy = document.getElementById("module-placeholder-copy");
  const phase = document.getElementById("page-phase");

  const modules = Object.freeze({
    overview: ["Academy Overview", "A centralized overview of academy activity, academic content, student engagement, and management operations.", "FOUNDATION PREVIEW"],
    questions: ["Question Content Studio", "Create and review question drafts against your Academy-approved syllabus, with CSV/Excel imports and direct editing.", "DRAFT CONTENT STUDIO"],
    syllabus: ["Syllabus & Taxonomy", "Build your Academy master syllabus independently of existing MCQs. Create, rename, move and archive chapters/topics.", "SYLLABUS MANAGER"],
    papers: ["Full-Length Past Papers", "Manage paper years, regions, codes, question sets and source-preserving academic corrections.", "FUTURE CONTENT PHASE"],
    courses: ["Courses & Sessions", "Configure course sessions, tests, schedules and content availability without changing the student exam engine.", "FUTURE COURSE PHASE"],
    resources: ["Academy Resources", "Organize protected folders, PDFs and supporting learning resources with authorized staff workflows.", "FUTURE RESOURCE PHASE"],
    students: ["Student Management", "View authorized student records, academic performance and account status once student-scoped permissions exist.", "FUTURE ACCESS PHASE"],
    access: ["Feature & Enrollment Access", "Manage whole-feature Free or Premium policies and whole-course/session enrollment. Individual questions are never premium products.", "FUTURE ACCESS PHASE"],
    reviews: ["Academic Reviews", "Choose direct publishing or one/two reviewers according to Chief Admin-configured academic review policies.", "FUTURE REVIEW PHASE"],
    team: ["Team & Permissions", "Chief Admin-controlled team membership with individual permissions, separate titles and detailed staff profiles.", "CHIEF ADMIN ACCESS"],
    profile: ["My Profile", "Your verified management identity, protected role and effective permissions, independent of optional display names and titles.", "VERIFIED PROFILE"],
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
    document.getElementById("email").focus();
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
    if (contentStudioPreview) contentStudioPreview.classList.toggle("is-hidden", key !== "questions");
    if (syllabusManager) syllabusManager.classList.toggle("is-hidden", key !== "syllabus");
    profilePreview.classList.toggle("is-hidden", key !== "profile");
    auditPreview.classList.toggle("is-hidden", key !== "reports");
    placeholder.classList.toggle("is-hidden", key === "overview" || key === "questions" || key === "syllabus" || key === "team" || key === "profile" || key === "reports");
    placeholderTitle.textContent = data[0];
    placeholderCopy.textContent = data[1];
    document.querySelectorAll("[data-module]").forEach(function (button) {
      const selected = button.dataset.module === key;
      button.classList.toggle("active", selected);
      if (selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    closeMenu();
    window.dispatchEvent(new CustomEvent("mednest:module", {detail: {key}}));
    window.scrollTo(0, 0);
  }
  window.addEventListener("mednest:authorized", showPreview);
  document.getElementById("profile-preview-open").addEventListener("click", function () { selectModule("profile"); });
  closeButton.addEventListener("click", function () { window.dispatchEvent(new Event("mednest:signout")); });
  window.addEventListener("mednest:signed-out",returnToSignIn);
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