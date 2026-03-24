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
const storageKey = `psychology-fluency:${participantId}`;

const persistDataSnapshot = (jsPsychInstance) => {
  try {
    const payload = {
      participant_id: participantId,
      saved_at: new Date().toISOString(),
      data: jsPsychInstance.data.get().values(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to save psychology fluency data to localStorage.", error);
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
        <p>The psychology fluency task has finished.</p>
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
        jsPsych.data.get().localSave("json", "psychology-fluency-data.json")
      );

    document
      .getElementById("download-csv")
      .addEventListener("click", () =>
        jsPsych.data.get().localSave("csv", "psychology-fluency-data.csv")
      );
  },
});

jsPsych.data.addProperties({
  participant_id: participantId,
  experiment_name: "psychology_fluency_single_task",
  local_storage_key: storageKey,
});

const cue = "Psychology";

const sharedPrompt = `
  <p>Please generate as many words or short phrases related to this category as you can.</p>
  <p>Enter <strong>one word or short phrase at a time</strong>, then press Enter.</p>
  <p>Please do not repeat responses within the same list, and avoid simple variants such as "memory" and "memories".</p>
`;

const makeFluencyTrial = () => ({
  type: jsPsychSemanticFluency,
  cue: cue,
  category_type: "psychology-general",
  duration_ms: trialDurationMs,
  min_display_ms: responseFadeMs,
  end_hold_ms: endHoldMs,
  prompt: sharedPrompt,
  data: {
    task: "semantic-fluency-list",
    phase: "psychology-general",
    cue: cue,
    cue_position: 1,
  },
});

const makeDemoScreen = () => ({
  type: jsPsychSemanticFluencyDemo,
  cue: "Vehicles",
  duration_ms: 20000,
  min_display_ms: responseFadeMs,
  prompt: `
    <p>Please generate as many words or short phrases related to this category as you can.</p>
    <p>Enter <strong>one word or short phrase at a time</strong>, then press Enter.</p>
    <p>Please do not repeat responses within the same list, and avoid simple variants such as "car" and "cars".</p>
  `,
  intro_html: `
    <p>Thank you for taking part in this study.</p>
    <p>You may use the interactive example below to familiarize yourself with the response format and screen layout.</p>
    <p>When you are ready to begin the experiment, click <strong>Begin Experiment</strong>. The real task will begin once the countdown has finished.</p>
  `,
  note_html: `
    <div class="sf-example-block">
      <p class="sf-example-tag">Interactive Example</p>
      <p class="sf-example-note"><strong>Please note:</strong> This Vehicles example is for demonstration only. The timer and any responses entered here will not be saved or analyzed.</p>
    </div>
  `,
  continue_label: "Begin Experiment",
  data: {
    task: "demo-screen",
    phase: "psychology-general",
    cue: cue,
    cue_position: 1,
  },
});

const makeCountdownTrial = () => ({
  type: jsPsychFluencyCountdown,
  seconds: countdownSeconds,
  label: "<p>The experiment will begin when the countdown ends.</p>",
  data: {
    task: "countdown",
    phase: "psychology-general",
    cue: cue,
    cue_position: 1,
  },
});

const timeline = [];

timeline.push({
  type: jsPsychInstructions,
  pages: [
    `
      <div class="sf-instructions">
        <h1>Semantic Fluency Task</h1>
        <p>In this task, you will see a category cue presented on the screen.</p>
        <p>Your task is to type as many valid responses as you can within <strong>2 minutes</strong>.</p>
        <p>Please enter responses one at a time as single words or short phrases.</p>
      </div>
    `,
    `
      <div class="sf-instructions">
        <h2>Response rules</h2>
        <ul>
          <li>Press Enter after each response.</li>
          <li>Please do not repeat a response within the list.</li>
          <li>Please avoid plural or suffix variants of the same idea.</li>
          <li>Each response will briefly appear and then fade from the screen.</li>
        </ul>
      </div>
    `,
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
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <div class="sf-instructions">
      <h2>Finished</h2>
      <p>You have completed the psychology fluency task.</p>
      <p>Click Finish to save or inspect the collected data.</p>
    </div>
  `,
  choices: ["Finish"],
  data: {
    task: "end-screen",
    phase: "psychology-general",
  },
});

jsPsych.run(timeline);
