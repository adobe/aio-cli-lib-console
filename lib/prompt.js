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
const fuzzy = require('fuzzy')

/** @private */
function promptSelectOrCreate (generator) {
  return async function (name, data = []) {
    if (data.length <= 0) {
      console.log(`There are no ${name}s in here, let's create a new one.`)
      return null
    }

    const escapeSymbol = '+'
    while (true) {
      const res = await promptSelect(generator)(
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
      const confirmCreation = await promptConfirm(generator)(
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
function promptSelect (generator) {
  return async function (name, data, moreOptions = {}) {
    const choice = await generator.prompt([
      {
        type: 'autocomplete',
        name: 'res',
        message: `Select ${name}:`,
        source: createSourceForPromptSelect(data),
        ...moreOptions
      }
    ])
    return choice.res
  }
}

/** @private */
function createSourceForPromptSelect (data) {
  return async function (answersSoFar, input = '') {
    return fuzzy.filter(input, data, { extract: d => d.name }).map(d => d.original)
  }
}

/** @private */
function promptMultiSelect (generator) {
  return async function (message, data, moreOptions = {}) {
    const choice = await generator.prompt([
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
function promptInput (generator) {
  return async function (what, moreOptions) {
    const input = await generator.prompt([{
      type: 'input',
      name: 'res',
      message: `${what}:`,
      ...moreOptions
    }])
    return input.res
  }
}

/** @private */
function promptConfirm (generator) {
  return async function (message) {
    const confirm = await generator.prompt([{
      type: 'confirm',
      name: 'answer',
      message
    }])
    return confirm.answer
  }
}

module.exports = (generator) => ({
  promptSelect: promptSelect(generator),
  createSourceForPromptSelect,
  promptSelectOrCreate: promptSelectOrCreate(generator),
  promptInput: promptInput(generator),
  promptMultiSelect: promptMultiSelect(generator),
  promptConfirm: promptConfirm(generator)
})
