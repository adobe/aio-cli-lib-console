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
const path = require('path')

test('exports', () => {
  expect(typeof helpers.orgsToPromptChoices).toBe('function')
  expect(typeof helpers.projectsToPromptChoices).toBe('function')
  expect(typeof helpers.workspacesToPromptChoices).toBe('function')
  expect(typeof helpers.servicesToPromptChoices).toBe('function')
  expect(typeof helpers.licenseConfigsToPromptChoices).toBe('function')
  expect(typeof helpers.filterEnabledServices).toBe('function')
  expect(typeof helpers.findFirstEntpCredential).toBe('function')
  expect(typeof helpers.servicePropertiesToNames).toBe('function')
  expect(typeof helpers.fixServiceProperties).toBe('function')
  expect(typeof helpers.servicePropertiesToServiceSubscriptionPayload).toBe('function')
  expect(typeof helpers.getCertFilesLocation).toBe('function')
  expect(typeof helpers.findOrgOrThrow).toBe('function')
  expect(typeof helpers.findProjectOrThrow).toBe('function')
  expect(typeof helpers.findWorkspaceOrThrow).toBe('function')
  expect(typeof helpers.getServiceSubscriptionsOperationPromptChoices).toBe('function')
  expect(typeof helpers.enhanceWorkspaceConfiguration).toBe('function')
  expect(typeof helpers.workspaceNamesToPromptString).toBe('function')
})

describe('orgsToPromptChoices', () => {
  test('with input that has entp and non entp orgs', () => {
    expect(helpers.orgsToPromptChoices(dataMocks.organizations))
      .toEqual(dataMocks.promptChoices.orgs)
  })
})

describe('projectsToPromptChoices', () => {
  test('with input that has deleted, not enabled and non-jaeger projects', () => {
    // expects in reverse order (latest created first)
    expect(helpers.projectsToPromptChoices(dataMocks.projects))
      .toEqual(dataMocks.promptChoices.projects)
  })
})

describe('workspacesToPromptChoices', () => {
  test('with some workspaces that are not enabled and w/o runtime namespace workspaces', () => {
    // expects in reverse order (latest created first)
    expect(helpers.workspacesToPromptChoices(dataMocks.workspaces))
      .toEqual(dataMocks.promptChoices.workspaces)
  })
})

describe('licenseConfigsToPromptChoices', () => {
  test('with input licenseConfigs', () => {
    const licenseConfigs = dataMocks.serviceProperties[1].licenseConfigs
    expect(helpers.licenseConfigsToPromptChoices(licenseConfigs))
      .toEqual(dataMocks.promptChoices.licenseConfigs[1])
  })
})

describe('servicesToPromptChoices', () => {
  test('with some not enabled services and some not entp services', () => {
    expect(helpers.servicesToPromptChoices(dataMocks.services))
      .toEqual(dataMocks.promptChoices.services)
  })
})

test('filterEnabledServices', () => {
  expect(helpers.filterEnabledServices(dataMocks.services)).toEqual(dataMocks.enabledServices)
})

describe('findFirstEntpCredential', () => {
  test('when there is one', () => {
    expect(helpers.findFirstEntpCredential(dataMocks.integrations))
      .toEqual(dataMocks.integrations[2])
  })
  test('when there is none', () => {
    expect(helpers.findFirstEntpCredential([])).toEqual(undefined)
  })
})

test('servicePropertiesToNames', () => {
  const serviceProperties = dataMocks.serviceProperties
  expect(helpers.servicePropertiesToNames(serviceProperties)).toEqual([
    serviceProperties[0].name, serviceProperties[1].name, serviceProperties[2].name
  ])
})

describe('fixServiceProperties', () => {
  test('with serviceProperties that need fixing', () => {
    const allLicenseConfigs = dataMocks.serviceProperties
      .filter(sp => !!sp.licenseConfigs)
      .map(sp => sp.licenseConfigs)
      // flatten the array
      .reduce((flat, arr) => flat.concat(arr), [])
    const brokenServiceProperties = dataMocks.serviceProperties
      .map(sp => ({ ...sp, licenseConfigs: allLicenseConfigs }))
    expect(helpers.fixServiceProperties(brokenServiceProperties, dataMocks.services))
      .toEqual(dataMocks.serviceProperties)
  })
})

test('servicePropertiesToServiceSubscriptionPayload', () => {
  expect(helpers.servicePropertiesToServiceSubscriptionPayload(dataMocks.serviceProperties))
    .toEqual(dataMocks.subscribeServicesPayload)
})

