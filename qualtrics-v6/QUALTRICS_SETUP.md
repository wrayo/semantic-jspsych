# Qualtrics jsPsych 6.3.1 Setup

This folder is a Qualtrics-oriented parallel build of the psychology semantic fluency task.

It follows the integration pattern described in Kyoung Whan Choe's tutorial series:

- [jsPsych in Qualtrics Tutorial Series](https://kywch.github.io/jsPsych-in-Qualtrics/)
- [Embedding Hello World!](https://kywch.github.io/jsPsych-in-Qualtrics/hello-world/)
- [Embedding Reaction-Time Task](https://kywch.github.io/jsPsych-in-Qualtrics/rt-task/)

## Why this folder exists

The current local prototype uses `jsPsych 8`, but the Qualtrics tutorial is explicitly built around `jsPsych 6.x`. The tutorial warns that many steps do not work as written for `jsPsych 7+`, and recommends using `jsPsych 6.3.1`, the last `6.x` release.

## Files

- `semantic-fluency-plugin-v6.js`: custom `jsPsych 6` plugins for the fluency trial, countdown, and interactive demo.
- `psychology-only-v6-task.js`: the psychology-only experiment rewritten for `jsPsych.init(...)` and classic string-based plugin names.
- `psychology-only-qualtrics.js`: the script you paste into the Qualtrics question JavaScript editor.
- `psychology-only-question.html`: the HTML snippet you paste into the Qualtrics question HTML editor.
- `semantic-fluency.css`: the hosted stylesheet loaded by the Qualtrics wrapper.

## Required hosted assets

Before the Qualtrics wrapper can run, host this repository on GitHub Pages or another HTTPS host.

This repo already includes the minimum `jsPsych 6.3.1` library files under
`qualtrics-v6/lib/jspsych-6.3.1/`:

- `qualtrics-v6/lib/jspsych-6.3.1/jspsych.js`
- `qualtrics-v6/lib/jspsych-6.3.1/css/jspsych.css`
- `qualtrics-v6/lib/jspsych-6.3.1/plugins/jspsych-html-button-response.js`
- `qualtrics-v6/lib/jspsych-6.3.1/plugins/jspsych-instructions.js`

The tutorial's landing page links to the last `jsPsych 6.3.1` release:
[jsPsych v6.3.1](https://github.com/jspsych/jsPsych/releases/tag/v6.3.1)

## Qualtrics steps

1. Create a `Text/Graphic` question in Qualtrics.
2. Open `Add JavaScript` and paste in `psychology-only-qualtrics.js`.
3. Replace `assetBaseUrl` with your actual GitHub Pages base URL.
4. Open the question `HTML View` and paste in `psychology-only-question.html`.
5. In Survey Flow, add Embedded Data fields if you want predictable export columns for:
   `semantic_fluency_participant_id`
   `semantic_fluency_storage_key`
   `semantic_fluency_cue`
   `semantic_fluency_response_count`
   `semantic_fluency_responses_json`
   `semantic_fluency_all_data_json`
6. Publish and test using the anonymous survey link, not only the editor preview.

## Repo publishing note

This repository includes a GitHub Pages workflow in `.github/workflows/deploy-pages.yml`.
After the repo is pushed to GitHub, you can use that workflow to publish the repo contents as a static site.

## What this wrapper does

The Qualtrics wrapper mirrors the tutorial's core pattern:

- hides the Next button with `qthis.hideNextButton()`
- appends `display_stage` and `display_stage_background`
- loads jsPsych resources sequentially with `jQuery.getScript(...)`
- starts the task only after all files are loaded
- writes summary data back into Qualtrics Embedded Data
- removes the stage and calls `qthis.clickNextButton()` when the task ends

## Data note

The tutorial recommends using Qualtrics Embedded Data for summary values, and a server endpoint if you need large trial-by-trial datasets. For this single-cue task, saving `responses_json` and `all_data_json` may be acceptable, but longer multi-list versions can exceed what is comfortable to manage in Embedded Data exports.
