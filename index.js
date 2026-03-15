#!/usr/bin/env node
'use strict'

// ── MUST be the very first line before any require() ────────────────────────
// workshopper-adventure renders problem.md through msee, which uses chalk for
// colours. Chalk v2 reads the terminal capabilities once at require()-time and
// disables all output if it detects no TTY — which happens in many Ubuntu
// terminal emulators, causing headings, bold, and code colours to be silently
// stripped and raw Markdown symbols (# ## **) to appear as plain text.
//
// Setting FORCE_COLOR=1 before anything is required tells chalk to enable
// ANSI colour output unconditionally, giving you the fully rendered experience
// that NodeSchool workshops like learnyounode produce.
process.env.FORCE_COLOR = '1'

const path        = require('path')
const workshopper = require('workshopper-adventure')
const storage     = require('workshopper-adventure-storage')

// Ordered list of exercise display names.
// Used both to register exercises and to compute prerequisites.
const EXERCISES = [
  '01 Configure Git',
  '02 Initial Commit'
]

const app = workshopper({
  // REQUIRED: names the progress storage directory:
  //   ~/.config/git-exam/   (Linux / macOS)
  //   %APPDATA%\git-exam\   (Windows)
  name: 'git-test',

  title: 'GIT PRACTICE EXAM',

  // Absolute path to the exercises directory.
  exerciseDir: path.join(__dirname, 'exercises'),

  // Pass pkg explicitly to prevent a crash when workshopper reads
  // pkg.repository.url — it panics if the repository field is absent.
  pkg: require('./package.json')
})

// Register each exercise in order.
// workshopper normalises the display name to a folder:
//   "01 Configure Git"  →  exercises/01_configure_git/
// It then requires exercise.js from that folder.
EXERCISES.forEach(function (name) { app.add(name) })

// ── Sequential locking ───────────────────────────────────────────────────────
// workshopper-adventure v5 has NO built-in requireCompletion option — passing
// it is silently ignored. We enforce ordering by patching selectExercise, which
// is called by both the interactive menu and the `git-exam select N` command.
var _selectExercise = app.selectExercise.bind(app)

app.selectExercise = function (specifier) {
  // workshopper-adventure-storage writes each key as a separate JSON file:
  //   ~/.config/git-exam/completed.json  ← array of passed exercise names
  //   ~/.config/git-exam/current.json    ← currently selected exercise
  var appStorage   = storage(storage.userDir, '.config', 'git-exam')
  var completed    = appStorage.get('completed') || []

  var id           = app.specifierToId(specifier)
  var meta         = id && app._meta[id]

  if (!meta) {
    // Unknown exercise — let the original method produce the error.
    return _selectExercise(specifier)
  }

  var index        = EXERCISES.indexOf(meta.name)
  var prerequisite = index > 0 ? EXERCISES[index - 1] : null

  if (prerequisite && completed.indexOf(prerequisite) === -1) {
    console.log(
      '\n  You must complete "' + prerequisite +
      '" before unlocking "' + meta.name + '".\n'
    )
    process.exit(1)
  }

  return _selectExercise(specifier)
}

// REQUIRED: start the CLI.
// The constructor does NOT auto-start and has NO .init() method.
// You must call execute() yourself.
app.execute(process.argv.slice(2))
