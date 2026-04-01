const fs = require("fs");
const path = require("path");

const currentDir = __dirname;
const templatePath = "/Users/wrayo/Downloads/Psychology_Knowledge_PSC1_Brain_Dump.qsf";
const outputPath = path.join(currentDir, "Psychology_Knowledge_PSC1_Brain_Dump_RENDER_FIX.qsf");

const readText = (fileName) => fs.readFileSync(path.join(currentDir, fileName), "utf8").trim();

const introHtml = readText("psc1-brain-dump-intro.html");
const questionHtml = readText("psc1-brain-dump-question.html");
const questionJs = readText("psc1-brain-dump-qualtrics.js");
const endHtml = readText("psc1-brain-dump-end.html");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

template.SurveyEntry.SurveyName = "Psychology Knowledge PSC1 Brain Dump Render Fix";

template.SurveyElements.forEach((element) => {
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

  if (element.Element === "SQ" && element.PrimaryAttribute === "QID3") {
    element.SecondaryAttribute = "Finished";
    element.Payload.QuestionText = endHtml;
    element.Payload.QuestionDescription = "Finished";
  }
});

fs.writeFileSync(outputPath, JSON.stringify(template));
console.log("Generated:", outputPath);
