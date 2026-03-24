var jsPsychSemanticFluency = (function (jspsych) {
  "use strict";

  const info = {
    name: "semantic-fluency",
    parameters: {
      cue: {
        type: jspsych.ParameterType.STRING,
        default: undefined,
      },
      category_type: {
        type: jspsych.ParameterType.STRING,
        default: "general",
      },
      duration_ms: {
        type: jspsych.ParameterType.INT,
        default: 120000,
      },
      min_display_ms: {
        type: jspsych.ParameterType.INT,
        default: 800,
      },
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        default:
          "<p>Type one response at a time and press Enter or click Submit.</p>",
      },
      button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Submit",
      },
      placeholder: {
        type: jspsych.ParameterType.STRING,
        default: "Enter one word or short phrase",
      },
      allow_empty: {
        type: jspsych.ParameterType.BOOL,
        default: false,
      },
      end_hold_ms: {
        type: jspsych.ParameterType.INT,
        default: 400,
      },
    },
  };

  class SemanticFluencyPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const startTime = performance.now();
      let lastSubmitTime = startTime;
      let trialEnded = false;
      const responses = [];

      display_element.innerHTML = `
        <div class="sf-trial">
          <div class="sf-header">
            <div>
              <p class="sf-label">Category cue</p>
              <h1 class="sf-cue">${trial.cue}</h1>
            </div>
            <div class="sf-timer" id="sf-timer">2:00</div>
          </div>

          <div class="sf-helper">
            ${trial.prompt}
          </div>

          <form class="sf-form" id="sf-form" autocomplete="off">
            <input
              class="sf-input"
              id="sf-input"
              type="text"
              placeholder="${trial.placeholder}"
              aria-label="Semantic fluency response"
              spellcheck="false"
              autofocus
            />
            <button class="sf-button" type="submit">${trial.button_label}</button>
          </form>

          <div class="sf-status">
            <div>Responses recorded: <span class="sf-count" id="sf-count">0</span></div>
            <div>Press Enter after each response.</div>
          </div>

          <div class="sf-flash-zone" id="sf-flash-zone" aria-live="polite"></div>
          <div class="sf-ending" id="sf-ending" hidden>Time is up.</div>
        </div>
      `;

      const form = display_element.querySelector("#sf-form");
      const input = display_element.querySelector("#sf-input");
      const timerEl = display_element.querySelector("#sf-timer");
      const countEl = display_element.querySelector("#sf-count");
      const flashZone = display_element.querySelector("#sf-flash-zone");
      const endingEl = display_element.querySelector("#sf-ending");

      const normalizeResponse = (value) => value.trim().replace(/\s+/g, " ");

      const formatTime = (milliseconds) => {
        const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
      };

      const addTransientChip = (text) => {
        const chip = document.createElement("div");
        chip.className = "sf-chip";
        chip.textContent = text;
        flashZone.appendChild(chip);

        window.setTimeout(() => {
          chip.remove();
        }, trial.min_display_ms + 150);
      };

      const recordResponse = () => {
        const raw = input.value;
        const cleaned = normalizeResponse(raw);

        if (!cleaned && !trial.allow_empty) {
          return;
        }

        const now = performance.now();
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
      };

      const submitHandler = (event) => {
        event.preventDefault();
        if (trialEnded) {
          return;
        }
        recordResponse();
      };

      form.addEventListener("submit", submitHandler);

      let timerId = null;

      const endTrial = () => {
        if (trialEnded) {
          return;
        }

        trialEnded = true;
        window.clearInterval(timerId);
        form.removeEventListener("submit", submitHandler);
        input.disabled = true;
        display_element.querySelector(".sf-button").disabled = true;
        endingEl.hidden = false;

        const trialDuration = Math.round(performance.now() - startTime);

        window.setTimeout(() => {
          this.jsPsych.finishTrial({
            cue: trial.cue,
            category_type: trial.category_type,
            duration_ms: trial.duration_ms,
            actual_duration_ms: trialDuration,
            response_count: responses.length,
            response_texts: responses.map((response) => response.text),
            responses_json: JSON.stringify(responses),
            responses: responses,
          });
        }, trial.end_hold_ms);
      };

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const remaining = trial.duration_ms - elapsed;
        timerEl.textContent = formatTime(remaining);

        if (remaining <= 0) {
          endTrial();
        }
      };

      timerId = window.setInterval(tick, 100);
      tick();
    }
  }

  SemanticFluencyPlugin.info = info;

  return SemanticFluencyPlugin;
})(jsPsychModule);

var jsPsychFluencyCountdown = (function (jspsych) {
  "use strict";

  const info = {
    name: "fluency-countdown",
    parameters: {
      seconds: {
        type: jspsych.ParameterType.INT,
        default: 5,
      },
      label: {
        type: jspsych.ParameterType.HTML_STRING,
        default: "<p>The next task will begin shortly.</p>",
      },
    },
  };

  class FluencyCountdownPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const totalMs = trial.seconds * 1000;
      const startTime = performance.now();
      let finished = false;

      display_element.innerHTML = `
        <div class="sf-countdown-screen">
          <div class="sf-countdown-wrap">
            <div class="sf-countdown-bar-shell" aria-hidden="true">
              <div class="sf-countdown-bar" id="sf-countdown-bar"></div>
            </div>
            <div class="sf-countdown-label">${trial.label}</div>
            <div class="sf-countdown-number" id="sf-countdown-number">${trial.seconds}</div>
          </div>
        </div>
      `;

      const numberEl = display_element.querySelector("#sf-countdown-number");
      const barEl = display_element.querySelector("#sf-countdown-bar");

      const endTrial = () => {
        if (finished) {
          return;
        }

        finished = true;
        window.clearInterval(intervalId);
        this.jsPsych.finishTrial({
          countdown_seconds: trial.seconds,
        });
      };

      const update = () => {
        const elapsed = performance.now() - startTime;
        const remaining = Math.max(0, totalMs - elapsed);
        const displayNumber = Math.max(1, Math.ceil(remaining / 1000));
        const progress = Math.max(0, remaining / totalMs);

        numberEl.textContent = String(displayNumber);
        barEl.style.transform = `scaleX(${progress})`;

        if (remaining <= 0) {
          endTrial();
        }
      };

      const intervalId = window.setInterval(update, 100);
      update();
    }
  }

  FluencyCountdownPlugin.info = info;

  return FluencyCountdownPlugin;
})(jsPsychModule);

