document.addEventListener("DOMContentLoaded", () => {
  const courseSelect = document.getElementById("course");
  const classSelect = document.getElementById("studentClass");
  const electivesContainer = document.getElementById("electivesContainer");
  const mdcContainer = document.getElementById("mdcContainer");
  const registrationForm = document.getElementById("registrationForm");
  const messageBox = document.getElementById("message");

  // ── Elective options per course ──────────────────────────────────────────
  const courseConfig = {
    "MCA": {
      options: ["Cloud Computing", "Cyber Security", "Mobile App Development"],
      disabled: false,
      classes: ["MCA A", "MCA B", "MCA C", "MCA D"],
    },
    "MSC CS": {
      options: [],
      disabled: true,
      classes: ["MSc CS A"],
    },
    "MSC DS": {
      options: ["Big Data Analytics", "Machine Learning"],
      disabled: false,
      classes: ["MSc DS A"],
    },
  };

  // ── MDC options with seat limits ─────────────────────────────────────────
  const mdcOptions = [
    { value: "MDC Option 1", label: "MDC Option 1", seats: 180 },
    { value: "MDC Option 2", label: "MDC Option 2", seats: 71 },
    { value: "MDC Option 3", label: "MDC Option 3", seats: 72 },
  ];

  // Seat availability fetched from backend (keyed by MDC option value)
  let mdcAvailability = {};

  // ── Fetch current MDC seat availability ─────────────────────────────────
  async function fetchMdcAvailability() {
    try {
      const res = await fetch(
        "https://elective-backend.vercel.app/api/mdc-seats",
      );
      if (res.ok) {
        mdcAvailability = await res.json(); // { "MDC Option 1": 12, ... } (filled seats)
      }
    } catch (err) {
      console.warn(
        "Could not fetch MDC availability, seat info may be inaccurate.",
      );
    }
  }

  // ── Render elective dropdowns ────────────────────────────────────────────
  function renderElectives(course) {
    electivesContainer.innerHTML = "";
    const config = courseConfig[course];
    if (!config) return;

    const group = document.createElement("div");
    group.className = "form-group elective-group";

    const label = document.createElement("label");
    label.textContent = "Select Elective";
    label.setAttribute("for", "elective1");

    const select = document.createElement("select");
    select.id = "elective1";
    select.name = "elective1";

    if (config.disabled) {
      select.disabled = true;
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.selected = true;
      defaultOption.textContent = "-- No Elective Selection --";
      select.appendChild(defaultOption);
    } else {
      select.required = true;
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.disabled = true;
      defaultOption.selected = true;
      defaultOption.textContent = "-- Select Elective --";
      select.appendChild(defaultOption);

      config.options.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
    }

    group.appendChild(label);
    group.appendChild(select);
    electivesContainer.appendChild(group);
  }

  // ── Render MDC dropdown (shown for every course) ─────────────────────────
  function renderMdc() {
    mdcContainer.innerHTML = "";

    const group = document.createElement("div");
    group.className = "form-group mdc-group";

    const label = document.createElement("label");
    label.textContent = "Select MDC (Multidisciplinary Course)";
    label.setAttribute("for", "mdcSelect");

    const select = document.createElement("select");
    select.id = "mdcSelect";
    select.name = "mdc";
    select.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = "-- Select MDC Option --";
    select.appendChild(defaultOption);

    mdcOptions.forEach((opt) => {
      const filled = mdcAvailability[opt.value] || 0;
      const remaining = opt.seats - filled;
      const option = document.createElement("option");
      option.value = opt.value;

      if (remaining <= 0) {
        option.textContent = `${opt.label} (Full – No seats available)`;
        option.disabled = true;
      } else {
        option.textContent = `${opt.label} (${remaining} seat${remaining !== 1 ? "s" : ""} left)`;
      }
      select.appendChild(option);
    });

    const seatNote = document.createElement("p");
    seatNote.className = "seat-note";
    seatNote.textContent =
      "⚡ Seats are allocated on a first-come, first-serve basis.";

    group.appendChild(label);
    group.appendChild(select);
    group.appendChild(seatNote);
    mdcContainer.appendChild(group);
  }

  // ── Render class dropdown ────────────────────────────────────────────────
  function renderClasses(course) {
    classSelect.innerHTML = "";
    const config = courseConfig[course];
    if (!config) return;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = "-- Select Class --";
    classSelect.appendChild(defaultOption);

    config.classes.forEach((cls) => {
      const option = document.createElement("option");
      option.value = cls;
      option.textContent = cls;
      classSelect.appendChild(option);
    });
  }

  // ── On course change ─────────────────────────────────────────────────────
  courseSelect.addEventListener("change", async () => {
    const selectedCourse = courseSelect.value;
    await fetchMdcAvailability();
    renderClasses(selectedCourse);
    renderElectives(selectedCourse);
    renderMdc();
  });

  // ── Form submission ───────────────────────────────────────────────────────
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(registrationForm);
    const data = { electives: [] };
    formData.forEach((value, key) => {
      if (key.startsWith("elective")) {
        data.electives.push(value);
      } else {
        data[key] = value;
      }
    });

    // Show loading state
    const submitBtn = document.getElementById("submitBtn");
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "SUBMITTING...";
    submitBtn.disabled = true;

    try {
      const response = await fetch(
        "https://elective-backend.vercel.app/api/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (response.ok) {
        showMessage("Registration Successful! 🎉", "success");
        registrationForm.reset();
        electivesContainer.innerHTML = "";
        mdcContainer.innerHTML = "";
      } else {
        const errorMsg = result.error || "Registration failed.";
        if (errorMsg.includes("already registered")) {
          alert(errorMsg);
        } else if (errorMsg.includes("full") || errorMsg.includes("seats")) {
          // Refresh MDC dropdown to show updated seat counts
          await fetchMdcAvailability();
          renderMdc();
        }
        showMessage(errorMsg, "error");
      }
    } catch (error) {
      showMessage("Connection to server failed. Please try again.", "error");
    } finally {
      submitBtn.textContent = originalBtnText;
      submitBtn.disabled = false;
    }
  });

  // ── Show message helper ───────────────────────────────────────────────────
  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.style.display = "block";

    setTimeout(() => {
      messageBox.style.display = "none";
    }, 6000);
  }
});
