(function () {
  function semanticFluencyNow() {
    if (window.performance && typeof window.performance.now === "function") {
      return window.performance.now();
    }
    return Date.now();
  }

  jsPsych.plugins["semantic-fluency"] = (function () {
    var plugin = {};

    plugin.info = {
      name: "semantic-fluency",
      parameters: {
        cue: {
          type: jsPsych.plugins.parameterType.STRING,
          default: undefined,
        },
        category_type: {
          type: jsPsych.plugins.parameterType.STRING,
          default: "general",
        },
        duration_ms: {
          type: jsPsych.plugins.parameterType.INT,
          default: 120000,
        },
        min_display_ms: {
          type: jsPsych.plugins.parameterType.INT,
          default: 800,
        },
        prompt: {
          type: jsPsych.plugins.parameterType.HTML_STRING,
          default: "<p>Type one response at a time and press Enter or click Submit.</p>",
        },
        button_label: {
          type: jsPsych.plugins.parameterType.STRING,
          default: "Submit",
        },
        placeholder: {
          type: jsPsych.plugins.parameterType.STRING,
          default: "Enter one word or short phrase",
        },
        allow_empty: {
          type: jsPsych.plugins.parameterType.BOOL,
          default: false,
        },
        end_hold_ms: {
          type: jsPsych.plugins.parameterType.INT,
          default: 400,
        },
      },
    };

    plugin.trial = function (display_element, trial) {
      var startTime = semanticFluencyNow();
      var lastSubmitTime = startTime;
      var trialEnded = false;
      var responses = [];
      var timerId = null;

      display_element.innerHTML =
        "<div class='sf-trial'>" +
        "  <div class='sf-header'>" +
        "    <div>" +
        "      <p class='sf-label'>Category cue</p>" +
        "      <h1 class='sf-cue'>" + trial.cue + "</h1>" +
        "    </div>" +
        "    <div class='sf-timer' id='sf-timer'>2:00</div>" +
        "  </div>" +
        "  <div class='sf-helper'>" + trial.prompt + "</div>" +
        "  <form class='sf-form' id='sf-form' autocomplete='off'>" +
        "    <input class='sf-input' id='sf-input' type='text' placeholder='" + trial.placeholder + "' aria-label='Semantic fluency response' spellcheck='false' autofocus />" +
        "    <button class='sf-button' id='sf-submit-button' type='submit'>" + trial.button_label + "</button>" +
        "  </form>" +
        "  <div class='sf-status'>" +
        "    <div>Responses recorded: <span class='sf-count' id='sf-count'>0</span></div>" +
        "    <div>Press Enter after each response.</div>" +
        "  </div>" +
        "  <div class='sf-flash-zone' id='sf-flash-zone' aria-live='polite'></div>" +
        "  <div class='sf-ending' id='sf-ending' style='display:none;'>Time is up.</div>" +
        "</div>";

      var form = display_element.querySelector("#sf-form");
      var input = display_element.querySelector("#sf-input");
      var timerEl = display_element.querySelector("#sf-timer");
      var countEl = display_element.querySelector("#sf-count");
      var flashZone = display_element.querySelector("#sf-flash-zone");
      var endingEl = display_element.querySelector("#sf-ending");
      var submitButton = display_element.querySelector("#sf-submit-button");

      function normalizeResponse(value) {
        return value.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
      }

      function formatTime(milliseconds) {
        var totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
      }

      function addTransientChip(text) {
        var chip = document.createElement("div");
        chip.className = "sf-chip";
        chip.textContent = text;
        flashZone.appendChild(chip);

        window.setTimeout(function () {
          if (chip.parentNode) {
            chip.parentNode.removeChild(chip);
          }
        }, trial.min_display_ms + 150);
      }

      function recordResponse() {
        var raw = input.value;
        var cleaned = normalizeResponse(raw);
        var now;

        if (!cleaned && !trial.allow_empty) {
          return;
        }

        now = semanticFluencyNow();
        responses.push({
          text: cleaned,
          raw_text: raw,
          ordinal_position: responses.length + 1,
          rt_ms: Math.round(now - startTime),
          inter_response_ms: Math.round(now - lastSubmitTime),
        });

        lastSubmitTime = now;
        countEl.textContent = String(responses.length);
        addTransientChip(cleaned || "[blank]");
        input.value = "";
        input.focus();
      }

      function submitHandler(event) {
        event.preventDefault();
        if (trialEnded) {
          return;
        }
        recordResponse();
      }

      function endTrial() {
        var trialData;
        var trialDuration;

        if (trialEnded) {
          return;
        }

        trialEnded = true;
        window.clearInterval(timerId);
        form.removeEventListener("submit", submitHandler);
        input.disabled = true;
        submitButton.disabled = true;
        endingEl.style.display = "block";

        trialDuration = Math.round(semanticFluencyNow() - startTime);
        trialData = {
          cue: trial.cue,
          category_type: trial.category_type,
          duration_ms: trial.duration_ms,
          actual_duration_ms: trialDuration,
          response_count: responses.length,
          response_texts: responses.map(function (response) {
            return response.text;
          }),
          responses_json: JSON.stringify(responses),
          responses: responses,
        };

        window.setTimeout(function () {
          display_element.innerHTML = "";
          jsPsych.finishTrial(trialData);
        }, trial.end_hold_ms);
      }

      function tick() {
        var elapsed = semanticFluencyNow() - startTime;
        var remaining = trial.duration_ms - elapsed;
        timerEl.textContent = formatTime(remaining);

        if (remaining <= 0) {
          endTrial();
        }
      }

      form.addEventListener("submit", submitHandler);
      timerId = window.setInterval(tick, 100);
      tick();
    };

    return plugin;
  })();

  jsPsych.plugins["fluency-countdown"] = (function () {
    var plugin = {};

    plugin.info = {
      name: "fluency-countdown",
      parameters: {
        seconds: {
          type: jsPsych.plugins.parameterType.INT,
          default: 5,
        },
        label: {
          type: jsPsych.plugins.parameterType.HTML_STRING,
          default: "<p>The next task will begin shortly.</p>",
        },
      },
    };

    plugin.trial = function (display_element, trial) {
      var totalMs = trial.seconds * 1000;
      var startTime = semanticFluencyNow();
      var intervalId = null;
      var finished = false;

      display_element.innerHTML =
        "<div class='sf-countdown-screen'>" +
        "  <div class='sf-countdown-wrap'>" +
        "    <div class='sf-countdown-bar-shell' aria-hidden='true'>" +
        "      <div class='sf-countdown-bar' id='sf-countdown-bar'></div>" +
        "    </div>" +
        "    <div class='sf-countdown-label'>" + trial.label + "</div>" +
        "    <div class='sf-countdown-number' id='sf-countdown-number'>" + trial.seconds + "</div>" +
        "  </div>" +
        "</div>";

      var numberEl = display_element.querySelector("#sf-countdown-number");
      var barEl = display_element.querySelector("#sf-countdown-bar");

      function endTrial() {
        if (finished) {
          return;
        }

        finished = true;
        window.clearInterval(intervalId);
        display_element.innerHTML = "";
        jsPsych.finishTrial({
          countdown_seconds: trial.seconds,
        });
      }

      function update() {
        var elapsed = semanticFluencyNow() - startTime;
        var remaining = Math.max(0, totalMs - elapsed);
        var displayNumber = Math.max(1, Math.ceil(remaining / 1000));
        var progress = totalMs === 0 ? 0 : Math.max(0, remaining / totalMs);

        numberEl.textContent = String(displayNumber);
        barEl.style.transform = "scaleX(" + progress + ")";

        if (remaining <= 0) {
          endTrial();
        }
      }

      intervalId = window.setInterval(update, 100);
      update();
    };

    return plugin;
  })();

  jsPsych.plugins["semantic-fluency-demo"] = (function () {
    var plugin = {};

    plugin.info = {
      name: "semantic-fluency-demo",
      parameters: {
        cue: {
          type: jsPsych.plugins.parameterType.STRING,
          default: "Vehicles",
        },
        duration_ms: {
          type: jsPsych.plugins.parameterType.INT,
          default: 20000,
        },
        min_display_ms: {
          type: jsPsych.plugins.parameterType.INT,
          default: 800,
        },
        prompt: {
          type: jsPsych.plugins.parameterType.HTML_STRING,
          default: "<p>Please generate as many words or short phrases related to this category as you can.</p>",
        },
        intro_html: {
          type: jsPsych.plugins.parameterType.HTML_STRING,
          default: "<p>This is a demonstration only.</p>",
        },
        note_html: {
          type: jsPsych.plugins.parameterType.HTML_STRING,
          default: "",
        },
        button_label: {
          type: jsPsych.plugins.parameterType.STRING,
          default: "Submit",
        },
        continue_label: {
          type: jsPsych.plugins.parameterType.STRING,
          default: "Begin Experiment",
        },
        placeholder: {
          type: jsPsych.plugins.parameterType.STRING,
          default: "Enter one word or short phrase",
        },
      },
    };

    plugin.trial = function (display_element, trial) {
      var startTime = semanticFluencyNow();
      var trialEnded = false;
      var responseCount = 0;
      var intervalId = null;

      display_element.innerHTML =
        "<div class='sf-ready'>" +
        "  <h2>Thank You</h2>" +
        trial.intro_html +
        trial.note_html +
        "  <div class='sf-trial'>" +
        "    <div class='sf-header'>" +
        "      <div>" +
        "        <p class='sf-label'>Category cue</p>" +
        "        <h1 class='sf-cue'>" + trial.cue + "</h1>" +
        "      </div>" +
        "      <div class='sf-timer' id='sf-demo-timer'>0:20</div>" +
        "    </div>" +
        "    <div class='sf-helper'>" + trial.prompt + "</div>" +
        "    <form class='sf-form' id='sf-demo-form' autocomplete='off'>" +
        "      <input class='sf-input' id='sf-demo-input' type='text' placeholder='" + trial.placeholder + "' aria-label='Semantic fluency demonstration response' spellcheck='false' autofocus />" +
        "      <button class='sf-button' id='sf-demo-submit' type='submit'>" + trial.button_label + "</button>" +
        "    </form>" +
        "    <div class='sf-status'>" +
        "      <div>Responses recorded: <span class='sf-count' id='sf-demo-count'>0</span></div>" +
        "      <div>Press Enter after each response.</div>" +
        "    </div>" +
        "    <div class='sf-flash-zone' id='sf-demo-flash-zone' aria-live='polite'></div>" +
        "    <div class='sf-ending' id='sf-demo-ending' style='display:none;'>Demonstration timer complete.</div>" +
        "  </div>" +
        "  <div class='sf-demo-actions'>" +
        "    <button class='sf-begin-experiment' id='sf-begin-experiment' type='button'>" + trial.continue_label + "</button>" +
        "  </div>" +
        "</div>";

      var form = display_element.querySelector("#sf-demo-form");
      var input = display_element.querySelector("#sf-demo-input");
      var timerEl = display_element.querySelector("#sf-demo-timer");
      var countEl = display_element.querySelector("#sf-demo-count");
      var flashZone = display_element.querySelector("#sf-demo-flash-zone");
      var endingEl = display_element.querySelector("#sf-demo-ending");
      var continueButton = display_element.querySelector("#sf-begin-experiment");
      var submitButton = display_element.querySelector("#sf-demo-submit");

      function normalizeResponse(value) {
        return value.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
      }

      function formatTime(milliseconds) {
        var totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        var minutes = Math.floor(totalSeconds / 60);
        var seconds = totalSeconds % 60;
        return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
      }

      function addTransientChip(text) {
        var chip = document.createElement("div");
        chip.className = "sf-chip";
        chip.textContent = text;
        flashZone.appendChild(chip);

        window.setTimeout(function () {
          if (chip.parentNode) {
            chip.parentNode.removeChild(chip);
          }
        }, trial.min_display_ms + 150);
      }

      function lockDemo() {
        input.disabled = true;
        submitButton.disabled = true;
        endingEl.style.display = "block";
      }

      function submitHandler(event) {
        var cleaned;

        event.preventDefault();
        if (trialEnded || input.disabled) {
          return;
        }

        cleaned = normalizeResponse(input.value);
        if (!cleaned) {
          return;
        }

        responseCount += 1;
        countEl.textContent = String(responseCount);
        addTransientChip(cleaned);
        input.value = "";
        input.focus();
      }

      function continueHandler() {
        if (trialEnded) {
          return;
        }

        trialEnded = true;
        window.clearInterval(intervalId);
        form.removeEventListener("submit", submitHandler);
        continueButton.removeEventListener("click", continueHandler);
        display_element.innerHTML = "";
        jsPsych.finishTrial({
          demo_cue: trial.cue,
          demo_response_count: responseCount,
        });
      }

      function update() {
        var elapsed = semanticFluencyNow() - startTime;
        var remaining = Math.max(0, trial.duration_ms - elapsed);

        timerEl.textContent = formatTime(remaining);

        if (remaining <= 0) {
          window.clearInterval(intervalId);
          lockDemo();
        }
      }

      form.addEventListener("submit", submitHandler);
      continueButton.addEventListener("click", continueHandler);
      intervalId = window.setInterval(update, 100);
      update();
    };

    return plugin;
  })();
})();
