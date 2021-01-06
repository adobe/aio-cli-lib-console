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

jest.mock('../../lib/inquirer-autocomplete-with-escape-prompt', () => 'custom-prompt')
jest.mock('inquirer')

const inquirer = require('inquirer')
const { mockPrompt } = require('yeoman-test')
inquirer.prompt = jest.fn()
inquirer.registerPrompt = jest.fn()

// after global mocks
const prompt = require('../../lib/prompt')

beforeEach(() => {
  inquirer.prompt.mockReset()
})

/** @private */
function mockPromptInput (input) {
  inquirer.prompt.mockReset()
  if (!Array.isArray(input)) {
    input = [input]
  }
  input.forEach(i => {
    inquirer.prompt.mockResolvedValueOnce({ res: i })
  })
}

test('exports', () => {
  expect(typeof prompt.promptSelect).toEqual('function')
  expect(typeof prompt.promptSelectOrCreate).toEqual('function')
  expect(typeof prompt.promptInput).toEqual('function')
  expect(typeof prompt.promptMultiSelect).toEqual('function')
  expect(typeof prompt.createSourceForPromptSelect).toEqual('function')
})

test('register custom auto complete prompt on require', () => {
  expect(inquirer.registerPrompt).toHaveBeenCalledWith('autocomplete-with-escape', 'custom-prompt')
})

test('promptSelect', async () => {
  const mockReturnValue = 'choice'
  mockPromptInput(mockReturnValue)
  await expect(prompt.promptSelect('what', [mockReturnValue])).resolves.toEqual(mockReturnValue)
  expect(inquirer.prompt).toHaveBeenCalledWith([expect.objectContaining({ message: 'Select what:' })])
})

test('promptChoice', async () => {
  const mockReturnValue = 'choice'
  mockPromptInput(mockReturnValue)
  await expect(prompt.promptChoice('message', [mockReturnValue])).resolves.toEqual(mockReturnValue)
  expect(inquirer.prompt).toHaveBeenCalledWith([expect.objectContaining({ message: 'message' })])
})

test('promptSelectOrCreate', async () => {
  let mockReturnValue

  mockReturnValue = 'existingProject'
  mockPromptInput(mockReturnValue)
  await expect(prompt.promptSelectOrCreate('what', [mockReturnValue, 'anotherProject'])).resolves.toEqual(mockReturnValue)

  // data empty, nothing to select from (console.log and returns null for creation)
  await expect(prompt.promptSelectOrCreate('what')).resolves.toEqual(null)

  // ask for creation by user, no confirmation then confirm creation
  mockReturnValue = ['+', false, '+', true]
  mockPromptInput(mockReturnValue)
  inquirer.prompt.mockReturnValue({ res: mockReturnValue })
  await expect(prompt.promptSelectOrCreate('what', ['projectA', 'projectB'])).resolves.toEqual(null)

  // ask for creation by user, no confirmation then select existing project
  mockReturnValue = ['+', false, 'existingProject']
  mockPromptInput(mockReturnValue)
  await expect(prompt.promptSelectOrCreate('what', ['projectA', 'projectB'])).resolves.toEqual('existingProject')
})

test('promptInput', async () => {
  const mockReturnValue = 'project'
  mockPromptInput(mockReturnValue)
  await expect(prompt.promptInput('what')).resolves.toEqual(mockReturnValue)
})

test('promptMultiSelect', async () => {
  const mockReturnValue = 'project'
  mockPromptInput(mockReturnValue)
  await expect(prompt.promptMultiSelect('what', [mockReturnValue])).resolves.toEqual(mockReturnValue)
})

test('promptConfirm', async () => {
  mockPromptInput(true)
  await expect(prompt.promptConfirm('confirm?')).resolves.toEqual(true)

  mockPromptInput(false)
  await expect(prompt.promptConfirm('confirm?')).resolves.toEqual(false)
})

test('createSourceForPromptSelect', async () => {
  const sheep = { name: 'sheep', value: 'sheepvalue' }
  const dogs = { name: 'dogs', value: 'dogsvalue' }
  const ducks = { name: 'ducks', value: 'ducksvalue' }
  const data = [
    sheep,
    dogs,
    ducks,
    { name: 'cats', value: 'catsvalue' }
  ]

  const source = prompt.createSourceForPromptSelect(data)
  // default input (empty string), should return all the data
  await expect(source([])).resolves.toEqual(data)
  // input ('sheep'), should return ['sheep']
  await expect(source([], 'sheep')).resolves.toEqual([sheep])
  // partial input ('she'), should return single ['sheep']
  await expect(source([], 'she')).resolves.toEqual([sheep])
  // partial input ('d'), should return ['dogs', 'ducks']
  await expect(source([], 'd')).resolves.toEqual([dogs, ducks])
})
