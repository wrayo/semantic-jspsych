Qualtrics.SurveyEngine.addOnload(function () {
  var qthis = this;
  var siteBaseUrl = "https://wrayo.github.io/semantic-jspsych";
  var taskAssetBaseUrl = siteBaseUrl + "/study/psc1-bd7h2q";
  var taskConfig = {
    displayElement: "display_stage",
    participantId: "${e://Field/ResponseID}",
    storageKeyPrefix: "psc1-brain-dump",
    embeddedDataPrefix: "semantic_fluency_",
    cue: "Psychology",
    demoCue: "Vehicles",
    durationMs: 120000,
    demoDurationMs: 20000,
    fadeMs: 800,
    endHoldMs: 400,
    countdownSec: 5,
    experimentName: "psc1_semantic_fluency_brain_dump_qualtrics_v6",
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
          "The PSC 1 brain dump could not finish loading.<br>" +
          "Please capture this screen and contact the study team."
        );
      });
  }

  if (siteBaseUrl.indexOf("YOUR-GITHUB-USERNAME") !== -1) {
    updateStatus(
      "This question is not configured yet.<br>" +
      "Set <code>siteBaseUrl</code> in the Qualtrics JavaScript first."
    );
    return;
  }

  qthis.hideNextButton();
  ensureDisplayStage();
  ensureStylesheet(siteBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/css/jspsych.css");
  ensureStylesheet(siteBaseUrl + "/qualtrics-v6/semantic-fluency.css");

  window.semanticFluencyConfig = taskConfig;
  window.semanticFluencyQualtrics = {
    onFinish: function (jsPsychInstance, payload) {
      var prefix = taskConfig.embeddedDataPrefix || "semantic_fluency_";
      var fluencyTrials = jsPsychInstance.data.get().filter({
        task: "semantic-fluency-list",
      }).values();
      var finalTrial = fluencyTrials.length ? fluencyTrials[fluencyTrials.length - 1] : null;
      var responses = finalTrial && finalTrial.responses ? finalTrial.responses : [];

      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "participant_id", payload.participant_id);
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "storage_key", payload.storage_key);
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "cue", taskConfig.cue);
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "response_count", finalTrial ? String(finalTrial.response_count || 0) : "0");
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "responses_json", finalTrial ? finalTrial.responses_json : "[]");
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "trial_data_json", finalTrial ? JSON.stringify(finalTrial) : "{}");
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "response_texts_json", finalTrial ? JSON.stringify(finalTrial.response_texts || []) : "[]");
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "response_rt_ms_json", JSON.stringify(responses.map(function (response) {
        return response.rt_ms;
      })));
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "inter_response_ms_json", JSON.stringify(responses.map(function (response) {
        return response.inter_response_ms;
      })));
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "first_response_rt_ms", responses.length ? String(responses[0].rt_ms) : "");
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "last_response_rt_ms", responses.length ? String(responses[responses.length - 1].rt_ms) : "");
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "actual_duration_ms", finalTrial ? String(finalTrial.actual_duration_ms || "") : "");
      Qualtrics.SurveyEngine.setEmbeddedData(prefix + "all_data_json", JSON.stringify(jsPsychInstance.data.get().values()));

      jQuery("#display_stage").remove();
      jQuery("#display_stage_background").remove();
      qthis.clickNextButton();
    },
  };

  if (window.Qualtrics && (!window.frameElement || window.frameElement.id !== "mobile-preview-view")) {
    loadScript(0, [
      siteBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/jspsych.js",
      siteBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/plugins/jspsych-html-button-response.js",
      siteBaseUrl + "/qualtrics-v6/lib/jspsych-6.3.1/plugins/jspsych-instructions.js",
      siteBaseUrl + "/qualtrics-v6/semantic-fluency-plugin-v6.js",
      taskAssetBaseUrl + "/psc1-brain-dump-v6-task.js",
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
