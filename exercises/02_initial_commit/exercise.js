'use strict'

const path         = require('path')
const execa        = require('execa')          // v5: default export is the function
const fsExtra      = require('fs-extra')
const EventEmitter = require('events')
const storage      = require('workshopper-adventure-storage')

module.exports = function () {
  const exercise = new EventEmitter()

  exercise.init = function (workshopper, id, name, dir) {
    this.problem     = { file: path.join(dir, 'problem.md') }
    this.problemType = 'md'
  }

  exercise.verify = function (args, callback) {
    const cwd = process.cwd()

    // ── Guard: exercise 1 must be completed first ────────────────────────────
    // This is the second line of defence after the selectExercise patch in
    // index.js. It catches the case where someone manually edits current.json
    // to point at exercise 2 without going through the menu.
    const appStorage = storage(storage.userDir, '.config', 'git-exam')
    const completed  = appStorage.get('completed') || []

    if (completed.indexOf('01 Configure Git') === -1) {
      return callback(null, false,
        'Complete "01 Configure Git" before attempting this exercise.')
    }

    // Step 1: confirm we are inside a Git repository.
    execa('git', ['rev-parse', '--git-dir'], { cwd, reject: false })
      .then(function (r) {
        if (r.exitCode !== 0) {
          return callback(null, false, 'Not a Git repository. Run `git init` first.')
        }

        // Step 2: check README.md exists on disk.
        return fsExtra.pathExists(path.join(cwd, 'README.md'))
          .then(function (exists) {
            if (!exists) {
              return callback(null, false, 'README.md does not exist. Create it first.')
            }

            // Step 3: check README.md is tracked by Git.
            // `git ls-files <file>` prints the filename when tracked, nothing
            // when untracked — cleaner than parsing `git status` output.
            return execa('git', ['ls-files', 'README.md'], { cwd, reject: false })
              .then(function (ls) {
                if (!ls.stdout.trim()) {
                  return callback(null, false,
                    'README.md exists but is not tracked. Run `git add README.md`.')
                }

                // Step 4: confirm at least one commit exists.
                // `git log` exits with code 128 on an empty repo;
                // reject:false lets us check stdout cleanly.
                return execa('git', ['log', '--oneline'], { cwd, reject: false })
                  .then(function (log) {
                    if (!log.stdout.trim()) {
                      return callback(null, false,
                        'README.md is staged but not committed. ' +
                        'Run `git commit -m "Initial commit"`.')
                    }

                    const count = log.stdout.trim().split('\n').length
                    callback(null, true,
                      'README.md is tracked and the repository has ' +
                      count + ' commit(s).')
                  })
              })
          })
      })
      .catch(function (err) {
        callback(null, false, 'Unexpected error: ' + (err.message || err))
      })
  }

  return exercise
}
