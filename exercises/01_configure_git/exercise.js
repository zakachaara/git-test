'use strict'

const path         = require('path')
const execa        = require('execa')          // v5: default export is the function
const EventEmitter = require('events')

module.exports = function () {
  const exercise = new EventEmitter()

  // init() is called by workshopper after creating the exercise object.
  // It receives the app instance and the exercise metadata, including `dir`
  // — the absolute path to this exercise's folder on disk.
  // Setting problem here (rather than in the factory body) is the canonical
  // pattern used by real NodeSchool workshops such as javascripting.
  exercise.init = function (workshopper, id, name, dir) {
    // { file: path } tells PrintStream to read the file and pipe it through
    // msee for Markdown rendering. This is different from setting problem to
    // a raw string — the file-object path goes through proper localisation
    // and file-existence checks inside the library.
    this.problem     = { file: path.join(dir, 'problem.md') }
    this.problemType = 'md'
  }

  // workshopper calls: exercise.verify(args, callback)
  //   args     — any CLI arguments passed after `verify`
  //   callback — callback(err, pass, message)
  //                err     : unexpected runtime error, pass null on normal flow
  //                pass    : true = PASS and mark complete, false = FAIL
  //                message : string shown below the PASS / FAIL banner
  exercise.verify = function (args, callback) {
    const cwd = process.cwd()

    // Step 1: confirm we are inside a Git repository.
    execa('git', ['rev-parse', '--git-dir'], { cwd, reject: false })
      .then(function (r) {
        if (r.exitCode !== 0) {
          return callback(null, false, 'Not a Git repository. Run `git init` first.')
        }

        // Step 2: read user.name and user.email from the LOCAL config only.
        // --local restricts the lookup to .git/config so a value inherited
        // from the global ~/.gitconfig does not satisfy the exercise.
        return Promise.all([
          execa('git', ['config', '--local', 'user.name'],  { cwd, reject: false }),
          execa('git', ['config', '--local', 'user.email'], { cwd, reject: false })
        ]).then(function (results) {
          const name  = results[0].stdout.trim()
          const email = results[1].stdout.trim()

          if (name && email) {
            callback(null, true,
              'user.name="' + name + '" and user.email="' + email + '" are both set.')
          } else {
            const missing = [
              !name  && 'user.name is not set.',
              !email && 'user.email is not set.'
            ].filter(Boolean).join(' ')
            callback(null, false, missing)
          }
        })
      })
      .catch(function (err) {
        callback(null, false, 'Unexpected error: ' + (err.message || err))
      })
  }

  return exercise
}
