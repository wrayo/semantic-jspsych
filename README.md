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

The repository is configured for GitHub Pages deployment through the workflow in
`.github/workflows/deploy-pages.yml`.

The public Pages build serves the Qualtrics-compatible assets from `qualtrics-v6/`,
including a simple landing page and a standalone `v6` preview page.

The Qualtrics wrapper in `qualtrics-v6/psychology-only-qualtrics.js` is configured
to load assets from this repository's GitHub Pages site.
