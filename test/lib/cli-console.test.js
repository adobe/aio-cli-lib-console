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

const dataMocks = require('../data-mocks')

// console sdk mock setup
jest.mock('@adobe/aio-lib-console')
const consoleSDK = require('@adobe/aio-lib-console')
const mockConsoleSDKInstance = {
  getOrganizations: jest.fn(),
  getProjectsForOrg: jest.fn(),
  getWorkspacesForProject: jest.fn(),
  getServicesForOrg: jest.fn(),
  createWorkspace: jest.fn(),
  createProject: jest.fn(),
  getWorkspace: jest.fn(),
  getProject: jest.fn(),
  createRuntimeNamespace: jest.fn(),
  downloadWorkspaceJson: jest.fn(),
  subscribeCredentialToServices: jest.fn(),
  getSDKProperties: jest.fn(),
  getIntegration: jest.fn(),
  createEnterpriseCredential: jest.fn(),
  getCredentials: jest.fn()
}
consoleSDK.init.mockResolvedValue(mockConsoleSDKInstance)
/** @private */
function resetConsoleSDKMocks () {
  Object.keys(mockConsoleSDKInstance).forEach(
    k => mockConsoleSDKInstance[k].mockReset()
  )
  consoleSDK.init.mockClear()
}
/** @private */
function setDefaultConsoleSdkMockData () {
  mockConsoleSDKInstance.getOrganizations.mockResolvedValue({ body: dataMocks.organizations })
  mockConsoleSDKInstance.getProjectsForOrg.mockResolvedValue({ body: dataMocks.projects })
  mockConsoleSDKInstance.getWorkspacesForProject.mockResolvedValue({ body: dataMocks.workspaces })
  mockConsoleSDKInstance.getServicesForOrg.mockResolvedValue({ body: dataMocks.services })
  mockConsoleSDKInstance.getProject.mockResolvedValue({ body: dataMocks.project })
  mockConsoleSDKInstance.getWorkspace.mockResolvedValue({ body: dataMocks.workspace })
  mockConsoleSDKInstance.createProject.mockResolvedValue({ body: dataMocks.project })
  mockConsoleSDKInstance.createWorkspace.mockResolvedValue({ body: dataMocks.workspace })
  mockConsoleSDKInstance.downloadWorkspaceJson.mockResolvedValue({ body: dataMocks.workspaceJson })
  mockConsoleSDKInstance.createRuntimeNamespace.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.subscribeCredentialToServices.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.getSDKProperties.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.getIntegration.mockResolvedValue({ body: dataMocks.integration })
  mockConsoleSDKInstance.createEnterpriseCredential.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.getCredentials.mockResolvedValue({ body: dataMocks.integrations })
}

// ora mocks setup before requiring  LibConsoleCli
jest.mock('ora')
const mockOraObject = {
  start: jest.fn(),
  stop: jest.fn()
}
const ora = require('ora')
ora.mockReturnValue(mockOraObject)
/** @private */
function resetMockOraObject () {
  mockOraObject.start.mockReset()
  mockOraObject.stop.mockReset()
}

// fake credentials
const consoleCredentials = {
  env: 'env',
  accessToken: 'accessToken',
  apiKey: 'apiKey'
}

// reset and set mocks before each test
beforeEach(() => {
  resetConsoleSDKMocks()
  setDefaultConsoleSdkMockData()
  resetMockOraObject()
})

// require lib after setting up mocks
const LibConsoleCli = require('../../lib/console-cli')

test('init', async () => {
  await LibConsoleCli.init(consoleCredentials, {})
  expect(consoleSDK.init).toHaveBeenCalledWith(
    consoleCredentials.accessToken,
    consoleCredentials.apiKey,
    consoleCredentials.env
  )
})

test('instance methods definitions', async () => {
  const consoleCli = await LibConsoleCli.init(consoleCredentials, {})
  // rd console api methods
  expect(typeof consoleCli.getEnabledServicesForOrg).toBe('function')
  expect(typeof consoleCli.getFirstEntpCredentials).toBe('function')
  expect(typeof consoleCli.getOrganizations).toBe('function')
  expect(typeof consoleCli.getProjects).toBe('function')
  expect(typeof consoleCli.getWorkspaces).toBe('function')
  expect(typeof consoleCli.getServicePropertiesFromWorkspace).toBe('function')
  expect(typeof consoleCli.getWorkspaceConfig).toBe('function')
  // wr console api methods
  expect(typeof consoleCli.addServicesToWorkspace).toBe('function')
  expect(typeof consoleCli.createEnterpriseCredentials).toBe('function')
  expect(typeof consoleCli.createProject).toBe('function')
  expect(typeof consoleCli.createWorkspace).toBe('function')
  // prompt methods
  expect(typeof consoleCli.promptForServiceProperties).toBe('function')
  expect(typeof consoleCli.promptForAddServicesOperation).toBe('function')
  expect(typeof consoleCli.promptForCreateProjectDetails).toBe('function')
  expect(typeof consoleCli.promptForCreateWorkspaceDetails).toBe('function')
  expect(typeof consoleCli.promptForSelectOrganization).toBe('function')
  expect(typeof consoleCli.promptForSelectProject).toBe('function')
  expect(typeof consoleCli.promptForSelectWorkspace).toBe('function')
  expect(typeof consoleCli.confirmAddServicesToWorkspace).toBe('function')
})

describe('instance methods tests', () => {
  /** @type {LibConsoleCli} */
  let consoleCli
  beforeEach(async () => {
    consoleCli = await LibConsoleCli.init(consoleCredentials)
  })

  test('getOrganizations', async () => {
    const organizations = await consoleCli.getOrganizations()
    expect(organizations).toEqual(dataMocks.organizations)
    expect(mockConsoleSDKInstance.getOrganizations).toHaveBeenCalled()
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('getProjects', async () => {
    const projects = await consoleCli.getProjects('orgid')
    expect(projects).toEqual(dataMocks.projects)
    expect(mockConsoleSDKInstance.getProjectsForOrg).toHaveBeenCalledWith('orgid')
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('getWorkspaces', async () => {
    const workspace = await consoleCli.getWorkspaces('orgid', 'projectid')
    expect(workspace).toEqual(dataMocks.workspaces)
    expect(mockConsoleSDKInstance.getWorkspacesForProject).toHaveBeenCalledWith('orgid', 'projectid')
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('getEnabledServicesForOrg', async () => {
    const services = await consoleCli.getEnabledServicesForOrg('orgid')
    expect(services).toEqual(dataMocks.enabledServices)
    expect(mockConsoleSDKInstance.getServicesForOrg).toHaveBeenCalledWith('orgid')
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })
})
