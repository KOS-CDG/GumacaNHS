document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupActiveNavigation();
  setupSmoothScroll();
  setupRevealAnimations();
  loadAnnouncements();
  setupContactForm();
});
document.addEventListener("DOMContentLoaded", () => {
  setRealViewportHeight();
  window.addEventListener("resize", setRealViewportHeight);
  window.addEventListener("orientationchange", setRealViewportHeight);

  setupMobileMenu();
  setupActiveNavigation();
  setupSmoothScroll();
  setupRevealAnimations();
  loadAnnouncements();
  setupContactForm();
});

function setRealViewportHeight() {
  document.documentElement.style.setProperty("--real100vh", `${window.innerHeight}px`);
}

function setupMobileMenu() {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (!navToggle || !navMenu) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.classList.toggle("active", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = navMenu.contains(event.target);
    const clickedToggle = navToggle.contains(event.target);

    if (!clickedInsideMenu && !clickedToggle && navMenu.classList.contains("open")) {
      navMenu.classList.remove("open");
      navToggle.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }
  });
}

function setupActiveNavigation() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;

  const activeLink = document.querySelector(`[data-nav="${currentPage}"]`);
  if (activeLink) {
    activeLink.classList.add("active");
  }
}
function setupSmoothScroll() {
  const scrollLinks = document.querySelectorAll("[data-scroll]");

  scrollLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href || !href.startsWith("#")) return;

      const target = href === "#top" ? document.documentElement : document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      const navHeight = document.querySelector(".main-nav")?.offsetHeight || 0;
      const topPosition =
        href === "#top"
          ? 0
          : target.getBoundingClientRect().top + window.scrollY - navHeight + 1;

      window.scrollTo({
        top: topPosition,
        behavior: "smooth"
      });
    });
  });
}

function setupRevealAnimations() {
  const revealElements = document.querySelectorAll(".reveal");

  if (!revealElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14
    }
  );

  revealElements.forEach((element) => observer.observe(element));
}

async function loadAnnouncements() {
  const announcementList = document.getElementById("announcementList");
  const announcementStatus = document.getElementById("announcementStatus");

  if (!announcementList || !announcementStatus) return;

  announcementStatus.textContent = "Loading updates...";

  try {
    const response = await fetch("/api/announcements");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load announcements.");
    }

    const announcements = Array.isArray(result.data) ? result.data : [];
    announcementList.innerHTML = "";

    if (!announcements.length) {
      announcementStatus.textContent = "No updates available";
      announcementList.innerHTML = `
        <div class="announcement-empty">
          No announcements are available at this time.
        </div>
      `;
      return;
    }

    const isHomeLayout = announcementList.classList.contains("announcement-grid-home");
    const visibleAnnouncements = isHomeLayout ? announcements.slice(0, 3) : announcements;

    announcementStatus.textContent = `${visibleAnnouncements.length} update(s) available`;

    visibleAnnouncements.forEach((item) => {
      const article = document.createElement("article");
      article.className = "announcement-card reveal";
      article.innerHTML = `
        <div class="announcement-meta">
          <span class="meta-pill meta-date">${formatDate(item.date)}</span>
          <span class="meta-pill meta-category">${escapeHtml(item.category || "General")}</span>
        </div>
        <h3>${escapeHtml(item.title || "Untitled announcement")}</h3>
        <p>${escapeHtml(item.summary || "")}</p>
      `;
      announcementList.appendChild(article);
    });

    observeDynamicRevealItems();
  } catch (error) {
    announcementStatus.textContent = "Unable to load updates";
    announcementList.innerHTML = `
      <div class="announcement-empty">
        We could not retrieve the latest announcements right now. Please try again later.
      </div>
    `;
  }
}

function observeDynamicRevealItems() {
  const dynamicRevealItems = document.querySelectorAll(".announcement-card.reveal:not(.visible)");

  if (!dynamicRevealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14
    }
  );

  dynamicRevealItems.forEach((item) => observer.observe(item));
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  if (!form || !formStatus || !submitBtn) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearFormErrors(form);
    setFormStatus(formStatus, "", "");

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim()
    };

    const clientErrors = validateContactPayload(payload);

    if (Object.keys(clientErrors).length > 0) {
      displayFormErrors(form, clientErrors);
      setFormStatus(formStatus, "Please correct the highlighted fields and try again.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errors) {
          displayFormErrors(form, result.errors);
        }

        throw new Error(result.message || "Message submission failed.");
      }

      form.reset();
      setFormStatus(formStatus, result.message, "success");
    } catch (error) {
      setFormStatus(
        formStatus,
        error.message || "Something went wrong while sending your message.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });
}

function validateContactPayload(payload) {
  const errors = {};

  if (!payload.name || payload.name.length < 2) {
    errors.name = "Please enter your full name.";
  }

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!payload.subject || payload.subject.length < 3) {
    errors.subject = "Please enter a subject with at least 3 characters.";
  }

  if (!payload.message || payload.message.length < 10) {
    errors.message = "Please enter a message with at least 10 characters.";
  }

  return errors;
}

function displayFormErrors(form, errors) {
  Object.entries(errors).forEach(([fieldName, message]) => {
    const input = form.querySelector(`[name="${fieldName}"]`);
    const errorField = form.querySelector(`[data-error-for="${fieldName}"]`);

    if (input) {
      input.classList.add("input-error");
      input.setAttribute("aria-invalid", "true");
    }

    if (errorField) {
      errorField.textContent = message;
    }
  });
}

function clearFormErrors(form) {
  form.querySelectorAll(".input-error").forEach((input) => {
    input.classList.remove("input-error");
    input.removeAttribute("aria-invalid");
  });

  form.querySelectorAll(".error-text").forEach((field) => {
    field.textContent = "";
  });
}

function setFormStatus(element, message, type) {
  element.textContent = message;
  element.classList.remove("success", "error");

  if (type) {
    element.classList.add(type);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    };

    return map[char];
  });
}