var jsPsychSemanticFluencyDemo = (function (jspsych) {
  "use strict";

  const info = {
    name: "semantic-fluency-demo",
    parameters: {
      cue: {
        type: jspsych.ParameterType.STRING,
        default: "Vehicles",
      },
      duration_ms: {
        type: jspsych.ParameterType.INT,
        default: 20000,
      },
      min_display_ms: {
        type: jspsych.ParameterType.INT,
        default: 800,
      },
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        default:
          "<p>Please generate as many words or short phrases related to this category as you can.</p>",
      },
      intro_html: {
        type: jspsych.ParameterType.HTML_STRING,
        default: "<p>This is a demonstration only.</p>",
      },
      note_html: {
        type: jspsych.ParameterType.HTML_STRING,
        default: "",
      },
      button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Submit",
      },
      continue_label: {
        type: jspsych.ParameterType.STRING,
        default: "Begin Experiment",
      },
      placeholder: {
        type: jspsych.ParameterType.STRING,
        default: "Enter one word or short phrase",
      },
    },
  };

  class SemanticFluencyDemoPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
      const startTime = performance.now();
      let trialEnded = false;
      let responseCount = 0;

      display_element.innerHTML = `
        <div class="sf-ready">
          <h2>Thank You</h2>
          ${trial.intro_html}
          ${trial.note_html}

          <div class="sf-trial">
            <div class="sf-header">
              <div>
                <p class="sf-label">Category cue</p>
                <h1 class="sf-cue">${trial.cue}</h1>
              </div>
              <div class="sf-timer" id="sf-demo-timer">0:20</div>
            </div>

            <div class="sf-helper">
              ${trial.prompt}
            </div>

            <form class="sf-form" id="sf-demo-form" autocomplete="off">
              <input
                class="sf-input"
                id="sf-demo-input"
                type="text"
                placeholder="${trial.placeholder}"
                aria-label="Semantic fluency demonstration response"
                spellcheck="false"
                autofocus
              />
              <button class="sf-button" type="submit">${trial.button_label}</button>
            </form>

            <div class="sf-status">
              <div>Responses recorded: <span class="sf-count" id="sf-demo-count">0</span></div>
              <div>Press Enter after each response.</div>
            </div>

            <div class="sf-flash-zone" id="sf-demo-flash-zone" aria-live="polite"></div>
            <div class="sf-ending" id="sf-demo-ending" hidden>Demonstration timer complete.</div>
          </div>

          <div class="sf-demo-actions">
            <button class="sf-begin-experiment" id="sf-begin-experiment" type="button">${trial.continue_label}</button>
          </div>
        </div>
      `;

      const form = display_element.querySelector("#sf-demo-form");
      const input = display_element.querySelector("#sf-demo-input");
      const timerEl = display_element.querySelector("#sf-demo-timer");
      const countEl = display_element.querySelector("#sf-demo-count");
      const flashZone = display_element.querySelector("#sf-demo-flash-zone");
      const endingEl = display_element.querySelector("#sf-demo-ending");
      const continueButton = display_element.querySelector("#sf-begin-experiment");

      const normalizeResponse = (value) => value.trim().replace(/\s+/g, " ");

      const formatTime = (milliseconds) => {
        const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
      };

      const addTransientChip = (text) => {
        const chip = document.createElement("div");
        chip.className = "sf-chip";
        chip.textContent = text;
        flashZone.appendChild(chip);

        window.setTimeout(() => {
          chip.remove();
        }, trial.min_display_ms + 150);
      };

      const submitHandler = (event) => {
        event.preventDefault();
        if (trialEnded || input.disabled) {
          return;
        }

        const cleaned = normalizeResponse(input.value);
        if (!cleaned) {
          return;
        }

        responseCount += 1;
        countEl.textContent = String(responseCount);
        addTransientChip(cleaned);
        input.value = "";
        input.focus();
      };

      const finishDemo = () => {
        if (trialEnded) {
          return;
        }

        trialEnded = true;
        window.clearInterval(timerId);
        form.removeEventListener("submit", submitHandler);
        continueButton.removeEventListener("click", continueHandler);
        this.jsPsych.finishTrial({
          demo_completed: true,
        });
      };

      const continueHandler = () => {
        finishDemo();
      };

      form.addEventListener("submit", submitHandler);
      continueButton.addEventListener("click", continueHandler);

      const tick = () => {
        const elapsed = performance.now() - startTime;
        const remaining = trial.duration_ms - elapsed;
        timerEl.textContent = formatTime(remaining);

        if (remaining <= 0) {
          window.clearInterval(timerId);
          timerEl.textContent = "0:00";
          input.disabled = true;
          display_element.querySelector(".sf-button").disabled = true;
          endingEl.hidden = false;
        }
      };

      const timerId = window.setInterval(tick, 100);
      tick();
    }
  }

  SemanticFluencyDemoPlugin.info = info;

  return SemanticFluencyDemoPlugin;
})(jsPsychModule);
