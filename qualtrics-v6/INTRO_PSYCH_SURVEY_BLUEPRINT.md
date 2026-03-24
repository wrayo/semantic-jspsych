# Intro Psychology Survey Blueprint

This is the simplest Qualtrics survey structure for the psychology semantic fluency task.

## Survey Flow

1. Welcome screen
2. Semantic fluency task
3. Completion screen

## Question 1: Welcome screen

Question type:

- `Text / Graphic`

Content:

- Paste `qualtrics-v6/intro-question.html`

Behavior:

- Show the standard Qualtrics `Next` button.

## Question 2: Semantic fluency task

Question type:

- `Text / Graphic`

Question HTML:

- Paste `qualtrics-v6/psychology-only-question.html`

Question JavaScript:

- Paste `qualtrics-v6/psychology-only-qualtrics.js`

Required edit before use:

- Confirm that `assetBaseUrl` in `qualtrics-v6/psychology-only-qualtrics.js` matches the repository's GitHub Pages URL.

Suggested Embedded Data fields:

- `semantic_fluency_participant_id`
- `semantic_fluency_storage_key`
- `semantic_fluency_cue`
- `semantic_fluency_response_count`
- `semantic_fluency_responses_json`
- `semantic_fluency_all_data_json`

## Question 3: Completion screen

Question type:

- `Text / Graphic`

Content:

- Paste `qualtrics-v6/end-question.html`

Behavior:

- Show the standard Qualtrics `Next` button so the response is submitted normally.

## Hosted assets checklist

You still need to host:

- the full `qualtrics-v6` folder
- `jsPsych 6.3.1` core files under `qualtrics-v6/lib/jspsych-6.3.1/`

See `qualtrics-v6/QUALTRICS_SETUP.md` for the required files list.
