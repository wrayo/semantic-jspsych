# Semantic jsPsych

This repository contains two parallel versions of the semantic fluency task:

- the original local prototype built with `jsPsych 8`
- a Qualtrics-oriented version built for `jsPsych 6.3.1`

The `jsPsych 6.3.1` build exists because the Qualtrics integration pattern described in Kyoung Whan Choe's tutorial series is written for `jsPsych 6.x`, and the tutorial explicitly warns that many steps do not work the same way in `jsPsych 7+`.

Sources:

- [jsPsych in Qualtrics Tutorial Series](https://kywch.github.io/jsPsych-in-Qualtrics/)
- [Embedding Hello World!](https://kywch.github.io/jsPsych-in-Qualtrics/hello-world/)
- [Embedding Reaction-Time Task](https://kywch.github.io/jsPsych-in-Qualtrics/rt-task/)
- [jsPsych v6.3.1 release](https://github.com/jspsych/jsPsych/releases/tag/v6.3.1)

## Repo layout

- `index.html`, `semantic-fluency-task.js`, `semantic-fluency-plugin.js`
  Local `jsPsych 8` prototype.
- `psychology-only.html`, `psychology-only-task.js`
  Local single-cue `jsPsych 8` prototype.
- `qualtrics-v6/`
  Hosted assets for the Qualtrics-compatible `jsPsych 6.3.1` version.

## Qualtrics build

The main Qualtrics files are:

- `qualtrics-v6/psychology-only-qualtrics.js`
- `qualtrics-v6/psychology-only-question.html`
- `qualtrics-v6/psychology-only-v6-task.js`
- `qualtrics-v6/semantic-fluency-plugin-v6.js`

Survey content and setup notes live in:

- `qualtrics-v6/INTRO_PSYCH_SURVEY_BLUEPRINT.md`
- `qualtrics-v6/QUALTRICS_SETUP.md`

## GitHub Pages

After this repo is published, the Qualtrics assets should be hostable from GitHub Pages. The Qualtrics wrapper script expects you to set:

- `assetBaseUrl = "https://<your-github-username>.github.io/<your-repo-name>"`

inside `qualtrics-v6/psychology-only-qualtrics.js`.

The `qualtrics-v6/index.html` page provides a simple hosted landing page and links to the standalone `v6` preview page.

This repo also includes a GitHub Actions workflow that can deploy the repository to GitHub Pages after the repo is pushed.
