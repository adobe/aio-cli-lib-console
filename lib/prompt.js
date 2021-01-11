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
inquirer.registerPrompt('autocomplete-with-escape', require('./inquirer-autocomplete-with-escape-prompt'))
const fuzzy = require('fuzzy')

/**
 * @param name
 * @param data
 */
async function promptSelectOrCreate (name, data = []) {
  if (data.length <= 0) {
    console.error(`There are no ${name}s in here, let's create a new one.`)
    return null
  }

  const escapeSymbol = '+'
  while (true) {
    const res = await promptSelect(
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
    const confirmCreation = await promptConfirm(
        `  > do you wish to create a new ${name}?`
    )
    if (confirmCreation) {
      return null
    }
    // continue loop
  }
}

/**
 * Same as promptChoice but wraps the name into a message 'Select name:'
 *
 * @param name
 * @param data
 * @param moreOptions
 */
async function promptSelect (name, data, moreOptions = {}) {
  const res = await promptChoice(`Select ${name}:`, data, moreOptions)
  return res
}

/**
 * @param message
 * @param data
 * @param moreOptions
 */
async function promptChoice (message, data, moreOptions = {}) {
  const choice = await inquirer.prompt([
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

/**
 * @param data
 */
function createSourceForPromptSelect (data) {
  return async function (answersSoFar, input = '') {
    return fuzzy.filter(input, data, { extract: d => d.name }).map(d => d.original)
  }
}

/**
 * @param message
 * @param data
 * @param moreOptions
 */
async function promptMultiSelect (message, data, moreOptions = {}) {
  const choice = await inquirer.prompt([
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

/**
 * @param what
 * @param moreOptions
 */
async function promptInput (what, moreOptions) {
  const input = await inquirer.prompt([{
    type: 'input',
    name: 'res',
    message: `${what}:`,
    ...moreOptions
  }])
  return input.res
}

/**
 * @param message
 */
async function promptConfirm (message) {
  const confirm = await inquirer.prompt([{
    type: 'confirm',
    name: 'res',
    message
  }])
  return confirm.res
}

module.exports = {
  promptSelect,
  createSourceForPromptSelect,
  promptSelectOrCreate,
  promptInput,
  promptMultiSelect,
  promptConfirm,
  promptChoice
}
