// Task structure follows the procedure described in Siew and Guru (2023):
// general categories first, followed by subject-specific categories.
const searchParams = new URLSearchParams(window.location.search);
const getPositiveIntParam = (key, fallback) => {
  const value = searchParams.get(key);
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const trialDurationMs = getPositiveIntParam("durationMs", 120000);
const responseFadeMs = getPositiveIntParam("fadeMs", 800);
const endHoldMs = getPositiveIntParam("endHoldMs", 400);
const countdownSeconds = getPositiveIntParam("countdownSec", 5);

const participantId = Array.from(window.crypto.getRandomValues(new Uint32Array(3)))
  .map((value) => value.toString(36))
  .join("")
  .slice(0, 12);
const storageKey = `semantic-fluency:${participantId}`;

const persistDataSnapshot = (jsPsychInstance) => {
  try {
    const payload = {
      participant_id: participantId,
      saved_at: new Date().toISOString(),
      data: jsPsychInstance.data.get().values(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to save semantic fluency data to localStorage.", error);
  }
};

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  on_data_update: () => {
    persistDataSnapshot(jsPsych);
  },
  on_finish: () => {
    persistDataSnapshot(jsPsych);
    const allData = jsPsych.data.get();
    const summaryRows = allData
      .filter({ task: "semantic-fluency-list" })
      .values()
      .map((trial) => {
        return `
          <tr>
            <td>${trial.phase}</td>
            <td>${trial.cue}</td>
            <td>${trial.response_count}</td>
          </tr>
        `;
      })
      .join("");

    document.body.innerHTML = `
      <div class="sf-finish">
        <h1>Task complete</h1>
        <p>The semantic fluency task has finished.</p>
        <p>Your responses have also been saved to this browser's local storage.</p>
        <p><strong>Local storage key:</strong> ${storageKey}</p>
        <p>You can download the raw data below as JSON or CSV.</p>
        <table class="jspsych-display-element" style="width:100%; margin-top: 1rem;">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Cue</th>
              <th>Responses</th>
            </tr>
          </thead>
          <tbody>${summaryRows}</tbody>
        </table>
        <div class="sf-downloads">
          <button id="download-json">Download JSON</button>
          <button id="download-csv">Download CSV</button>
        </div>
      </div>
    `;

    document
      .getElementById("download-json")
      .addEventListener("click", () =>
        jsPsych.data.get().localSave("json", "semantic-fluency-data.json")
      );

    document
      .getElementById("download-csv")
      .addEventListener("click", () =>
        jsPsych.data.get().localSave("csv", "semantic-fluency-data.csv")
      );
  },
});

jsPsych.data.addProperties({
  participant_id: participantId,
  experiment_name: "semantic_fluency_siew_guru_2023_replication",
  local_storage_key: storageKey,
});

const generalCues = jsPsych.randomization.shuffle(["Animals", "Fruits"]);

const buildSubjectCueOrder = () => {
  const remainingCues = jsPsych.randomization.shuffle([
    "Cognitive Psychology",
    "Developmental Psychology",
    "Clinical Psychology",
    "Social Psychology",
    "Biological Psychology",
    "Sensation and Perception",
    "Learning",
    "Research Methods",
  ]);

  return ["Psychology", ...remainingCues];
};

const subjectCues = buildSubjectCueOrder();

jsPsych.data.addProperties({
  general_cue_order: JSON.stringify(generalCues),
  subject_cue_order: JSON.stringify(subjectCues),
});

const sharedPrompt = `
  <p>Generate as many category members or related concepts as you can.</p>
  <p>Enter <strong>one word or short phrase at a time</strong>, then press Enter.</p>
  <p>Do not repeat responses within the same list, and avoid simple suffix variants such as "cell" and "cells".</p>
`;

// The paper describes duplicates/suffix variants as participant instructions,
// so the task reminds participants rather than automatically blocking entries.
const makeFluencyTrial = (cue, phase, position) => ({
  type: jsPsychSemanticFluency,
  cue: cue,
  category_type: phase,
  duration_ms: trialDurationMs,
  min_display_ms: responseFadeMs,
  end_hold_ms: endHoldMs,
  prompt: sharedPrompt,
  data: {
    task: "semantic-fluency-list",
    phase: phase,
    cue: cue,
    cue_position: position,
  },
});

const makeReadyScreen = (cue, phase, position) => ({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="sf-ready">
      <h2>Thank You</h2>
      <p>Thank you for taking part.</p>
      <p>When you are ready, click <strong>Begin</strong> to continue to the next task.</p>
      <p>The cue will appear only after a short countdown.</p>

      <div class="sf-example-block">
        <p class="sf-example-tag">Example Preview</p>
        <p class="sf-example-copy">This is an example only. The live task will place each item in the same location shown below.</p>

        <div class="sf-preview-trial" aria-hidden="true">
          <div class="sf-header">
            <div>
              <p class="sf-label">Category cue</p>
              <h3 class="sf-preview-cue">Vehicles</h3>
            </div>
            <div class="sf-preview-timer">0:56</div>
          </div>

          <div class="sf-preview-helper">
            <p>Generate as many category members or related concepts as you can.</p>
            <p>Enter <strong>one word or short phrase at a time</strong>, then press Enter.</p>
            <p>Do not repeat responses within the same list, and avoid simple suffix variants such as "car" and "cars".</p>
          </div>

          <div class="sf-preview-form">
            <input
              class="sf-preview-input"
              type="text"
              value=""
              placeholder="Enter one word or short phrase"
              disabled
            />
            <button class="sf-preview-button" type="button" disabled>Submit</button>
          </div>

          <div class="sf-preview-status">
            <div>Responses recorded: <span class="sf-preview-count">4</span></div>
            <div>Press Enter after each response.</div>
          </div>
        </div>
      </div>
    </div>
  `,
  choices: ["Begin"],
  data: {
    task: "pre-task-screen",
    phase: phase,
    cue: cue,
    cue_position: position,
  },
});

const makeCountdownTrial = (cue, phase, position) => ({
  type: jsPsychFluencyCountdown,
  seconds: countdownSeconds,
  label: "<p>The next task is about to begin.</p>",
  data: {
    task: "countdown",
    phase: phase,
    cue: cue,
    cue_position: position,
  },
});

const timeline = [];

timeline.push({
  type: jsPsychInstructions,
  pages: [
    `
      <div class="sf-instructions">
        <h1>Semantic Fluency Task</h1>
        <p>You will see a category cue on the screen for each list.</p>
        <p>Your job is to type as many valid responses as you can within <strong>2 minutes</strong> for each cue.</p>
        <p>Responses should be entered one at a time as single words or short phrases.</p>
      </div>
    `,
    `
      <div class="sf-instructions">
        <h2>Response rules</h2>
        <ul>
          <li>Press Enter after every response.</li>
          <li>Do not repeat a response within the same list.</li>
          <li>Avoid plural or suffix variants of the same idea, such as "cell" and "cells".</li>
          <li>Earlier responses will briefly appear and then fade from the screen.</li>
        </ul>
      </div>
    `,
  ],
  show_clickable_nav: true,
  button_label_next: "Next",
  button_label_previous: "Back",
  data: {
    task: "instructions",
    phase: "overall",
  },
});

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="sf-instructions">
      <h2>General Categories</h2>
      <p>You will begin with the general semantic categories.</p>
      <p>The cue order is randomized for each participant.</p>
      <p>Click Start when you are ready.</p>
    </div>
  `,
  choices: ["Start"],
  data: {
    task: "phase-transition",
    phase: "general",
  },
});

generalCues.forEach((cue, index) => {
  timeline.push(makeReadyScreen(cue, "general", index + 1));
  timeline.push(makeCountdownTrial(cue, "general", index + 1));
  timeline.push(makeFluencyTrial(cue, "general", index + 1));
});

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
      <div class="sf-instructions">
        <h2>Subject-Specific Categories</h2>
        <p>Next, you will generate concepts related to academic subjects.</p>
        <p><strong>Psychology</strong> will appear first, and the remaining subject-specific cues will follow in a randomized order.</p>
        <p>Each subject again lasts 2 minutes.</p>
      </div>
    `,
  choices: ["Continue"],
  data: {
    task: "phase-transition",
    phase: "subject-specific",
  },
});

subjectCues.forEach((cue, index) => {
  timeline.push(makeReadyScreen(cue, "subject-specific", index + 1));
  timeline.push(makeCountdownTrial(cue, "subject-specific", index + 1));
  timeline.push(makeFluencyTrial(cue, "subject-specific", index + 1));
});

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="sf-instructions">
      <h2>Finished</h2>
      <p>You have completed all semantic fluency lists.</p>
      <p>Click Finish to save or inspect the collected data.</p>
    </div>
  `,
  choices: ["Finish"],
  data: {
    task: "end-screen",
  },
});

jsPsych.run(timeline);
