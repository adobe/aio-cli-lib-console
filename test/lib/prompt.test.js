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

const prompt = require('../../lib/prompt')

/** @private */
function createReturnValue (value) {
  return {
    res: value
  }
}

/** @private */
function createMockGenerator (returnValue) {
  const generator = {
    prompt: jest.fn()
  }

  if (!Array.isArray(returnValue)) {
    returnValue = [returnValue]
  }

  returnValue.forEach((value) => generator.prompt.mockReturnValueOnce(createReturnValue(value)))
  return generator
}

test('exports', () => {
  const genPrompt = prompt({})
  expect(typeof genPrompt.promptSelect).toEqual('function')
  expect(typeof genPrompt.promptSelectOrCreate).toEqual('function')
  expect(typeof genPrompt.promptInput).toEqual('function')
  expect(typeof genPrompt.promptMultiSelect).toEqual('function')
  expect(typeof genPrompt.createSourceForPromptSelect).toEqual('function')
})

test('promptSelect', async () => {
  const mockReturnValue = 'project'
  const mockGenerator = createMockGenerator(mockReturnValue)

  const genPrompt = prompt(mockGenerator)
  await expect(genPrompt.promptSelect('what', [mockReturnValue])).resolves.toEqual(mockReturnValue)
})

test('promptSelectOrCreate', async () => {
  let mockReturnValue, mockGenerator, genPrompt

  mockReturnValue = 'existingProject'
  mockGenerator = createMockGenerator(mockReturnValue)
  genPrompt = prompt(mockGenerator)
  await expect(genPrompt.promptSelectOrCreate('what', [mockReturnValue, 'anotherProject'])).resolves.toEqual(mockReturnValue)

  // data empty, nothing to select from (console.log and returns null for creation)
  await expect(genPrompt.promptSelectOrCreate('what')).resolves.toEqual(null)

  // ask for creation by user, no confirmation then confirm creation
  mockReturnValue = ['+', false, '+', true]
  mockGenerator = createMockGenerator(mockReturnValue)
  genPrompt = prompt(mockGenerator)
  await expect(genPrompt.promptSelectOrCreate('what', ['projectA', 'projectB'])).resolves.toEqual(null)

  // ask for creation by user, no confirmation then select existing project
  mockReturnValue = ['+', false, 'existingProject']
  mockGenerator = createMockGenerator(mockReturnValue)
  genPrompt = prompt(mockGenerator)
  await expect(genPrompt.promptSelectOrCreate('what', ['projectA', 'projectB'])).resolves.toEqual('existingProject')
})

test('promptInput', async () => {
  const mockReturnValue = 'project'
  const mockGenerator = createMockGenerator(mockReturnValue)

  const genPrompt = prompt(mockGenerator)
  await expect(genPrompt.promptInput('what')).resolves.toEqual(mockReturnValue)
})

test('promptMultiSelect', async () => {
  const mockReturnValue = 'project'
  const mockGenerator = createMockGenerator(mockReturnValue)

  const genPrompt = prompt(mockGenerator)
  await expect(genPrompt.promptMultiSelect('what', [mockReturnValue])).resolves.toEqual(mockReturnValue)
})

test('createSourceForPromptSelect', async () => {
  const sheep = 'sheep'
  const dogs = 'dogs'
  const ducks = 'ducks'
  const data = [dogs, ducks, sheep, 'cats']
  const genPrompt = prompt(createMockGenerator('dummy'))

  const source = genPrompt.createSourceForPromptSelect(data)
  // default input (empty string), should return all the data
  await expect(source([])).resolves.toEqual(data)
  // input ('sheep'), should return ['sheep']
  await expect(source([], sheep)).resolves.toEqual([sheep])
  // partial input ('she'), should return single ['sheep']
  await expect(source([], 'she')).resolves.toEqual([sheep])
  // partial input ('d'), should return ['dogs', 'ducks']
  await expect(source([], 'd')).resolves.toEqual([dogs, ducks])
})
