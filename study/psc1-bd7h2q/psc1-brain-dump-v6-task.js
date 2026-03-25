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

  function persistDataSnapshot(payload) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      window.console.warn("Unable to save PSC 1 brain dump data to localStorage.", error);
    }
  }

  function renderStandaloneSummary() {
    var allValues = jsPsych.data.get().values();
    var fluencyTrials = jsPsych.data.get().filter({
      task: "semantic-fluency-list",
    }).values();
    var finalTrial = fluencyTrials.length ? fluencyTrials[fluencyTrials.length - 1] : null;
    var responses = finalTrial && finalTrial.responses ? finalTrial.responses : [];
    var responseRtMs = responses.map(function (response) {
      return response.rt_ms;
    });
    var summaryRows = fluencyTrials.map(function (trial) {
      return (
        "<tr>" +
        "<td>" + trial.phase + "</td>" +
        "<td>" + trial.cue + "</td>" +
        "<td>" + trial.response_count + "</td>" +
        "<td>" + trial.actual_duration_ms + "</td>" +
        "</tr>"
      );
    }).join("");
    var target = document.getElementById(displayElementId) || document.body;

    target.innerHTML =
      "<div class='sf-finish'>" +
      "  <h1>Brain Dump Saved</h1>" +
      "  <p>Your PSC 1 semantic fluency brain dump is complete.</p>" +
      "  <p>Your responses were saved to this browser's local storage.</p>" +
      "  <p><strong>Local storage key:</strong> " + storageKey + "</p>" +
      "  <p><strong>Entry RT array:</strong> " + JSON.stringify(responseRtMs) + "</p>" +
      "  <table class='jspsych-display-element' style='width:100%; margin-top: 1rem;'>" +
      "    <thead>" +
      "      <tr><th>Phase</th><th>Cue</th><th>Responses</th><th>Actual Duration (ms)</th></tr>" +
      "    </thead>" +
      "    <tbody>" + summaryRows + "</tbody>" +
      "  </table>" +
      "  <div class='sf-downloads'>" +
      "    <button id='sf-download-json' type='button'>Download JSON</button>" +
      "    <button id='sf-download-csv' type='button'>Download CSV</button>" +
      "  </div>" +
      "</div>";

    document.getElementById("sf-download-json").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(allValues, null, 2)], { type: "application/json" });
      var url = window.URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "psc1-brain-dump-data.json";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
      }, 0);
    });

    document.getElementById("sf-download-csv").addEventListener("click", function () {
      var blob = new Blob([jsPsych.data.get().csv()], { type: "text/csv" });
      var url = window.URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "psc1-brain-dump-data.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
      }, 0);
    });
  }

  var trialDurationMs = positiveIntSetting("durationMs", 120000);
  var responseFadeMs = positiveIntSetting("fadeMs", 800);
  var endHoldMs = positiveIntSetting("endHoldMs", 400);
  var countdownSeconds = positiveIntSetting("countdownSec", 5);
  var demoDurationMs = positiveIntSetting("demoDurationMs", 20000);
  var participantId = safeConfiguredParticipantId(config.participantId) || buildFallbackParticipantId();
  var storageKeyPrefix = config.storageKeyPrefix || "psc1-brain-dump";
  var storageKey = storageKeyPrefix + ":" + participantId;
  var cue = config.cue || "Psychology";
  var demoCue = config.demoCue || "School Supplies";
  var promptHtml =
    config.promptHtml ||
    "<p>This is a fast <strong>brain dump</strong> for PSC 1.</p>" +
    "<p>Type one psychology idea, term, example, or short phrase at a time, then press Enter.</p>" +
    "<p>Keep going for the full 2 minutes, and try not to repeat yourself within the same list.</p>";

  jsPsych.data.addProperties({
    participant_id: participantId,
    experiment_name: config.experimentName || "psc1_semantic_fluency_brain_dump_qualtrics_v6",
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
      duration_ms: demoDurationMs,
      min_display_ms: responseFadeMs,
      prompt:
        "<p>This practice round is just to get you comfortable with the layout.</p>" +
        "<p>Type one word or short phrase at a time, then press Enter.</p>" +
        "<p>The real PSC 1 brain dump will use the cue <strong>Psychology</strong>.</p>",
      intro_html:
        "<p>Before the real task begins, try a short practice round so you can get a feel for the pace.</p>" +
        "<p>Think of the main task as a rapid-fire PSC 1 brain dump: what ideas about psychology are ready to come to mind right away?</p>" +
        "<p>When you are ready, click <strong>Start Brain Dump</strong>. The 2-minute task will begin after the countdown.</p>",
      note_html:
        "<div class='sf-example-block'>" +
        "  <p class='sf-example-tag'>Practice Round</p>" +
        "  <p class='sf-example-note'><strong>Please note:</strong> This " + demoCue + " example is just practice. Nothing entered here will be saved or analyzed.</p>" +
        "</div>",
      continue_label: "Start Brain Dump",
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
      label: "<p>Your 2-minute PSC 1 brain dump starts when the countdown ends.</p>",
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
        "<h1>PSC 1 Brain Dump</h1>" +
        "<p>In this activity, you will see the cue <strong>Psychology</strong> on the screen.</p>" +
        "<p>Your job is to do a fast brain dump of as many psychology ideas as you can within <strong>2 minutes</strong>.</p>" +
        "<p>Think like a PSC 1 student: terms, topics, examples, theorists, methods, phenomena, or anything else that feels connected to psychology.</p>" +
      "</div>",
      "<div class='sf-instructions'>" +
        "<h2>How to respond</h2>" +
        "<ul>" +
          "<li>Type one response at a time as a single word or short phrase.</li>" +
          "<li>Press Enter after each response.</li>" +
          "<li>Keep going even if the ideas feel messy. A brain dump does not need to be polished.</li>" +
          "<li>Do not repeat a response within the same list.</li>" +
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
      "  <h2>Brain Dump Complete</h2>" +
      "  <p>You just completed a <strong>semantic fluency task</strong>, which is a quick way to see which ideas are most available in memory when a category appears.</p>" +
      "  <p>When we combine lots of PSC 1 brain dumps, we can build a class-level <strong>mind map</strong> showing which concepts show up fastest and cluster together in memory.</p>" +
      "  <p>Click Finish to continue.</p>" +
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
