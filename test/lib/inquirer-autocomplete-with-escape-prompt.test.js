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
/* eslint-disable no-proto */
jest.mock('inquirer-autocomplete-prompt')

const AutocompleteWithEscapePrompt = require('../../lib/inquirer-autocomplete-with-escape-prompt')

let autocompleteWithEscapePrompt
let superKeypressMock
beforeEach(() => {
  // somehow the super mock is replacing defined methods of the child class, so we retrieve the child in __proto__
  autocompleteWithEscapePrompt = (new AutocompleteWithEscapePrompt()).__proto__
  // let's assign what we need from the mocked super class
  Object.assign(autocompleteWithEscapePrompt, {
    rl: {},
    done: jest.fn(),
    render: () => {},
    screen: { done: () => {} },
    opt: {}
  })
  superKeypressMock = autocompleteWithEscapePrompt.__proto__.onKeypress
  superKeypressMock.mockClear()
})

describe('AutocompleteWithEscapePrompt.onKeyPress', () => {
  test('pressed non-escape char with opt.escapeSymbol not set', () => {
    const input = { value: 'a' }
    autocompleteWithEscapePrompt.onKeypress(input)

    expect(superKeypressMock).toHaveBeenCalledWith(input)
    expect(autocompleteWithEscapePrompt.done).not.toHaveBeenCalled()
  })

  test('pressed non-escape char with opt.escapeSymbol set', () => {
    const input = { value: 'a' }
    autocompleteWithEscapePrompt.opt.escapeSymbol = '+'
    autocompleteWithEscapePrompt.onKeypress(input)

    expect(superKeypressMock).toHaveBeenCalledWith(input)
    expect(autocompleteWithEscapePrompt.done).not.toHaveBeenCalled()
  })
  test('pressed escape char', () => {
    const input = { value: '+' }
    autocompleteWithEscapePrompt.opt.escapeSymbol = '+'
    autocompleteWithEscapePrompt.done = jest.fn()

    autocompleteWithEscapePrompt.onKeypress(input)

    expect(autocompleteWithEscapePrompt.done).toHaveBeenCalledWith('+')
  })
})
