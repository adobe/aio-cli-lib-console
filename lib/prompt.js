/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
const inquirer = require('inquirer')
const fuzzy = require('fuzzy')

/** @private */
function promptSelectOrCreate (prompt) {
  return async function (name, data = []) {
    if (data.length <= 0) {
      console.error(`There are no ${name}s in here, let's create a new one.`)
      return null
    }

    const escapeSymbol = '+'
    while (true) {
      const res = await promptSelect(prompt)(
        name,
        data,
        {
          message: `Select a ${name}, or press + to create new:`,
          escapeSymbol
        }
      )

      if (res !== escapeSymbol) {
      // return existing entity
        return res
      }

      // confirmed creation ?
      const confirmCreation = await promptConfirm(prompt)(
        `  > do you wish to create a new ${name}?`
      )
      if (confirmCreation) {
        return null
      }
    // continue loop
    }
  }
}

/** @private */
function promptSelect (prompt) {
  return async function (name, data, moreOptions = {}) {
    const res = await promptChoice(prompt)(`Select ${name}:`, data, moreOptions)
    return res
  }
}

/** @private */
function promptChoice (prompt) {
  return async function (message, data, moreOptions = {}) {
    const choice = await prompt([
      {
        type: 'autocomplete-with-escape',
        name: 'res',
        message,
        source: createSourceForPromptSelect(data),
        ...moreOptions
      }
    ])
    return choice.res
  }
}

/**
 * @param data
 */
function createSourceForPromptSelect (data) {
  return async function (answersSoFar, input = '') {
    return fuzzy.filter(input, data, { extract: d => d.name }).map(d => d.original)
  }
}

/** @private */
function promptMultiSelect (prompt) {
  return async function (message, data, moreOptions = {}) {
    const choice = await prompt([
      {
        type: 'checkbox',
        name: 'res',
        message,
        choices: data,
        ...moreOptions
      }
    ])
    return choice.res
  }
}

/** @private */
function promptInput (prompt) {
  return async function (what, moreOptions) {
    const input = await prompt([{
      type: 'input',
      name: 'res',
      message: `${what}:`,
      ...moreOptions
    }])
    return input.res
  }
}

/** @private */
function promptConfirm (prompt) {
  return async function (message) {
    const confirm = await prompt([{
      type: 'confirm',
      name: 'res',
      message
    }])
    return confirm.res
  }
}

module.exports = () => {
  // ensure prompts go to stderr
  const prompt = inquirer.createPromptModule({ output: process.stderr })
  prompt.registerPrompt('autocomplete-with-escape', require('./inquirer-autocomplete-with-escape-prompt'))
  return {
    promptSelect: promptSelect(prompt),
    createSourceForPromptSelect,
    promptSelectOrCreate: promptSelectOrCreate(prompt),
    promptInput: promptInput(prompt),
    promptMultiSelect: promptMultiSelect(prompt),
    promptConfirm: promptConfirm(prompt),
    promptChoice: promptChoice(prompt)
  }
}
