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

const { validateName } = require('./validate')
const fuzzy = require('fuzzy')

/** @private */
function promptSelectOrCreate (generator) {
  return async function (name, data = []) {
    if (data.length <= 0) {
      return promptCreation(generator)(name)
    }

    while (true) {
      const res = await promptSelect(generator)(
        name,
        data,
        {
          message: `Select ${name} or create new [tab before selection] -`,
          suggestOnly: true,
          validate: validateName
        }
      )

      if (data.includes(res)) {
        return res
      }

      if (await promptConfirm(generator)(`${name} '${res}'`)) {
        return res
      } else {
        return null
      }
    }
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
function createSourceForPromptSelect (data) {
  return async function (answersSoFar, input = '') {
    return fuzzy.filter(input, data).map(item => item.string)
  }
}

/** @private */
function promptSelect (generator) {
  return async function (name, data, moreOptions = {}) {
    const choice = await generator.prompt([
      {
        type: 'autocomplete',
        name: 'res',
        message: `Select ${name}`,
        source: createSourceForPromptSelect(data),
        ...moreOptions
      }
    ])
    return choice.res
  }
}

/** @private */
function promptCreation (generator) {
  return async function (name) {
    while (true) {
      const create = await generator.prompt([
        {
          type: 'input',
          name: 'res',
          message: `Create a new ${name}, input -`,
          validate: validateName
        }
      ])
      if (await promptConfirm(generator)(`${name} '${create.res}'`)) {
        return create.res
      } else {
        return null
      }
    }
  }
}

/** @private */
function promptConfirm (generator) {
  return async function (what) {
    const confirm = await generator.prompt([{
      type: 'confirm',
      name: 'res',
      message: `  > confirm creation of ${what}?`
    }])
    return confirm.res
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

module.exports = (generator) => ({
  promptConfirm: promptConfirm(generator),
  promptCreation: promptCreation(generator),
  promptSelect: promptSelect(generator),
  createSourceForPromptSelect,
  promptSelectOrCreate: promptSelectOrCreate(generator),
  promptInput: promptInput(generator),
  promptMultiSelect: promptMultiSelect(generator)
})
