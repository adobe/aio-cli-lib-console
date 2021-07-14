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
const path = require('path')
const validators = require('../../lib/validate')

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
  getCredentials: jest.fn(),
  getEndPointsInWorkspace: jest.fn(),
  updateEndPointsInWorkspace: jest.fn(),
  getAllExtensionPoints: jest.fn()
}
consoleSDK.init.mockResolvedValue(mockConsoleSDKInstance)
/** @private */
function resetMockConsoleSDK () {
  Object.keys(mockConsoleSDKInstance).forEach(
    k => mockConsoleSDKInstance[k].mockReset()
  )
  consoleSDK.init.mockClear()
}

/** @private */
function setDefaultMockConsoleSdk () {
  mockConsoleSDKInstance.getOrganizations.mockResolvedValue({ body: dataMocks.organizations })
  mockConsoleSDKInstance.getProjectsForOrg.mockResolvedValue({ body: dataMocks.projects })
  mockConsoleSDKInstance.getWorkspacesForProject.mockResolvedValue({ body: dataMocks.workspaces })
  mockConsoleSDKInstance.getServicesForOrg.mockResolvedValue({ body: dataMocks.services })
  mockConsoleSDKInstance.getProject.mockResolvedValue({ body: dataMocks.project })
  mockConsoleSDKInstance.getWorkspace.mockResolvedValue({ body: dataMocks.workspace })
  mockConsoleSDKInstance.createProject.mockResolvedValue({ body: { projectId: dataMocks.project.id } })
  mockConsoleSDKInstance.createWorkspace.mockResolvedValue({ body: { workspaceId: dataMocks.workspace.id } })
  mockConsoleSDKInstance.downloadWorkspaceJson.mockResolvedValue({ body: dataMocks.workspaceJson })
  mockConsoleSDKInstance.createRuntimeNamespace.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.subscribeCredentialToServices.mockResolvedValue({ body: dataMocks.subscribeServicesResponse })
  mockConsoleSDKInstance.getSDKProperties.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.getIntegration.mockResolvedValue({ body: dataMocks.integration })
  mockConsoleSDKInstance.createEnterpriseCredential.mockResolvedValue({ body: dataMocks.integrationCreateResponse })
  mockConsoleSDKInstance.getCredentials.mockResolvedValue({ body: dataMocks.integrations })
  mockConsoleSDKInstance.getEndPointsInWorkspace.mockResolvedValue({ body: dataMocks.baseWorkspaceEndPoints })
  mockConsoleSDKInstance.updateEndPointsInWorkspace.mockResolvedValue({ body: dataMocks.multipleWorkspaceEndPoints })
  mockConsoleSDKInstance.getAllExtensionPoints.mockResolvedValue({ body: dataMocks.allExtensionPoints })
}

