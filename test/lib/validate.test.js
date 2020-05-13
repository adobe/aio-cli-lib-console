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

const { validateName, validateTitle } = require('../../lib/validate')

test('validateName success', () => {
  let name

  name = 'aBcD1234' // mixed case
  expect(validateName(name)).toBe(true)

  name = '12345678901234567890' // 20 char name
  expect(validateName(name)).toBe(true)

  name = 'a' // 1 char name
  expect(validateName(name)).toBe(true)
})

test('validateName failure', () => {
  let name

  // the error string is returned if the name is invalid (bool true if valid)

  name = 'aBcD^&1234' // name with special char
  expect(typeof validateName(name)).toEqual('string')

  name = 'aBCd 123' // name with spaces
  expect(typeof validateName(name)).toEqual('string')

  name = 'aBCd-123' // name with hyphen
  expect(typeof validateName(name)).toEqual('string')

  name = '123456789012345678901' // 21 char name
  expect(typeof validateName(name)).toEqual('string')

  name = '' // 0 char name
  expect(typeof validateName(name)).toEqual('string')
})

test('validateTitle success', () => {
  let name

  name = 'aBcD1234' // mixed case
  expect(validateTitle(name)).toBe(true)

  name = 'aBcD 1234 xyZ' // mixed case with spaces
  expect(validateTitle(name)).toBe(true)

  name = '123456789012345678901234567890123456789012345' // 45 char name
  expect(validateTitle(name)).toBe(true)

  name = 'a' // 1 char name
  expect(validateTitle(name)).toBe(true)
})

test('validateTitle failure', () => {
  let name

  // the error string is returned if the name is invalid (bool true if valid)

  name = '-' // name is a special char
  expect(typeof validateTitle(name)).toEqual('string')

  name = '1234567890123456789012345678901234567890123456' // 46 char name
  expect(typeof validateTitle(name)).toEqual('string')

  name = '' // 0 char name
  expect(typeof validateTitle(name)).toEqual('string')
})
