Qualtrics.SurveyEngine.addOnload(function () {
  var qthis = this;

  var assetBaseUrl = "https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY-NAME";
  var taskConfig = {
    displayElement: "display_stage",
    participantId: "${e://Field/ResponseID}",
    storageKeyPrefix: "psychology-fluency",
    embeddedDataPrefix: "semantic_fluency_",
    cue: "Psychology",
    demoCue: "Vehicles",
    durationMs: 120000,
    demoDurationMs: 20000,
    fadeMs: 800,
    endHoldMs: 400,
    countdownSec: 5,
    experimentName: "psychology_fluency_single_task_qualtrics_v6",
  };

  function updateStatus(messageHtml) {
    var statusNode = document.getElementById("sf-load-status");
    if (statusNode) {
      statusNode.innerHTML = messageHtml;
    }
  }

  function ensureStylesheet(href) {
    var existing = document.querySelector("link[data-semantic-fluency-href='" + href + "']");
    var link;

    if (existing) {
      return;
    }

    link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = href;
    link.setAttribute("data-semantic-fluency-href", href);
    document.head.appendChild(link);
  }

  function ensureDisplayStage() {
    if (!document.getElementById("display_stage_background")) {
      jQuery("<div id='display_stage_background'></div>").appendTo("body");
    }
    if (!document.getElementById("display_stage")) {
      jQuery("<div id='display_stage'></div>").appendTo("body");
    }
  }

  function loadScript(idx, requiredResources) {
    jQuery.getScript(requiredResources[idx])
      .done(function () {
        if ((idx + 1) < requiredResources.length) {
          loadScript(idx + 1, requiredResources);
        }
      })
      .fail(function () {
        updateStatus(
          "The semantic fluency task could not finish loading.<br>" +
          "Please capture this screen and contact the study team."
        );
      });
  }

  if (assetBaseUrl.indexOf("YOUR-GITHUB-USERNAME") !== -1) {
    updateStatus(
      "This question is not configured yet.<br>" +
      "Set <code>assetBaseUrl</code> in the Qualtrics JavaScript first."
    );
    return;
  }

  qthis.hideNextButton();
  ensureDisplayStage();
  ensureStylesheet(assetBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/css/jspsych.css");
  ensureStylesheet(assetBaseUrl + "/qualtrics-v6/semantic-fluency.css");

  window.semanticFluencyConfig = taskConfig;
  window.semanticFluencyQualtrics = {
    onFinish: function (jsPsychInstance, payload) {
      var prefix = taskConfig.embeddedDataPrefix || "semantic_fluency_";
      var fluencyTrials = jsPsychInstance.data.get().filter({
        task: "semantic-fluency-list",
      }).values();
      var finalTrial = fluencyTrials.length ? fluencyTrials[fluencyTrials.length - 1] : null;

      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "participant_id", payload.participant_id);
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "storage_key", payload.storage_key);
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "cue", taskConfig.cue);
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "response_count", finalTrial ? finalTrial.response_count : 0);
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "responses_json", finalTrial ? finalTrial.responses_json : "[]");

      // For the single-cue version this is usually manageable, but multi-list studies
      // should save trial-level data to a server instead of relying on Embedded Data.
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "all_data_json", JSON.stringify(jsPsychInstance.data.get().values()));

      jQuery("#display_stage").remove();
      jQuery("#display_stage_background").remove();
      qthis.clickNextButton();
    },
  };

  if (window.Qualtrics && (!window.frameElement || window.frameElement.id !== "mobile-preview-view")) {
    loadScript(0, [
      assetBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/jspsych.js",
      assetBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/plugins/jspsych-html-button-response.js",
      assetBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/plugins/jspsych-instructions.js",
      assetBaseUrl + "/qualtrics-v6/semantic-fluency-plugin-v6.js",
      assetBaseUrl + "/qualtrics-v6/psychology-only-v6-task.js",
    ]);
  }
});

Qualtrics.SurveyEngine.addOnReady(function () {
});

Qualtrics.SurveyEngine.addOnUnload(function () {
  jQuery("#display_stage").remove();
  jQuery("#display_stage_background").remove();
  delete window.semanticFluencyConfig;
  delete window.semanticFluencyQualtrics;
});