// mock prompts
const mockPrompt = {
  promptChoice: jest.fn(),
  promptConfirm: jest.fn(),
  promptInput: jest.fn(),
  promptMultiSelect: jest.fn(),
  promptSelect: jest.fn(),
  promptSelectOrCreate: jest.fn()
}
jest.mock('../../lib/prompt.js', () => () => mockPrompt)
/** @private */
function resetMockPrompt () {
  mockPrompt.promptChoice.mockReset()
  mockPrompt.promptConfirm.mockReset()
  mockPrompt.promptInput.mockReset()
  mockPrompt.promptMultiSelect.mockReset()
  mockPrompt.promptSelect.mockReset()
  mockPrompt.promptSelectOrCreate.mockReset()
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

// mock certPlugin
jest.mock('@adobe/aio-cli-plugin-certificate')
const certPlugin = require('@adobe/aio-cli-plugin-certificate')
certPlugin.generate = jest.fn()
/** @private */
function resetMockCertPlugin () {
  certPlugin.generate.mockReset()
}
/** @private */
function setDefaultMockCertPlugin () {
  certPlugin.generate.mockReturnValue({ cert: 'fake public key', privateKey: 'fake private key' })
}

// mock fs
jest.mock('fs-extra')
const fs = require('fs-extra')
/** @private */
function resetMockFs () {
  fs.createReadStream.mockReset()
  fs.ensureDirSync.mockReset()
  fs.writeFileSync.mockReset()
}
/** @private */
function setDefaultMockFs () {
  fs.createReadStream.mockReturnValue('fake read stream')
}

// fake credentials
const consoleCredentials = {
  env: 'env',
  accessToken: 'accessToken',
  apiKey: 'apiKey'
}

// reset and set mocks before each test
beforeEach(() => {
  resetMockConsoleSDK()
  setDefaultMockConsoleSdk()
  resetMockOraObject()
  resetMockCertPlugin()
  setDefaultMockCertPlugin()
  resetMockFs()
  setDefaultMockFs()
  resetMockPrompt()
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

test('cleanStdOut', async () => {
  LibConsoleCli.cleanStdOut()
  expect(mockOraObject.stop).toHaveBeenCalled()
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
  expect(typeof consoleCli.subscribeToServices).toBe('function')
  expect(typeof consoleCli.createEnterpriseCredentials).toBe('function')
  expect(typeof consoleCli.createProject).toBe('function')
  expect(typeof consoleCli.createWorkspace).toBe('function')
  // prompt methods
  expect(typeof consoleCli.promptForSelectServiceProperties).toBe('function')
  expect(typeof consoleCli.promptForServiceSubscriptionsOperation).toBe('function')
  expect(typeof consoleCli.promptForRemoveServiceSubscriptions).toBe('function')
  expect(typeof consoleCli.promptForCreateProjectDetails).toBe('function')
  expect(typeof consoleCli.promptForCreateWorkspaceDetails).toBe('function')
  expect(typeof consoleCli.promptForSelectOrganization).toBe('function')
  expect(typeof consoleCli.promptForSelectProject).toBe('function')
  expect(typeof consoleCli.promptForSelectWorkspace).toBe('function')
  expect(typeof consoleCli.confirmNewServiceSubscriptions).toBe('function')
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

  test('createProject', async () => {
    // fresh project, mock workspaces to be only prod and stage
    mockConsoleSDKInstance.getWorkspacesForProject.mockResolvedValue({
      body: [
        dataMocks.workspaces[0],
        dataMocks.workspaces[1]
      ]
    })
    // project details can be whatever, in the end the returned project is mocked from getProject
    const project = await consoleCli.createProject(dataMocks.org.id, { name: 'name', title: 'title', description: 'description' })
    expect(project).toEqual(dataMocks.project)
    expect(mockConsoleSDKInstance.createProject).toHaveBeenCalledWith(
      dataMocks.org.id,
      { name: 'name', title: 'title', description: 'description', type: 'jaeger' }
    )
    // create additional needed resources
    expect(mockConsoleSDKInstance.createWorkspace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      { name: 'Stage' }
    )
    expect(mockConsoleSDKInstance.createRuntimeNamespace).toHaveBeenCalledTimes(2)
    expect(mockConsoleSDKInstance.createRuntimeNamespace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      dataMocks.workspaces[0].id
    )
    expect(mockConsoleSDKInstance.createRuntimeNamespace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      dataMocks.workspaces[1].id
    )
  })

  test('createWorkspace', async () => {
    // workspace details can be whatever, in the end the returned workspace is mocked from getWorkspace
    const workspace = await consoleCli.createWorkspace(dataMocks.org.id, dataMocks.project.id, { name: 'name', title: 'title' })
    expect(workspace).toEqual(dataMocks.workspace)
    expect(mockConsoleSDKInstance.createWorkspace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      { name: 'name', title: 'title' }
    )
    expect(mockConsoleSDKInstance.createRuntimeNamespace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      dataMocks.workspace.id
    )
  })

  describe('subscribeToServices', () => {
    test('services to be added and no integration to be created', async () => {
      // default mock of getCredentials returns the existing integration
      const ret = await consoleCli.subscribeToServices(
        dataMocks.org.id,
        dataMocks.project,
        dataMocks.workspace,
        'certdir',
        dataMocks.serviceProperties
      )
      expect(ret).toEqual(dataMocks.subscribeServicesResponse)
      expect(mockConsoleSDKInstance.getCredentials).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
      expect(mockConsoleSDKInstance.createEnterpriseCredential).not.toHaveBeenCalled()
      expect(mockConsoleSDKInstance.subscribeCredentialToServices).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        dataMocks.integration.type,
        dataMocks.integration.id,
        dataMocks.subscribeServicesPayload
      )
    })
    test('services to be added and integration to be created', async () => {
      mockConsoleSDKInstance.getCredentials.mockResolvedValue({ body: [] })
      const ret = await consoleCli.subscribeToServices(
        dataMocks.org.id,
        dataMocks.project,
        dataMocks.workspace,
        'certdir',
        dataMocks.serviceProperties
      )
      expect(ret).toEqual(dataMocks.subscribeServicesResponse)
      expect(mockConsoleSDKInstance.getCredentials).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
      expect(mockConsoleSDKInstance.createEnterpriseCredential).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        'fake read stream',
        `aio-${dataMocks.workspace.id}`,
        'Auto generated enterprise credentials from aio CLI'
      )
      expect(mockConsoleSDKInstance.subscribeCredentialToServices).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        dataMocks.integration.type,
        dataMocks.integration.id,
        dataMocks.subscribeServicesPayload
      )
    })
  })
  describe('getServicesProperties', () => {
    test('no integration in workspace', async () => {
      mockConsoleSDKInstance.getCredentials.mockResolvedValue({ body: [] })
      const ret = await consoleCli.getServicePropertiesFromWorkspace(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        dataMocks.services
      )
      expect(ret).toEqual([])
      expect(mockConsoleSDKInstance.getIntegration).not.toHaveBeenCalled()
    })
    test('no services attached to integration in workspace', async () => {
      mockConsoleSDKInstance.getIntegration.mockResolvedValue({ body: { serviceProperties: [] } })
      const ret = await consoleCli.getServicePropertiesFromWorkspace(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        dataMocks.services
      )
      expect(ret).toEqual([])
      expect(mockConsoleSDKInstance.getIntegration).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.integration.id
      )
    })

    test('no support services', async () => {
      // default getIntegration mock returns dataMocks.integration
      const ret = await consoleCli.getServicePropertiesFromWorkspace(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
      expect(ret).toEqual(dataMocks.serviceProperties)
      expect(mockConsoleSDKInstance.getIntegration).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.integration.id
      )
    })
    
    test('some services attached to integration in workspace', async () => {
      // default getIntegration mock returns dataMocks.integration
      const ret = await consoleCli.getServicePropertiesFromWorkspace(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        dataMocks.services
      )
      expect(ret).toEqual(dataMocks.serviceProperties)
      expect(mockConsoleSDKInstance.getIntegration).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.integration.id
      )
    })
    test('some services attached to integration in workspace - test console workarounds', async () => {
      const allLicenseConfigs = dataMocks.serviceProperties
        .filter(sp => !!sp.licenseConfigs)
        .map(sp => sp.licenseConfigs)
        // flatten the array
        .reduce((flat, arr) => flat.concat(arr), [])
      const brokenServiceProperties = dataMocks.serviceProperties
        .map(sp => ({ ...sp, licenseConfigs: allLicenseConfigs }))
      mockConsoleSDKInstance.getIntegration.mockResolvedValue({ body: { serviceProperties: brokenServiceProperties } })
      const ret = await consoleCli.getServicePropertiesFromWorkspace(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        dataMocks.services
      )
      // 1. make sure serviceProperties are fixed
      expect(ret).toEqual(dataMocks.serviceProperties)
      expect(mockConsoleSDKInstance.getIntegration).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.integration.id
      )
      // 2. make sure getSDKProperties is called to fix caching bug
      expect(mockConsoleSDKInstance.getSDKProperties).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.integration.id,
        expect.any(String)
      )
    })
  })

  test('createEnterpriseCredentials', async () => {
    const ret = await consoleCli.createEnterpriseCredentials(
      dataMocks.org.id,
      dataMocks.project,
      dataMocks.workspace,
      'certdir'
    )
    expect(ret).toEqual(dataMocks.integrationCreateResponse)
    expect(mockConsoleSDKInstance.createEnterpriseCredential).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      dataMocks.workspace.id,
      'fake read stream',
      `aio-${dataMocks.workspace.id}`,
      'Auto generated enterprise credentials from aio CLI'
    )
    // make sure keys are written at the right place
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2)
    const dir = `certdir${path.sep}${dataMocks.org.id}-${dataMocks.project.name}`
    expect(fs.ensureDirSync).toHaveBeenCalledWith(dir)
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${dir}${path.sep}${dataMocks.workspace.name}.pem`,
      'fake public key'
    )
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      `${dir}${path.sep}${dataMocks.workspace.name}.key`,
      'fake private key'
    )
  })

  describe('getFirstEntpCredentials', () => {
    test('when there is one', async () => {
      // relies on default mock for getCredentials
      const ret = await consoleCli.getFirstEntpCredentials(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace
      )
      expect(ret).toEqual(dataMocks.integrations[2])
      expect(mockConsoleSDKInstance.getCredentials).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
    })
    test('when there are none', async () => {
      mockConsoleSDKInstance.getCredentials.mockResolvedValue({ body: [] })
      const ret = await consoleCli.getFirstEntpCredentials(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace
      )
      expect(ret).toEqual(undefined)
      expect(mockConsoleSDKInstance.getCredentials).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
    })
  })

  describe('getWorkspaceConfig', () => {
    test('with supported services', async () => {
      // relies on default mock for getCredentials
      const ret = await consoleCli.getWorkspaceConfig(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id,
        dataMocks.services
      )
      expect(ret).toEqual(dataMocks.enhancedWorkspaceJson)
      expect(mockConsoleSDKInstance.downloadWorkspaceJson).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
    })
    test('without supported services', async () => {
      // relies on default mock for getCredentials
      const ret = await consoleCli.getWorkspaceConfig(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
      expect(ret).toEqual(dataMocks.workspaceJson)
      expect(mockConsoleSDKInstance.downloadWorkspaceJson).toHaveBeenCalledWith(
        dataMocks.org.id,
        dataMocks.project.id,
        dataMocks.workspace.id
      )
    })
  })

  describe('promptForSelectOrganization', () => {
    test('prompts with list of orgs', async () => {
      mockPrompt.promptSelect.mockResolvedValue(dataMocks.org)
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations)
      expect(res).toEqual(dataMocks.org)
      expect(mockPrompt.promptSelect).toHaveBeenCalledWith('Org', dataMocks.promptChoices.orgs)
    })
    test('with preselected org id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: dataMocks.org.id })
      expect(res).toEqual(dataMocks.org)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
    })
    test('with preselected org code that matches an entity', async () => {
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgCode: dataMocks.org.code })
      expect(res).toEqual(dataMocks.org)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
    })
    test('with preselected id and org code that match same entity', async () => {
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: dataMocks.org.id, orgCode: dataMocks.org.code })
      expect(res).toEqual(dataMocks.org)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
    })
    test('with preselected id that could be org code that matches an entity', async () => {
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: dataMocks.org.id, orgCode: dataMocks.org.id })
      expect(res).toEqual(dataMocks.org)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
    })
    test('with preselected org code that could be id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: dataMocks.org.code, orgCode: dataMocks.org.code })
      expect(res).toEqual(dataMocks.org)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
    })
    test('with preselected org code that does not match an entity', async () => {
      await expect(consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: 'idontexist' }))
        .rejects.toThrow('Organization \'idontexist\' not found.')
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
    })
    test('with preselected org id and org code that match two different orgs', async () => {
      await expect(consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: dataMocks.organizations[0].id, orgCode: dataMocks.organizations[1].code }))
        .rejects.toThrow("Organization code '22222222226666666666DDDD@AdobeOrg' and id '12345' do not refer to the same Organization.")
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
    })
  })

  describe('promptForSelectProject', () => {
    test('prompts with list of projects', async () => {
      mockPrompt.promptSelect.mockResolvedValue(dataMocks.project)
      const res = await consoleCli.promptForSelectProject(dataMocks.projects)
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).toHaveBeenCalledWith('Project', dataMocks.promptChoices.projects)
    })
    test('prompts with list of projects allowCreate', async () => {
      mockPrompt.promptSelectOrCreate.mockResolvedValue(dataMocks.project)
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, {}, { allowCreate: true })
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).toHaveBeenCalledWith('Project', dataMocks.promptChoices.projects)
    })
    test('prompts with list of projects allowCreate and escape selection', async () => {
      mockPrompt.promptSelectOrCreate.mockResolvedValue(null)
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, {}, { allowCreate: true })
      expect(res).toEqual(null)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).toHaveBeenCalledWith('Project', dataMocks.promptChoices.projects)
    })
    test('with preselected id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, { projectId: dataMocks.project.id })
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected name that matches an entity', async () => {
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, { projectName: dataMocks.project.name })
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id and name that match the same entity', async () => {
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, { projectId: dataMocks.project.id, projectName: dataMocks.project.name })
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id that could be name that matches an entity', async () => {
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, { projectId: dataMocks.project.id, projectName: dataMocks.project.id })
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected name that could be id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, { projectId: dataMocks.project.id, projectName: dataMocks.project.id })
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id that does not match an entity', async () => {
      await expect(consoleCli.promptForSelectProject(dataMocks.projects, { projectId: 'idontexist' }))
        .rejects.toThrow('Project \'idontexist\' not found')
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id and preselected name that exists but point to two different projects', async () => {
      await expect(consoleCli.promptForSelectProject(dataMocks.projects, { projectId: dataMocks.projects[0].id, projectName: dataMocks.projects[1].name }))
        .rejects.toThrow("Project name 'mySecondProject' and id '1234567890123456789' do not refer to the same Project.")
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
  })

  describe('promptForSelectWorkspace', () => {
    test('prompts with list of workspaces', async () => {
      mockPrompt.promptSelect.mockResolvedValue(dataMocks.workspace)
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces)
      expect(res).toEqual(dataMocks.workspace)
      expect(mockPrompt.promptSelect).toHaveBeenCalledWith('Workspace', dataMocks.promptChoices.workspaces)
    })
    test('prompts with list of workspaces allowCreate', async () => {
      mockPrompt.promptSelectOrCreate.mockResolvedValue(dataMocks.workspace)
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, {}, { allowCreate: true })
      expect(res).toEqual(dataMocks.workspace)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).toHaveBeenCalledWith('Workspace', dataMocks.promptChoices.workspaces)
    })
    test('prompts with list of workspaces allowCreate and escape selection', async () => {
      mockPrompt.promptSelectOrCreate.mockResolvedValue(null)
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, {}, { allowCreate: true })
      expect(res).toEqual(null)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).toHaveBeenCalledWith('Workspace', dataMocks.promptChoices.workspaces)
    })
    test('with preselected id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceId: dataMocks.workspace.id })
      expect(res).toEqual(dataMocks.workspace)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected name that matches an entity', async () => {
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceName: dataMocks.workspace.name })
      expect(res).toEqual(dataMocks.workspace)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id and name that match the same entity', async () => {
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceId: dataMocks.workspace.id, workspaceName: dataMocks.workspace.name })
      expect(res).toEqual(dataMocks.workspace)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id that could be name that matches an entity', async () => {
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceId: dataMocks.workspace.id, workspaceName: dataMocks.workspace.id })
      expect(res).toEqual(dataMocks.workspace)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected name that could be id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, { projectId: dataMocks.project.name, projectName: dataMocks.project.name })
      expect(res).toEqual(dataMocks.project)
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id that does not match an entity', async () => {
      await expect(consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceId: 'idontexist' }))
        .rejects.toThrow('Workspace \'idontexist\' not found')
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id and preselected name that exists but point to two different workspaces', async () => {
      await expect(consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceId: dataMocks.workspaces[0].id, workspaceName: dataMocks.workspaces[1].name }))
        .rejects.toThrow("Workspace name 'Stage' and id '1111111111111111111' do not refer to the same Workspace.")
      expect(mockPrompt.promptSelect).not.toHaveBeenCalled()
      expect(mockPrompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
  })

  test('promptForCreateProjectDetails', async () => {
    mockPrompt.promptInput.mockResolvedValueOnce('name')
    mockPrompt.promptInput.mockResolvedValueOnce('title')
    mockPrompt.promptInput.mockResolvedValueOnce('description')
    const res = await consoleCli.promptForCreateProjectDetails()
    expect(res).toEqual({
      name: 'name', title: 'title', description: 'description'
    })
    expect(mockPrompt.promptInput).toHaveBeenCalledTimes(3)
    expect(mockPrompt.promptInput.mock.calls[0])
      .toEqual(['Name', { validate: validators.validateProjectName }])
    expect(mockPrompt.promptInput.mock.calls[1])
      .toEqual(['Title', { validate: validators.validateProjectTitle }])
    expect(mockPrompt.promptInput.mock.calls[2])
      .toEqual(['Description', { validate: validators.validateProjectDescription, default: '' }])
  })

  test('promptForCreateWorkspaceDetails', async () => {
    mockPrompt.promptInput.mockResolvedValueOnce('name')
    mockPrompt.promptInput.mockResolvedValueOnce('title')
    const res = await consoleCli.promptForCreateWorkspaceDetails()
    expect(res).toEqual({
      name: 'name', title: 'title'
    })
    expect(mockPrompt.promptInput).toHaveBeenCalledTimes(2)
    expect(mockPrompt.promptInput.mock.calls[0])
      .toEqual(['Name', { validate: validators.validateWorkspaceName }])
    expect(mockPrompt.promptInput.mock.calls[1])
      .toEqual(['Title', { validate: validators.validateWorkspaceTitle, default: '' }])
  })

  describe('promptForSelectServiceProperties', () => {
    test('select services', async () => {
      // selected services
      const selectedServices = dataMocks.services.filter(s => dataMocks.integration.sdkList.includes(s.code))
      mockPrompt.promptMultiSelect.mockResolvedValueOnce(selectedServices)
      // for each service select some licenseConfigs
      dataMocks.integration.serviceProperties.forEach(s => {
        mockPrompt.promptMultiSelect.mockResolvedValueOnce(s.licenseConfigs)
      })

      const res = await consoleCli.promptForSelectServiceProperties(dataMocks.workspace.name, dataMocks.services)
      expect(res).toEqual(dataMocks.integration.serviceProperties)
      expect(mockPrompt.promptMultiSelect).toHaveBeenCalledWith(
        `Add Services to Workspace ${dataMocks.workspace.name}`,
        dataMocks.promptChoices.services,
        { validate: validators.atLeastOne }
      )
      dataMocks.integration.serviceProperties.forEach((s, i) => {
        if (s.licenseConfigs) {
          expect(mockPrompt.promptMultiSelect).toHaveBeenCalledWith(
            `Select Product Profiles for the service '${s.name}'`,
            dataMocks.promptChoices.licenseConfigs[i],
            { validate: validators.atLeastOne }
          )
        }
      })
    })
    test('no selection + workspace name is an array', async () => {
      // selected services
      mockPrompt.promptMultiSelect.mockResolvedValueOnce([])

      const res = await consoleCli.promptForSelectServiceProperties(['wname1', 'wname2'], dataMocks.services)
      expect(res).toEqual([])
      expect(mockPrompt.promptMultiSelect).toHaveBeenCalledWith(
        'Add Services to Workspaces wname1 and wname2',
        dataMocks.promptChoices.services,
        { validate: validators.atLeastOne }
      )
      expect(mockPrompt.promptMultiSelect).toHaveBeenCalledTimes(1) // no licenseConfigs selections
    })
  })

  describe('confirmNewServiceSubscriptions', () => {
    test('yes', async () => {
      mockPrompt.promptConfirm.mockResolvedValue(true)
      const res = await consoleCli.confirmNewServiceSubscriptions('workspacename', dataMocks.serviceProperties)
      expect(res).toBe(true)
      expect(mockPrompt.promptConfirm).toHaveBeenCalledTimes(1)
      // make sure user sees a list of services and workspacename before confirming
      expect(mockPrompt.promptConfirm.mock.calls[0][0]).toEqual(expect.stringContaining('Workspace workspacename'))
      expect(mockPrompt.promptConfirm.mock.calls[0][0]).toEqual(expect.stringContaining(JSON.stringify(dataMocks.serviceProperties.map(s => s.name), null, 4)))
    })
    test('no', async () => {
      mockPrompt.promptConfirm.mockResolvedValue(false)
      const res = await consoleCli.confirmNewServiceSubscriptions('workspacename', dataMocks.serviceProperties)
      expect(res).toBe(false)
      expect(mockPrompt.promptConfirm).toHaveBeenCalledTimes(1)
    })
    test('with array input', async () => {
      mockPrompt.promptConfirm.mockResolvedValue(true)
      const res = await consoleCli.confirmNewServiceSubscriptions(['w1', 'w2'], dataMocks.serviceProperties)
      expect(res).toBe(true)
      expect(mockPrompt.promptConfirm.mock.calls[0][0]).toEqual(expect.stringContaining('Workspaces w1 and w2'))
    })
  })

  describe('promptForServiceSubscriptionsOperation', () => {
    test('cloneChoice=false and nopChoice=false', async () => {
      const res = await consoleCli.promptForServiceSubscriptionsOperation('workspacename', { cloneChoice: false, nopChoice: false })
      expect(res).toEqual('select')
      expect(mockPrompt.promptChoice).not.toHaveBeenCalled()
    })
    test('cloneChoice=false (by default) and nopChoice=false', async () => {
      const res = await consoleCli.promptForServiceSubscriptionsOperation('workspacename', { nopChoice: false })
      expect(res).toEqual('select')
      expect(mockPrompt.promptChoice).not.toHaveBeenCalled()
    })
    test('nopChoice=true', async () => {
      mockPrompt.promptChoice.mockReturnValue('avalidchoice')
      const res = await consoleCli.promptForServiceSubscriptionsOperation('workspacename', { nopChoice: true })
      expect(res).toEqual('avalidchoice')
      expect(mockPrompt.promptChoice).toHaveBeenCalledWith(
        expect.stringContaining('workspacename'),
        [
          expect.objectContaining({ value: 'select' }),
          expect.objectContaining({ value: 'nop' })
        ],
        {}
      )
    })
    test('nopChoice=true (by default)', async () => {
      mockPrompt.promptChoice.mockReturnValue('avalidchoice')
      const res = await consoleCli.promptForServiceSubscriptionsOperation('workspacename')
      expect(res).toEqual('avalidchoice')
      expect(mockPrompt.promptChoice).toHaveBeenCalledWith(
        expect.stringContaining('workspacename'),
        [
          expect.objectContaining({ value: 'select' }),
          expect.objectContaining({ value: 'nop' })
        ],
        {}
      )
    })
    test('nopChoice=true cloneChoice=true', async () => {
      mockPrompt.promptChoice.mockReturnValue('avalidchoice')
      const res = await consoleCli.promptForServiceSubscriptionsOperation('workspacename', { nopChoice: true, cloneChoice: true })
      expect(res).toEqual('avalidchoice')
      expect(mockPrompt.promptChoice).toHaveBeenCalledWith(
        expect.stringContaining('workspacename'),
        [
          expect.objectContaining({ value: 'select' }),
          expect.objectContaining({ value: 'clone' }),
          expect.objectContaining({ value: 'nop' })
        ],
        {}
      )
    })
    test('nopChoice=false cloneChoice=true', async () => {
      mockPrompt.promptChoice.mockReturnValue('avalidchoice')
      const res = await consoleCli.promptForServiceSubscriptionsOperation('workspacename', { nopChoice: false, cloneChoice: true })
      expect(res).toEqual('avalidchoice')
      expect(mockPrompt.promptChoice).toHaveBeenCalledWith(
        expect.stringContaining('workspacename'),
        [
          expect.objectContaining({ value: 'select' }),
          expect.objectContaining({ value: 'clone' })
        ],
        {}
      )
    })
    test('workspacename is array', async () => {
      mockPrompt.promptChoice.mockReturnValue('avalidchoice')
      const res = await consoleCli.promptForServiceSubscriptionsOperation(['wname1', 'wname2'])
      expect(res).toEqual('avalidchoice')
      expect(mockPrompt.promptChoice).toHaveBeenCalledWith(
        expect.stringContaining('Workspaces wname1 and wname2'),
        [
          expect.objectContaining({ value: 'select' }),
          expect.objectContaining({ value: 'nop' })
        ],
        {}
      )
    })
  })
  describe('promptForRemoveServiceSubscriptions', () => {
    test('select some services to delete', async () => {
      const initialList = dataMocks.serviceProperties
      // selected services
      const selectedServices = [initialList[1]]
      mockPrompt.promptMultiSelect.mockResolvedValueOnce(selectedServices)
      // expected result
      const expectedResult = [initialList[0], ...initialList.slice(2)]

      const res = await consoleCli.promptForRemoveServiceSubscriptions(dataMocks.workspace.name, initialList)
      expect(res).toEqual(expectedResult)
      expect(mockPrompt.promptMultiSelect).toHaveBeenCalledWith(
        `Delete Services from Workspace ${dataMocks.workspace.name}`,
        // to choice
        initialList.map(s => ({ name: s.name, value: s }))
      )
    })
    test('no selection + workspace name is an array', async () => {
      const initialList = dataMocks.serviceProperties
      // selected services
      const selectedServices = []
      mockPrompt.promptMultiSelect.mockResolvedValueOnce(selectedServices)

      const res = await consoleCli.promptForRemoveServiceSubscriptions([dataMocks.workspace.name, 'workspace2'], initialList)
      expect(res).toEqual(null)
      expect(mockPrompt.promptMultiSelect).toHaveBeenCalledWith(
        `Delete Services from Workspaces ${dataMocks.workspace.name} and workspace2`,
        // to choice
        initialList.map(s => ({ name: s.name, value: s }))
      )
    })
  })

  test('getExtensionPoints', async () => {
    const extPoints = await consoleCli.getExtensionPoints({id: 'testOrg'}, {id: 'testPrj'}, {id: 'testWS'})
    const expectedResult = { endpoints: dataMocks.baseWorkspaceEndPoints}
    expect(extPoints).toEqual(expectedResult)
    expect(mockConsoleSDKInstance.getEndPointsInWorkspace).toHaveBeenCalled()
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('getExtensionPoints empty endpoints', async () => {
    mockConsoleSDKInstance.getEndPointsInWorkspace.mockResolvedValue({ body: null })
    const extPoints = await consoleCli.getExtensionPoints({id: 'testOrg'}, {id: 'testPrj'}, {id: 'testWS'})
    const expectedResult = { endpoints: {}}
    expect(extPoints).toEqual(expectedResult)
    expect(mockConsoleSDKInstance.getEndPointsInWorkspace).toHaveBeenCalled()
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('updateExtensionPoints', async () => {
    const newEndPoints = {
      endpoints: {
        'dx/asset-compute/worker/1' : {
          worker: "test"
        }
      }
    }
    mockConsoleSDKInstance.updateEndPointsInWorkspace.mockResolvedValue({ body: newEndPoints})
    const extPoints = await consoleCli.updateExtensionPoints({id: 'testOrg'}, {id: 'testPrj'}, {id: 'testWS'}, newEndPoints)
    const expectedResult = { endpoints: newEndPoints}
    expect(extPoints).toEqual(expectedResult)
    expect(mockConsoleSDKInstance.updateEndPointsInWorkspace).toHaveBeenCalledWith('testOrg', 'testPrj', 'testWS', newEndPoints)
    expect(mockConsoleSDKInstance.getEndPointsInWorkspace).toHaveBeenCalledTimes(0)
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('getAllExtensionPoints', async () => {
    const extPoints = await consoleCli.getAllExtensionPoints({id: 'testOrg'}, {id: 'testPrj'}, {id: 'testWS'}, dataMocks.baseWorkspaceEndPoints)
    const expectedResult = { endpoints: dataMocks.allExtensionPoints}
    expect(extPoints).toEqual(expectedResult)
    expect(mockConsoleSDKInstance.getAllExtensionPoints).toHaveBeenCalled()
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('updateExtensionPointsWithoutOverwrites', async () => {
    const newEndPoints = {
      endpoints: {
        'dx/asset-compute/worker/1' : {
          worker: "test"
        }
      }
    }
    const extPoints = await consoleCli.updateExtensionPointsWithoutOverwrites({id: 'testOrg'}, {id: 'testPrj'}, {id: 'testWS'}, newEndPoints)
    const expectedResult = { endpoints: dataMocks.multipleWorkspaceEndPoints}
    expect(extPoints).toEqual(expectedResult)
    expect(mockConsoleSDKInstance.getEndPointsInWorkspace).toHaveBeenCalled()
    expect(mockConsoleSDKInstance.updateEndPointsInWorkspace).toHaveBeenCalled()
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })

  test('removeSelectedExtensionPoints', async () => {
    const endPointsToBeRemoved = {
      endpoints: {
        'dx/asset-compute/worker/1' : {
          worker: "test"
        }
      }
    }
    mockConsoleSDKInstance.getEndPointsInWorkspace.mockResolvedValue({ body: dataMocks.multipleWorkspaceEndPoints})
    mockConsoleSDKInstance.updateEndPointsInWorkspace.mockResolvedValue({ body: dataMocks.baseWorkspaceEndPoints})
    const extPoints = await consoleCli.removeSelectedExtensionPoints({id: 'testOrg'}, {id: 'testPrj'}, {id: 'testWS'}, endPointsToBeRemoved)
    const expectedResult = { endpoints: dataMocks.baseWorkspaceEndPoints}
    expect(extPoints).toEqual(expectedResult)
    expect(mockConsoleSDKInstance.getEndPointsInWorkspace).toHaveBeenCalled()
    expect(mockConsoleSDKInstance.updateEndPointsInWorkspace).toHaveBeenCalled()
    expect(mockOraObject.start).toHaveBeenCalled()
    expect(mockOraObject.stop).toHaveBeenCalled()
  })
})
