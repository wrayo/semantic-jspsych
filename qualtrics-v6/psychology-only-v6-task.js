(function () {
  var config = window.semanticFluencyConfig || {};
  var queryParams = window.URLSearchParams ? new URLSearchParams(window.location.search) : null;
  var displayElementId = config.displayElement || (document.getElementById("display_stage") ? "display_stage" : "jspsych-target");

  function readQueryParam(key) {
    return queryParams ? queryParams.get(key) : null;
  }

  function positiveIntSetting(name, fallback) {
    var configured = config[name];
    var fromQuery = readQueryParam(name);
    var parsedConfigured = parseInt(configured, 10);
    var parsedQuery = parseInt(fromQuery, 10);

    if (!isNaN(parsedConfigured) && parsedConfigured > 0) {
      return parsedConfigured;
    }
    if (!isNaN(parsedQuery) && parsedQuery > 0) {
      return parsedQuery;
    }
    return fallback;
  }

  function safeConfiguredParticipantId(value) {
    if (!value || typeof value !== "string") {
      return "";
    }
    if (value.indexOf("${e://") !== -1) {
      return "";
    }
    return value.replace(/^\s+|\s+$/g, "");
  }

  function buildFallbackParticipantId() {
    var pieces = [];
    var index;

    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      var values = new Uint32Array(3);
      window.crypto.getRandomValues(values);
      for (index = 0; index < values.length; index += 1) {
        pieces.push(values[index].toString(36));
      }
      return pieces.join("").slice(0, 12);
    }

    for (index = 0; index < 3; index += 1) {
      pieces.push(Math.floor(Math.random() * 2147483647).toString(36));
    }
    return pieces.join("").slice(0, 12);
  }

  function downloadText(filename, text, mimeType) {
    var blob = new Blob([text], {
      type: mimeType,
    });
    var url = window.URL.createObjectURL(blob);
    var anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.setTimeout(function () {
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  function persistDataSnapshot(payload) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      window.console.warn("Unable to save psychology fluency data to localStorage.", error);
    }
  }

  function renderStandaloneSummary() {
    var allValues = jsPsych.data.get().values();
    var fluencyTrials = jsPsych.data.get().filter({
      task: "semantic-fluency-list",
    }).values();
    var summaryRows = fluencyTrials.map(function (trial) {
      return (
        "<tr>" +
        "<td>" + trial.phase + "</td>" +
        "<td>" + trial.cue + "</td>" +
        "<td>" + trial.response_count + "</td>" +
        "</tr>"
      );
    }).join("");
    var target = document.getElementById(displayElementId) || document.body;

    target.innerHTML =
      "<div class='sf-finish'>" +
      "  <h1>Task complete</h1>" +
      "  <p>The psychology fluency task has finished.</p>" +
      "  <p>Your responses were saved to this browser's local storage.</p>" +
      "  <p><strong>Local storage key:</strong> " + storageKey + "</p>" +
      "  <table class='jspsych-display-element' style='width:100%; margin-top: 1rem;'>" +
      "    <thead>" +
      "      <tr><th>Phase</th><th>Cue</th><th>Responses</th></tr>" +
      "    </thead>" +
      "    <tbody>" + summaryRows + "</tbody>" +
      "  </table>" +
      "  <div class='sf-downloads'>" +
      "    <button id='sf-download-json' type='button'>Download JSON</button>" +
      "    <button id='sf-download-csv' type='button'>Download CSV</button>" +
      "  </div>" +
      "</div>";

    document.getElementById("sf-download-json").addEventListener("click", function () {
      downloadText("psychology-fluency-data.json", JSON.stringify(allValues, null, 2), "application/json");
    });

    document.getElementById("sf-download-csv").addEventListener("click", function () {
      downloadText("psychology-fluency-data.csv", jsPsych.data.get().csv(), "text/csv");
    });
  }

  var trialDurationMs = positiveIntSetting("durationMs", 120000);
  var responseFadeMs = positiveIntSetting("fadeMs", 800);
  var endHoldMs = positiveIntSetting("endHoldMs", 400);
  var countdownSeconds = positiveIntSetting("countdownSec", 5);
  var participantId = safeConfiguredParticipantId(config.participantId) || buildFallbackParticipantId();
  var storageKeyPrefix = config.storageKeyPrefix || "psychology-fluency";
  var storageKey = storageKeyPrefix + ":" + participantId;
  var cue = config.cue || "Psychology";
  var demoCue = config.demoCue || "Vehicles";
  var promptHtml =
    config.promptHtml ||
    "<p>Please generate as many words or short phrases related to this category as you can.</p>" +
    "<p>Enter <strong>one word or short phrase at a time</strong>, then press Enter.</p>" +
    "<p>Please do not repeat responses within the same list.</p>";

  jsPsych.data.addProperties({
    participant_id: participantId,
    experiment_name: config.experimentName || "psychology_fluency_single_task_qualtrics_v6",
    local_storage_key: storageKey,
    source_context: window.Qualtrics ? "qualtrics" : "standalone",
  });

  function makeFluencyTrial() {
    return {
      type: "semantic-fluency",
      cue: cue,
      category_type: "psychology-general",
      duration_ms: trialDurationMs,
      min_display_ms: responseFadeMs,
      end_hold_ms: endHoldMs,
      prompt: promptHtml,
      data: {
        task: "semantic-fluency-list",
        phase: "psychology-general",
        cue: cue,
        cue_position: 1,
      },
    };
  }

  function makeDemoScreen() {
    return {
      type: "semantic-fluency-demo",
      cue: demoCue,
      duration_ms: positiveIntSetting("demoDurationMs", 20000),
      min_display_ms: responseFadeMs,
      prompt:
        "<p>Please generate as many words or short phrases related to this category as you can.</p>" +
        "<p>Enter <strong>one word or short phrase at a time</strong>, then press Enter.</p>" +
        "<p>Please do not repeat responses within the same list.</p>",
      intro_html:
        "<p>Thank you for taking part in this study.</p>" +
        "<p>You may use the interactive example below to familiarize yourself with the response format and screen layout.</p>" +
        "<p>When you are ready to begin the experiment, click <strong>Begin Experiment</strong>. The real task will begin once the countdown has finished.</p>",
      note_html:
        "<div class='sf-example-block'>" +
        "  <p class='sf-example-tag'>Interactive Example</p>" +
        "  <p class='sf-example-note'><strong>Please note:</strong> This Vehicles example is for demonstration only. The timer and any responses entered here will not be saved or analyzed.</p>" +
        "</div>",
      continue_label: "Begin Experiment",
      data: {
        task: "demo-screen",
        phase: "psychology-general",
        cue: cue,
        cue_position: 1,
      },
    };
  }

  function makeCountdownTrial() {
    return {
      type: "fluency-countdown",
      seconds: countdownSeconds,
      label: "<p>The experiment will begin when the countdown ends.</p>",
      data: {
        task: "countdown",
        phase: "psychology-general",
        cue: cue,
        cue_position: 1,
      },
    };
  }

  var timeline = [];

  timeline.push({
    type: "instructions",
    pages: [
      "<div class='sf-instructions'>" +
        "<h1>Semantic Fluency Task</h1>" +
        "<p>In this task, you will see a category cue presented on the screen.</p>" +
        "<p>Your task is to type as many valid responses as you can within <strong>2 minutes</strong>.</p>" +
        "<p>Please enter responses one at a time as single words or short phrases.</p>" +
      "</div>",
      "<div class='sf-instructions'>" +
        "<h2>Response rules</h2>" +
        "<ul>" +
          "<li>Press Enter after each response.</li>" +
          "<li>Please do not repeat a response within the list.</li>" +
          "<li>Each response will briefly appear and then fade from the screen.</li>" +
        "</ul>" +
      "</div>",
    ],
    show_clickable_nav: true,
    button_label_next: "Next",
    button_label_previous: "Back",
    data: {
      task: "instructions",
      phase: "psychology-general",
    },
  });

  timeline.push(makeDemoScreen());
  timeline.push(makeCountdownTrial());
  timeline.push(makeFluencyTrial());

  timeline.push({
    type: "html-button-response",
    stimulus:
      "<div class='sf-instructions'>" +
      "  <h2>Finished</h2>" +
      "  <p>You have completed the psychology fluency task.</p>" +
      "  <p>Click Finish to save or inspect the collected data.</p>" +
      "</div>",
    choices: ["Finish"],
    data: {
      task: "end-screen",
      phase: "psychology-general",
    },
  });

  jsPsych.init({
    timeline: timeline,
    display_element: displayElementId,
    on_data_update: function () {
      persistDataSnapshot({
        participant_id: participantId,
        saved_at: new Date().toISOString(),
        data: jsPsych.data.get().values(),
      });
    },
    on_finish: function () {
      var payload = {
        participant_id: participantId,
        storage_key: storageKey,
        saved_at: new Date().toISOString(),
        data: jsPsych.data.get().values(),
      };

      persistDataSnapshot(payload);

      if (window.semanticFluencyQualtrics && typeof window.semanticFluencyQualtrics.onFinish === "function") {
        window.semanticFluencyQualtrics.onFinish(jsPsych, payload);
        return;
      }

      renderStandaloneSummary();
    },
  });
})();
