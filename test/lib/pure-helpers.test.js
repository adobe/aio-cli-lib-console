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
const helpers = require('../../lib/pure-helpers')
const dataMocks = require('../data-mocks')

test('exports', () => {
  expect(typeof helpers.orgsToPromptChoices).toBe('function')
  expect(typeof helpers.projectsToPromptChoices).toBe('function')
  expect(typeof helpers.workspacesToPromptChoices).toBe('function')
  expect(typeof helpers.servicesToPromptChoices).toBe('function')
  expect(typeof helpers.licenseConfigsToPromptChoices).toBe('function')
  expect(typeof helpers.getUniqueServiceCode).toBe('function')
  expect(typeof helpers.filterEnabledServices).toBe('function')
  expect(typeof helpers.findFirstEntpCredential).toBe('function')
  expect(typeof helpers.servicePropertiesToNames).toBe('function')
  expect(typeof helpers.fixServiceProperties).toBe('function')
  expect(typeof helpers.servicePropertiesToServiceSubscriptionPayload).toBe('function')
  expect(typeof helpers.getCertFilesLocation).toBe('function')
  expect(typeof helpers.missingInputs).toBe('function')
  expect(typeof helpers.findOrgOrThrow).toBe('function')
  expect(typeof helpers.findProjectOrThrow).toBe('function')
  expect(typeof helpers.findWorkspaceOrThrow).toBe('function')
  expect(typeof helpers.getAddServicesOperationPromptChoices).toBe('function')
})

describe('orgsToPromptChoices', () => {
  test('with input that has entp and non entp orgs', () => {
    expect(helpers.orgsToPromptChoices(dataMocks.organizations)).toEqual([
      { name: dataMocks.organizations[0].name, value: dataMocks.organizations[0] },
      { name: dataMocks.organizations[2].name, value: dataMocks.organizations[2] }
    ])
  })
})

describe('projectsToPromptChoices', () => {
  test('with input that has deleted, not enabled and non-jaeger projects', () => {
    // expects in reverse order (latest created first)
    expect(helpers.projectsToPromptChoices(dataMocks.projects)).toEqual([
      { name: dataMocks.projects[4].title, value: dataMocks.projects[4] },
      { name: dataMocks.projects[1].title, value: dataMocks.projects[1] }
    ])
  })
})

describe('workspacesToPromptChoices', () => {
  test('with input that not enabled and w/o runtime namespace workspaces', () => {
    // expects in reverse order (latest created first)
    expect(helpers.workspacesToPromptChoices(dataMocks.workspaces)).toEqual([
      { name: dataMocks.workspaces[0].name, value: dataMocks.workspaces[0] },
      { name: dataMocks.workspaces[1].name, value: dataMocks.workspaces[1] },
      { name: dataMocks.workspaces[2].name, value: dataMocks.workspaces[2] }
    ])
  })
})

describe('servicesToPromptChoices', () => {

})

describe('findOrgOrThrow', () => {
  test('with orgId found in organizations', () => {
    expect(helpers.findOrgOrThrow(dataMocks.org.id, dataMocks.organizations)).toEqual(dataMocks.org)
  })
  test('with orgId not found in organizations', () => {
    expect(() => helpers.findOrgOrThrow('iamanonexistingid', dataMocks.organizations)).toThrow('Org with id iamanonexistingid not found')
  })
})

describe('findProjectOrThrow', () => {
  test('with projectId found in projects', () => {
    expect(helpers.findProjectOrThrow(dataMocks.project.id, dataMocks.projects)).toEqual(dataMocks.project)
  })
  test('with projectId not found in projects', () => {
    expect(() => helpers.findProjectOrThrow('iamanonexistingid', dataMocks.projects)).toThrow('Project with id iamanonexistingid not found')
  })
})

describe('findWorkspaceOrThrow', () => {
  test('with workspaceId found in workspaces', () => {
    expect(helpers.findWorkspaceOrThrow(dataMocks.workspace.id, dataMocks.workspaces)).toEqual(dataMocks.workspace)
  })
  test('with workspaceId not found in workspaces', () => {
    expect(() => helpers.findWorkspaceOrThrow('iamanonexistingid', dataMocks.workspaces)).toThrow('Workspace with id iamanonexistingid not found')
  })
})
