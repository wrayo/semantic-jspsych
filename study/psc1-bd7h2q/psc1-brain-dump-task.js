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
const demoDurationMs = getPositiveIntParam("demoDurationMs", 20000);

const participantId = Array.from(window.crypto.getRandomValues(new Uint32Array(3)))
  .map((value) => value.toString(36))
  .join("")
  .slice(0, 12);
const storageKey = `psc1-brain-dump:${participantId}`;
const cue = "Psychology";

const persistDataSnapshot = (jsPsychInstance) => {
  try {
    const payload = {
      participant_id: participantId,
      saved_at: new Date().toISOString(),
      data: jsPsychInstance.data.get().values(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch (error) {
    console.warn("Unable to save PSC 1 brain dump data to localStorage.", error);
  }
};

const buildTimingSummary = (trial) => {
  const responses = Array.isArray(trial?.responses) ? trial.responses : [];

  return {
    entry_rt_ms: responses.map((response) => response.rt_ms),
    inter_response_ms: responses.map((response) => response.inter_response_ms),
    first_response_rt_ms: responses.length ? responses[0].rt_ms : "",
    last_response_rt_ms: responses.length ? responses[responses.length - 1].rt_ms : "",
  };
};

const jsPsych = initJsPsych({
  display_element: "jspsych-target",
  on_data_update: () => {
    persistDataSnapshot(jsPsych);
  },
  on_finish: () => {
    persistDataSnapshot(jsPsych);

    const fluencyTrials = jsPsych.data.get().filter({ task: "semantic-fluency-list" }).values();
    const finalTrial = fluencyTrials.length ? fluencyTrials[fluencyTrials.length - 1] : null;
    const timingSummary = buildTimingSummary(finalTrial);
    const summaryRows = fluencyTrials
      .map((trial) => {
        return `
          <tr>
            <td>${trial.phase}</td>
            <td>${trial.cue}</td>
            <td>${trial.response_count}</td>
            <td>${trial.actual_duration_ms}</td>
          </tr>
        `;
      })
      .join("");

    document.body.innerHTML = `
      <div class="sf-finish">
        <h1>Brain Dump Saved</h1>
        <p>Your PSC 1 semantic fluency brain dump is complete.</p>
        <p>Your responses have also been saved to this browser's local storage.</p>
        <p><strong>Local storage key:</strong> ${storageKey}</p>
        <p><strong>Timing recorded:</strong> each entry includes <code>rt_ms</code> and <code>inter_response_ms</code>, and the summary below shows the total trial duration.</p>
        <p><strong>First response RT:</strong> ${timingSummary.first_response_rt_ms || "n/a"} ms</p>
        <p><strong>Last response RT:</strong> ${timingSummary.last_response_rt_ms || "n/a"} ms</p>
        <p><strong>Entry RT array:</strong> ${JSON.stringify(timingSummary.entry_rt_ms)}</p>
        <table class="jspsych-display-element" style="width:100%; margin-top: 1rem;">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Cue</th>
              <th>Responses</th>
              <th>Actual Duration (ms)</th>
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
        jsPsych.data.get().localSave("json", "psc1-brain-dump-data.json")
      );

    document
      .getElementById("download-csv")
      .addEventListener("click", () =>
        jsPsych.data.get().localSave("csv", "psc1-brain-dump-data.csv")
      );
  },
});

jsPsych.data.addProperties({
  participant_id: participantId,
  experiment_name: "psc1_semantic_fluency_brain_dump_public_preview",
  local_storage_key: storageKey,
});

const sharedPrompt = `
  <p>This is a fast <strong>brain dump</strong> for PSC 1.</p>
  <p>Type one psychology idea, term, example, or short phrase at a time, then press Enter.</p>
  <p>Keep going for the full 2 minutes, and try not to repeat yourself within the same list.</p>
`;

const educationalWrapUp = `
  <div class="sf-instructions">
    <h2>Brain Dump Complete</h2>
    <p>You just completed a <strong>semantic fluency task</strong>, which is a quick way to see which ideas are most available in memory when a category appears.</p>
    <p>Here is the cool part: when we combine lots of PSC 1 brain dumps, we can build a class-level <strong>mind map</strong> showing which psychology concepts show up fastest, most often, and closest together in students' mental networks.</p>
    <p>That means your responses are helping us turn a burst of classroom knowledge into a visual map of how introductory psychology is organized in the mind. Very cool, very cognitive science.</p>
    <p>Click Finish to save or inspect the collected data.</p>
  </div>
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
  cue: "School Supplies",
  duration_ms: demoDurationMs,
  min_display_ms: responseFadeMs,
  prompt: `
    <p>This practice round is just to get you comfortable with the layout.</p>
    <p>Type one word or short phrase at a time, then press Enter.</p>
    <p>The real PSC 1 brain dump will begin right after this practice round.</p>
  `,
  intro_html: `
    <p>Before the real task begins, try a short practice round so you can get a feel for the pace.</p>
    <p>Think of the main task as a rapid-fire PSC 1 brain dump: what course ideas are ready to come to mind right away?</p>
    <p>When you are ready, click <strong>Start Brain Dump</strong>. The 2-minute task will begin after the countdown.</p>
  `,
  note_html: `
    <div class="sf-example-block">
      <p class="sf-example-tag">Practice Round</p>
      <p class="sf-example-note"><strong>Please note:</strong> This School Supplies example is just practice. Nothing entered here will be saved or analyzed.</p>
    </div>
  `,
  continue_label: "Start Brain Dump",
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
  label: "<p>Your 2-minute PSC 1 brain dump starts when the countdown ends.</p>",
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
        <h1>PSC 1 Brain Dump</h1>
        <p>In this activity, you will see a course-related prompt on the screen.</p>
        <p>Your job is to do a fast brain dump of as many course-related ideas as you can within <strong>2 minutes</strong>.</p>
        <p>Think like a PSC 1 student: terms, topics, examples, theorists, methods, phenomena, or anything else that feels connected to psychology.</p>
      </div>
    `,
    `
      <div class="sf-instructions">
        <h2>How to respond</h2>
        <ul>
          <li>Type one response at a time as a single word or short phrase.</li>
          <li>Press Enter after each response.</li>
          <li>Keep going even if the ideas feel messy. A brain dump does not need to be polished.</li>
          <li>Do not repeat a response within the same list.</li>
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
  stimulus: educationalWrapUp,
  choices: ["Finish"],
  data: {
    task: "end-screen",
    phase: "psychology-general",
  },
});

jsPsych.run(timeline);