test('getCertFilesLocation', () => {
  expect(helpers.getCertFilesLocation('orgid', 'projectname', 'workspacename', 'certdir')).toEqual({
    projectCertDir: `certdir${path.sep}orgid-projectname`,
    publicKeyFileName: 'workspacename.pem',
    privateKeyFileName: 'workspacename.key',
    publicKeyFilePath: `certdir${path.sep}orgid-projectname${path.sep}workspacename.pem`,
    privateKeyFilePath: `certdir${path.sep}orgid-projectname${path.sep}workspacename.key`
  })
})

describe('getServiceSubscriptionsOperationPromptChoices', () => {
  test('default', () => {
    expect(helpers.getServiceSubscriptionsOperationPromptChoices()).toEqual(
      [
        { name: expect.any(String), value: 'select' },
        { name: expect.any(String), value: 'nop' }
      ]
    )
  })
  test('cloneChoice=false, nopChoice = false', () => {
    expect(helpers.getServiceSubscriptionsOperationPromptChoices({ cloneChoice: false, nopChoice: false })).toEqual(
      [
        { name: expect.any(String), value: 'select' }
      ]
    )
  })
  test('cloneChoice=false, nopChoice = true', () => {
    expect(helpers.getServiceSubscriptionsOperationPromptChoices({ cloneChoice: false, nopChoice: true })).toEqual(
      [
        { name: expect.any(String), value: 'select' },
        { name: expect.any(String), value: 'nop' }
      ]
    )
  })
  test('cloneChoice=true, nopChoice = false', () => {
    expect(helpers.getServiceSubscriptionsOperationPromptChoices({ cloneChoice: true, nopChoice: false })).toEqual(
      [
        { name: expect.any(String), value: 'select' },
        { name: expect.any(String), value: 'clone' }
      ]
    )
  })
  test('cloneChoice=true, nopChoice = true', () => {
    expect(helpers.getServiceSubscriptionsOperationPromptChoices({ cloneChoice: true, nopChoice: true })).toEqual(
      [
        { name: expect.any(String), value: 'select' },
        { name: expect.any(String), value: 'clone' },
        { name: expect.any(String), value: 'nop' }
      ]
    )
  })
})

describe('findOrgOrThrow', () => {
  test('with org id found in organizations', () => {
    expect(helpers.findOrgOrThrow(dataMocks.org.id, undefined, dataMocks.organizations))
      .toEqual(dataMocks.org)
  })
  test('with org code found in organizations', () => {
    expect(helpers.findOrgOrThrow(undefined, dataMocks.org.code, dataMocks.organizations))
      .toEqual(dataMocks.org)
  })
  test('with org code and id pointing to same org', () => {
    expect(helpers.findOrgOrThrow(dataMocks.org.id, dataMocks.org.code, dataMocks.organizations))
      .toEqual(dataMocks.org)
  })
  test('with org code and id pointing to different orgs', () => {
    expect(() => helpers.findOrgOrThrow(dataMocks.organizations[0].id, dataMocks.organizations[1].code, dataMocks.organizations))
      .toThrow("Organization code '22222222226666666666DDDD@AdobeOrg' and id '12345' do not refer to the same Organization.")
  })
  test('with orgId not found in organizations', () => {
    expect(() => helpers.findOrgOrThrow('iamanonexistingid', undefined, dataMocks.organizations))
      .toThrow("Organization 'iamanonexistingid' not found.")
  })
  test('with orgId and code not found in organizations', () => {
    expect(() => helpers.findOrgOrThrow('iamanonexistingid', 'badcode', dataMocks.organizations))
      .toThrow("Organization 'badcode' not found.")
  })
})

