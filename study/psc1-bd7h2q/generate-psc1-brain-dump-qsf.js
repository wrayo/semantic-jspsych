const fs = require("fs");
const path = require("path");

const currentDir = __dirname;
const templatePath = "/Users/wrayo/Downloads/Psychology_Knowledge.qsf";
const outputPath = path.join(currentDir, "Psychology_Knowledge_PSC1_Brain_Dump.qsf");

const readText = (fileName) => fs.readFileSync(path.join(currentDir, fileName), "utf8").trim();

const introHtml = readText("psc1-brain-dump-intro.html");
const questionHtml = readText("psc1-brain-dump-question.html");
const questionJs = readText("psc1-brain-dump-qualtrics.js");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

const makeEmbeddedField = (field) => ({
  Description: field,
  Type: "Recipient",
  Field: field,
  VariableType: "String",
  DataVisibility: [],
  AnalyzeText: false,
});

const embeddedFields = [
  "semantic_fluency_participant_id",
  "semantic_fluency_storage_key",
  "semantic_fluency_cue",
  "semantic_fluency_response_count",
  "semantic_fluency_responses_json",
  "semantic_fluency_all_data_json",
  "semantic_fluency_trial_data_json",
  "semantic_fluency_response_texts_json",
  "semantic_fluency_response_rt_ms_json",
  "semantic_fluency_inter_response_ms_json",
  "semantic_fluency_first_response_rt_ms",
  "semantic_fluency_last_response_rt_ms",
  "semantic_fluency_actual_duration_ms",
];

template.SurveyEntry.SurveyName = "Psychology Knowledge PSC1 Brain Dump";

template.SurveyElements.forEach((element) => {
  if (element.Element === "FL") {
    element.Payload.Flow.forEach((flowItem) => {
      if (flowItem.Type === "EmbeddedData") {
        flowItem.EmbeddedData = embeddedFields.map(makeEmbeddedField);
      }
    });
  }

  if (element.Element === "BL" && Array.isArray(element.Payload)) {
    element.Payload.forEach((block) => {
      if (block.Description === "Task") {
        block.Description = "PSC1 Brain Dump Task";
        block.BlockElements = block.BlockElements.filter((item) => item.QuestionID !== "QID3");
      }
    });
  }

  if (element.Element === "SQ" && element.PrimaryAttribute === "QID1") {
    element.SecondaryAttribute = "Welcome to the PSC 1 Brain Dump";
    element.Payload.QuestionText = introHtml;
    element.Payload.QuestionDescription = "Welcome to the PSC 1 Brain Dump";
  }

  if (element.Element === "SQ" && element.PrimaryAttribute === "QID2") {
    element.SecondaryAttribute = "The PSC 1 brain dump task is loading.";
    element.Payload.QuestionText = questionHtml;
    element.Payload.QuestionDescription = "PSC 1 brain dump task";
    element.Payload.QuestionJS = questionJs;
  }
  if (element.Element === "QC") {
    element.SecondaryAttribute = "3";
  }
});

fs.writeFileSync(outputPath, JSON.stringify(template));
console.log("Generated:", outputPath);
