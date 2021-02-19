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

const v = require('../../lib/validate')

describe('validateProjectName', () => {
  let input
  test('success', () => {
    input = 'aBcD1234' // mixed case
    expect(v.validateProjectName(input)).toBe(true)

    input = '12345678901234567890' // 20 char input
    expect(v.validateProjectName(input)).toBe(true)

    input = 'a' // 1 char input
    expect(v.validateProjectName(input)).toBe(true)
  })
  test('failure', () => {
    // the error string is returned if the input is invalid (bool true if valid)

    input = 'aBcD^&1234' // input with special char
    expect(typeof v.validateProjectName(input)).toEqual('string')

    input = 'aBCd 123' // input with spaces
    expect(typeof v.validateProjectName(input)).toEqual('string')

    input = 'aBCd-123' // input with hyphen
    expect(typeof v.validateProjectName(input)).toEqual('string')

    input = '123456789012345678901' // 21 char input
    expect(typeof v.validateProjectName(input)).toEqual('string')

    input = '' // 0 empty
    expect(typeof v.validateProjectName(input)).toEqual('string')
  })
})

describe('validateWorkspaceName', () => {
  let input
  test('success', () => {
    input = 'aBcD1234' // mixed case
    expect(v.validateWorkspaceName(input)).toBe(true)

    input = '12345678901234567890' // 20 char input
    expect(v.validateWorkspaceName(input)).toBe(true)

    input = 'a' // 1 char input
    expect(v.validateWorkspaceName(input)).toBe(true)
  })
  test('failure', () => {
    // the error string is returned if the input is invalid (bool true if valid)

    input = 'aBcD^&1234' // input with special char
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')

    input = 'aBCd 123' // input with spaces
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')

    input = 'aBCd-123' // input with hyphen
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')

    input = '123456789012345678901' // 21 char input
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')

    input = '' // 0 empty
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')

    input = '    ' // only spaces
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')
  })
})

describe('validateProjectTitle', () => {
  let input
  test('success', () => {
    input = 'aBcD1234' // mixed case
    expect(v.validateProjectTitle(input)).toBe(true)

    input = 'aBcD 1234 xyZ' // mixed case with spaces
    expect(v.validateProjectTitle(input)).toBe(true)

    input = 'üøäî' // special alphabetic chars
    expect(v.validateProjectTitle(input)).toBe(true)

    input = '123456789012345678901234567890123456789012345' // 45 char input
    expect(v.validateProjectTitle(input)).toBe(true)

    input = 'a' // 1 char input
    expect(v.validateProjectTitle(input)).toBe(true)

    input = ' a   ' // trailing spaces are allowed
    expect(v.validateProjectTitle(input)).toBe(true)
  })

  test('failure', () => {
    // the error string is returned if the input is invalid (bool true if valid)

    input = '-' // input is a special char
    expect(typeof v.validateProjectTitle(input)).toEqual('string')

    input = '1234567890123456789012345678901234567890123456' // 46 char input
    expect(typeof v.validateProjectTitle(input)).toEqual('string')

    input = '' // 0 char input
    expect(typeof v.validateProjectTitle(input)).toEqual('string')

    input = '    ' // only spaces
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')
  })
})

describe('validateWorkspaceTitle', () => {
  let input
  test('success', () => {
    input = 'aBcD1234' // mixed case
    expect(v.validateWorkspaceTitle(input)).toBe(true)

    input = 'aBcD 1234 xyZ' // mixed case with spaces
    expect(v.validateWorkspaceTitle(input)).toBe(true)

    input = 'üøäî' // special alphabetic chars
    expect(v.validateProjectTitle(input)).toBe(true)

    input = '123456789012345678901234567890123456789012345' // 45 char input
    expect(v.validateWorkspaceTitle(input)).toBe(true)

    input = 'a' // 1 char input
    expect(v.validateWorkspaceTitle(input)).toBe(true)

    input = ' a  ' // trailing spaces
    expect(v.validateWorkspaceTitle(input)).toBe(true)

    input = '' // 0 char input
    expect(v.validateWorkspaceTitle(input)).toBe(true)
  })

  test('failure', () => {
    // the error string is returned if the input is invalid (bool true if valid)

    input = '-' // input is a special char
    expect(typeof v.validateWorkspaceTitle(input)).toEqual('string')

    input = '1234567890123456789012345678901234567890123456' // 46 char input
    expect(typeof v.validateWorkspaceTitle(input)).toEqual('string')

    input = '    ' // only spaces
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')
  })
})

describe('validateProjectDescription', () => {
  let input
  test('success', () => {
    input = 'aBcD1234' // mixed case
    expect(v.validateProjectDescription(input)).toBe(true)

    input = 'aBcD 1234 xyZ' // mixed case with spaces
    expect(v.validateProjectDescription(input)).toBe(true)

    input = 'aBcD 1234 xyZ üîø &!)*(#&$@{}:-' // mixed case with spaces and symbols
    expect(v.validateProjectDescription(input)).toBe(true)

    input = '1234567890'.repeat(100) // 1000 char input
    expect(v.validateProjectDescription(input)).toBe(true)

    input = 'a' // 1 char input
    expect(v.validateProjectDescription(input)).toBe(true)

    input = ' a  ' // trailing spaces
    expect(v.validateWorkspaceTitle(input)).toBe(true)

    input = '' // 0 char input
    expect(v.validateProjectDescription(input)).toBe(true)
  })

  test('failure', () => {
    // the error string is returned if the input is invalid (bool true if valid)

    input = '1234567890'.repeat(100) + '1' // 1001 char input
    expect(typeof v.validateProjectDescription(input)).toEqual('string')

    input = '    ' // only spaces
    expect(typeof v.validateWorkspaceName(input)).toEqual('string')
  })
})

describe('atLeastOne', () => {
  test('none', () => {
    expect(v.atLeastOne([])).toEqual('please choose at least one option')
  })
  test('1', () => {
    expect(v.atLeastOne([1])).toEqual(true)
  })
  test('2', () => {
    expect(v.atLeastOne([1, 2])).toEqual(true)
  })
})