describe('findProjectOrThrow', () => {
  test('with projectId found in projects', () => {
    expect(helpers.findProjectOrThrow(dataMocks.project.id, undefined, dataMocks.projects))
      .toEqual(dataMocks.project)
  })
  test('with projectName found in projects', () => {
    expect(helpers.findProjectOrThrow(undefined, dataMocks.project.name, dataMocks.projects))
      .toEqual(dataMocks.project)
  })
  test('with projectName and projectId pointing to the same project', () => {
    expect(helpers.findProjectOrThrow(dataMocks.project.id, dataMocks.project.name, dataMocks.projects))
      .toEqual(dataMocks.project)
  })
  test('with projectId and projectName pointing to different projects', () => {
    expect(() => helpers.findProjectOrThrow(dataMocks.projects[0].id, dataMocks.projects[1].name, dataMocks.projects))
      .toThrow("Project name 'mySecondProject' and id '1234567890123456789' do not refer to the same Project.")
  })
  test('with projectId not found in projects', () => {
    expect(() => helpers.findProjectOrThrow('iamanonexistingid', undefined, dataMocks.projects))
      .toThrow("Project 'iamanonexistingid' not found.")
  })
  test('with projectId and projectName not found in projects', () => {
    expect(() => helpers.findProjectOrThrow('iamanonexistingid', 'cannotfind', dataMocks.projects))
      .toThrow("Project 'cannotfind' not found.")
  })
})

describe('findWorkspaceOrThrow', () => {
  test('with workspaceId found in workspaces', () => {
    expect(helpers.findWorkspaceOrThrow(dataMocks.workspace.id, undefined, dataMocks.workspaces))
      .toEqual(dataMocks.workspace)
  })
  test('with workspaceName found in workspaces', () => {
    expect(helpers.findWorkspaceOrThrow(undefined, dataMocks.workspace.name, dataMocks.workspaces))
      .toEqual(dataMocks.workspace)
  })
  test('with workspaceId and workspaceName pointing to same workspace', () => {
    expect(helpers.findWorkspaceOrThrow(dataMocks.workspace.id, dataMocks.workspace.name, dataMocks.workspaces))
      .toEqual(dataMocks.workspace)
  })
  test('with workspace id and workspace name pointing to two different workspaces', () => {
    expect(() => helpers.findWorkspaceOrThrow(dataMocks.workspaces[0].id, dataMocks.workspaces[1].name, dataMocks.workspaces))
      .toThrow("Workspace name 'Stage' and id '1111111111111111111' do not refer to the same Workspace.")
  })
  test('with workspace id and workspace name not found in workspaces', () => {
    expect(() => helpers.findWorkspaceOrThrow('iamanonexistingid', 'cantfind', dataMocks.workspaces))
      .toThrow("Workspace 'cantfind' not found.")
  })
  test('with workspaceId not found in workspaces', () => {
    expect(() => helpers.findWorkspaceOrThrow('iamanonexistingid', undefined, dataMocks.workspaces))
      .toThrow("Workspace 'iamanonexistingid' not found.")
  })
})

test('enhanceWorkspaceConfiguration', () => {
  expect(helpers.enhanceWorkspaceConfiguration(dataMocks.workspaceJson, dataMocks.services))
    .toEqual(dataMocks.enhancedWorkspaceJson)
})

describe('workspaceNamesToPromptString', () => {
  test('workspaceName is string', () => {
    expect(helpers.workspaceNamesToPromptString('wname')).toEqual('Workspace wname')
  })
  test('workspaceName is array of 1', () => {
    expect(helpers.workspaceNamesToPromptString(['wname'])).toEqual('Workspace wname')
  })
  test('workspaceName is array of 2', () => {
    expect(helpers.workspaceNamesToPromptString(['wname', 'wname2'])).toEqual('Workspaces wname and wname2')
  })
  test('workspaceName is array of 3', () => {
    expect(helpers.workspaceNamesToPromptString(['wname', 'wname2', 'wname3'])).toEqual('Workspaces wname, wname2 and wname3')
  })
})

test('mergeExtensionPoints', () => {
  const newWorkspaceEndPoints = {
    endpoints: {
      'dx/asset-compute/worker/1' : {
        worker: "test"
      }
    }
  }

  const expectedResults = {
    endpoints: {
      'dx/asset-compute/worker/1' : {
        worker: "test"
      },
      'dx/excshell/1' : {
        view: "test"
      }
    }
  }
  expect(helpers.mergeExtensionPoints(dataMocks.baseWorkspaceEndPoints, newWorkspaceEndPoints))
    .toEqual(expectedResults)
})

test('removeExtensionPoints', () => {
  const toBeRemoved = {
    endpoints: {
      'dx/asset-compute/worker/1' : {
        worker: "test"
      }
    }
  }

  const expectedResults = {
    endpoints: {
      'dx/excshell/1' : {
        view: "test"
      }
    }
  }
  expect(helpers.removeExtensionPoints(dataMocks.multipleWorkspaceEndPoints, toBeRemoved))
    .toEqual(expectedResults)
})
