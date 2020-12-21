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
  getCredentials: jest.fn()
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
  mockConsoleSDKInstance.createProject.mockResolvedValue({ body: dataMocks.project })
  mockConsoleSDKInstance.createWorkspace.mockResolvedValue({ body: dataMocks.workspace })
  mockConsoleSDKInstance.downloadWorkspaceJson.mockResolvedValue({ body: dataMocks.workspaceJson })
  mockConsoleSDKInstance.createRuntimeNamespace.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.subscribeCredentialToServices.mockResolvedValue({ body: dataMocks.subscribeServicesResponse })
  mockConsoleSDKInstance.getSDKProperties.mockResolvedValue({ body: {} })
  mockConsoleSDKInstance.getIntegration.mockResolvedValue({ body: dataMocks.integration })
  mockConsoleSDKInstance.createEnterpriseCredential.mockResolvedValue({ body: dataMocks.integrationCreateResponse })
  mockConsoleSDKInstance.getCredentials.mockResolvedValue({ body: dataMocks.integrations })
}

// mock prompts
jest.mock('../../lib/prompt.js')
const prompt = require('../../lib/prompt')
/** @private */
function resetMockPrompt () {
  prompt.promptConfirm.mockReset()
  prompt.promptInput.mockReset()
  prompt.promptMultiSelect.mockReset()
  prompt.promptSelect.mockReset()
  prompt.promptSelectOrCreate.mockReset()
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

  describe('addServicesToWorkspace', () => {
    test('no services to be added', async () => {
      const ret = await consoleCli.addServicesToWorkspace(
        dataMocks.org.id,
        dataMocks.project,
        dataMocks.workspace,
        'certdir',
        []
      )
      expect(ret).toEqual({ sdkList: [] })
      expect(mockConsoleSDKInstance.getCredentials).not.toHaveBeenCalled()
      expect(mockConsoleSDKInstance.createEnterpriseCredential).not.toHaveBeenCalled()
      expect(mockConsoleSDKInstance.subscribeCredentialToServices).not.toHaveBeenCalled()
    })
    test('services to be added and no integration to be created', async () => {
      // default mock of getCredentials returns the existing integration
      const ret = await consoleCli.addServicesToWorkspace(
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
      const ret = await consoleCli.addServicesToWorkspace(
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
        .flatMap(sp => sp.licenseConfigs)
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

  test('getWorkspaceConfig', async () => {
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

  describe('promptForSelectOrganization', () => {
    test('prompts with list of orgs', async () => {
      prompt.promptSelect.mockResolvedValue(dataMocks.org)
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations)
      expect(res).toEqual(dataMocks.org)
      expect(prompt.promptSelect).toHaveBeenCalledWith('Org', dataMocks.promptChoices.orgs)
    })
    test('with preselected org Id that matches an org', async () => {
      const res = await consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: dataMocks.org.id })
      expect(res).toEqual(dataMocks.org)
      expect(prompt.promptSelect).not.toHaveBeenCalled()
    })
    test('with preselected org Id that does not matche an org', async () => {
      await expect(consoleCli.promptForSelectOrganization(dataMocks.organizations, { orgId: 'idontexist' }))
        .rejects.toThrow('Org with id idontexist not found')
      expect(prompt.promptSelect).not.toHaveBeenCalled()
    })
  })

  describe('promptForSelectProject', () => {
    test('prompts with list of projects', async () => {
      prompt.promptSelect.mockResolvedValue(dataMocks.project)
      const res = await consoleCli.promptForSelectProject(dataMocks.projects)
      expect(res).toEqual(dataMocks.project)
      expect(prompt.promptSelect).toHaveBeenCalledWith('Project', dataMocks.promptChoices.projects)
    })
    test('prompts with list of projects allowCreate', async () => {
      prompt.promptSelectOrCreate.mockResolvedValue(dataMocks.project)
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, {}, { allowCreate: true })
      expect(res).toEqual(dataMocks.project)
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).toHaveBeenCalledWith('Project', dataMocks.promptChoices.projects)
    })
    test('prompts with list of projects allowCreate and escape selection', async () => {
      prompt.promptSelectOrCreate.mockResolvedValue(null)
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, {}, { allowCreate: true })
      expect(res).toEqual(null)
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).toHaveBeenCalledWith('Project', dataMocks.promptChoices.projects)
    })
    test('with preselected id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectProject(dataMocks.projects, { projectId: dataMocks.project.id })
      expect(res).toEqual(dataMocks.project)
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id that does not match an entity', async () => {
      await expect(consoleCli.promptForSelectProject(dataMocks.projects, { projectId: 'idontexist' }))
        .rejects.toThrow('Project with id idontexist not found')
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
  })

  describe('promptForSelectWorkspace', () => {
    test('prompts with list of workspaces', async () => {
      prompt.promptSelect.mockResolvedValue(dataMocks.workspace)
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces)
      expect(res).toEqual(dataMocks.workspace)
      expect(prompt.promptSelect).toHaveBeenCalledWith('Workspace', dataMocks.promptChoices.workspaces)
    })
    test('prompts with list of workspaces allowCreate', async () => {
      prompt.promptSelectOrCreate.mockResolvedValue(dataMocks.workspace)
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, {}, { allowCreate: true })
      expect(res).toEqual(dataMocks.workspace)
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).toHaveBeenCalledWith('Workspace', dataMocks.promptChoices.workspaces)
    })
    test('prompts with list of workspaces allowCreate and escape selection', async () => {
      prompt.promptSelectOrCreate.mockResolvedValue(null)
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, {}, { allowCreate: true })
      expect(res).toEqual(null)
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).toHaveBeenCalledWith('Workspace', dataMocks.promptChoices.workspaces)
    })
    test('with preselected id that matches an entity', async () => {
      const res = await consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceId: dataMocks.workspace.id })
      expect(res).toEqual(dataMocks.workspace)
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
    test('with preselected id that does not match an entity', async () => {
      await expect(consoleCli.promptForSelectWorkspace(dataMocks.workspaces, { workspaceId: 'idontexist' }))
        .rejects.toThrow('Workspace with id idontexist not found')
      expect(prompt.promptSelect).not.toHaveBeenCalled()
      expect(prompt.promptSelectOrCreate).not.toHaveBeenCalled()
    })
  })

  test('promptForCreateProjectDetails', async () => {
    prompt.promptInput.mockResolvedValueOnce('name')
    prompt.promptInput.mockResolvedValueOnce('title')
    prompt.promptInput.mockResolvedValueOnce('description')
    const res = await consoleCli.promptForCreateProjectDetails()
    expect(res).toEqual({
      name: 'name', title: 'title', description: 'description'
    })
    expect(prompt.promptInput).toHaveBeenCalledTimes(3)
    expect(prompt.promptInput.mock.calls[0])
      .toEqual(['Name', { validate: validators.validateProjectName }])
    expect(prompt.promptInput.mock.calls[1])
      .toEqual(['Title', { validate: validators.validateProjectTitle }])
    expect(prompt.promptInput.mock.calls[2])
      .toEqual(['Description', { validate: validators.validateProjectDescription, default: '' }])
  })

  test('promptForCreateWorkspaceDetails', async () => {
    prompt.promptInput.mockResolvedValueOnce('name')
    prompt.promptInput.mockResolvedValueOnce('title')
    const res = await consoleCli.promptForCreateWorkspaceDetails()
    expect(res).toEqual({
      name: 'name', title: 'title'
    })
    expect(prompt.promptInput).toHaveBeenCalledTimes(2)
    expect(prompt.promptInput.mock.calls[0])
      .toEqual(['Name', { validate: validators.validateWorkspaceName }])
    expect(prompt.promptInput.mock.calls[1])
      .toEqual(['Title', { validate: validators.validateWorkspaceTitle, default: '' }])
  })

  test('promptForServiceProperties', async () => {
    // selected services
    const selectedServices = dataMocks.services.filter(s => dataMocks.integration.sdkList.includes(s.code))
    prompt.promptMultiSelect.mockResolvedValueOnce(selectedServices)
    // for each service select some licenseConfigs
    dataMocks.integration.serviceProperties.forEach(s => {
      prompt.promptMultiSelect.mockResolvedValueOnce(s.licenseConfigs)
    })

    const res = await consoleCli.promptForServiceProperties(dataMocks.workspace.name, dataMocks.services)
    expect(res).toEqual(dataMocks.integration.serviceProperties)
    expect(prompt.promptMultiSelect).toHaveBeenCalledWith(
      `Add Services to Workspace ${dataMocks.workspace.name}`,
      dataMocks.promptChoices.services
    )
    dataMocks.integration.serviceProperties.forEach((s, i) => {
      if (s.licenseConfigs) {
        expect(prompt.promptMultiSelect).toHaveBeenCalledWith(
          `Select Product Profiles for the service '${s.name}'`,
          dataMocks.promptChoices.licenseConfigs[i],
          { validate: validators.atLeastOne }
        )
      }
    })
  })
})
