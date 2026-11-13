/**
 * B2B partnership inquiry.
 * Posts to the same Formspree endpoint as the public contact form.
 * Success is shown only after that request succeeds.
 */
(function () {
  var form = document.getElementById("b2b-form");
  if (!form) return;

  var statusEl = document.getElementById("b2b-status");
  var submitBtn = document.getElementById("b2b-submit");
  var defaultLabel = submitBtn ? submitBtn.textContent : "Send Partnership Inquiry";
  var sending = false;
  var fallbackError = "We could not send your inquiry. Please try again, or email bookingmongoliatour@gmail.com.";

  var requiredFields = [
    ["company_name", "Enter your company or agency name."],
    ["country", "Enter your country."],
    ["contact_person", "Enter the contact person's name."],
    ["email", "Enter a business email."],
    ["business_type", "Select your type of business."],
    ["partnership_interest", "Select a partnership interest."],
    ["message", "Tell us about the cooperation you are interested in."]
  ];

  function setStatus(kind, text) {
    if (!statusEl) return;
    statusEl.className = "b2b-status" + (kind ? " is-" + kind : "");
    statusEl.textContent = text || "";
    if (text) statusEl.removeAttribute("hidden");
    else statusEl.setAttribute("hidden", "");
  }

  function setFieldError(name, message) {
    var error = form.querySelector('[data-error-for="' + name + '"]');
    var field = form.elements[name];
    if (error) error.textContent = message || "";
    if (field) {
      if (message) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }
  }

  function clearErrors() {
    requiredFields.forEach(function (pair) {
      setFieldError(pair[0], "");
    });
  }

  function validate() {
    var ok = true;
    var firstInvalid = null;
    requiredFields.forEach(function (pair) {
      var field = form.elements[pair[0]];
      var value = field && typeof field.value === "string" ? field.value.trim() : "";
      if (!value) {
        setFieldError(pair[0], pair[1]);
        ok = false;
        if (!firstInvalid && field) firstInvalid = field;
      } else {
        setFieldError(pair[0], "");
      }
    });

    var emailField = form.elements.email;
    var email = emailField && typeof emailField.value === "string" ? emailField.value.trim() : "";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError("email", "Enter a valid email address, such as name@company.com.");
      ok = false;
      if (!firstInvalid) firstInvalid = emailField;
    }
    var emailInvalid = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return { ok: ok, firstInvalid: firstInvalid, emailInvalid: emailInvalid };
  }

  function errorFromBody(body) {
    if (!body || typeof body !== "object") return fallbackError;
    if (typeof body.error === "string" && body.error.trim()) return body.error.trim();
    if (Array.isArray(body.errors)) {
      var messages = body.errors
        .map(function (item) {
          return item && typeof item.message === "string" ? item.message.trim() : "";
        })
        .filter(Boolean);
      if (messages.length) return messages.join(" ");
    }
    return fallbackError;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (sending) return;

    setStatus("", "");
    clearErrors();
    var result = validate();
    if (!result.ok) {
      setStatus(
        "error",
        result.emailInvalid && result.firstInvalid === form.elements.email
          ? "Enter a valid business email before sending."
          : "Please complete the required fields before sending."
      );
      if (result.firstInvalid && result.firstInvalid.focus) result.firstInvalid.focus();
      return;
    }

    requiredFields.forEach(function (pair) {
      var field = form.elements[pair[0]];
      if (field && typeof field.value === "string") field.value = field.value.trim();
    });

    sending = true;
    form.setAttribute("aria-busy", "true");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (response) {
        return response.json().catch(function () { return null; }).then(function (body) {
          if (!response.ok || (body && body.ok === false)) {
            throw new Error(errorFromBody(body));
          }
        });
      })
      .then(function () {
        form.reset();
        form.hidden = true;
        setStatus("success", "Thank you. Your partnership inquiry was sent. Our team will contact you to discuss partnership opportunities.");
      })
      .catch(function (error) {
        var message = error && error.message ? error.message : fallbackError;
        if (message === "Failed to fetch" || /network/i.test(message)) message = fallbackError;
        setStatus("error", message);
      })
      .then(function () {
        sending = false;
        form.removeAttribute("aria-busy");
        if (submitBtn && !form.hidden) {
          submitBtn.disabled = false;
          submitBtn.textContent = defaultLabel;
        }
      });
  });
})();
