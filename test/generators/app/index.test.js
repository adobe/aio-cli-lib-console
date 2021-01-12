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

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "assert"] }] */

const yeoman = require('yeoman-test')
const assert = require('yeoman-assert')

const dataMocks = require('../../data-mocks')

jest.mock('../../../lib/console-cli.js')
const LibConsoleCLI = require('../../../lib/console-cli.js')
const mockConsoleCLIInstance = {
  getOrganizations: jest.fn(),
  promptForSelectOrganization: jest.fn(),
  getProjects: jest.fn(),
  promptForSelectProject: jest.fn(),
  getWorkspaces: jest.fn(),
  promptForSelectWorkspace: jest.fn(),
  promptForCreateProjectDetails: jest.fn(),
  createProject: jest.fn(),
  promptForCreateWorkspaceDetails: jest.fn(),
  createWorkspace: jest.fn(),
  getEnabledServicesForOrg: jest.fn(),
  promptForSelectServiceProperties: jest.fn(),
  subscribeToServices: jest.fn(),
  getServicePropertiesFromWorkspace: jest.fn(),
  confirmNewServiceSubscriptions: jest.fn(),
  getFirstEntpCredentials: jest.fn(),
  getWorkspaceConfig: jest.fn(),
  promptForServiceSubscriptionsOperation: jest.fn()
}
LibConsoleCLI.init.mockResolvedValue(mockConsoleCLIInstance)
/** @private */
function resetMockConsoleCLI () {
  Object.keys(mockConsoleCLIInstance).forEach(
    k => mockConsoleCLIInstance[k].mockReset()
  )
  LibConsoleCLI.init.mockClear()
}

/** @private */
function setDefaultMockConsoleCLI () {
  mockConsoleCLIInstance.getOrganizations.mockResolvedValue(dataMocks.organizations)
  mockConsoleCLIInstance.promptForSelectOrganization.mockResolvedValue(dataMocks.org)
  mockConsoleCLIInstance.getProjects.mockResolvedValue(dataMocks.projects)
  mockConsoleCLIInstance.promptForSelectProject.mockResolvedValue(dataMocks.project)
  mockConsoleCLIInstance.getWorkspaces.mockResolvedValue(dataMocks.workspaces)
  mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValue(dataMocks.workspace)
  mockConsoleCLIInstance.createProject.mockResolvedValue(dataMocks.project)
  mockConsoleCLIInstance.promptForCreateProjectDetails.mockResolvedValue({ title: 'title', name: 'name', description: 'description' })
  mockConsoleCLIInstance.createWorkspace.mockResolvedValue(dataMocks.workspace)
  mockConsoleCLIInstance.promptForCreateWorkspaceDetails.mockResolvedValue({ title: 'title', name: 'name' })
  mockConsoleCLIInstance.getEnabledServicesForOrg.mockResolvedValue(dataMocks.enabledServices)
  mockConsoleCLIInstance.promptForSelectServiceProperties.mockResolvedValue(dataMocks.serviceProperties)
  mockConsoleCLIInstance.subscribeToServices.mockResolvedValue(dataMocks.subscribeServicesResponse)
  mockConsoleCLIInstance.getServicePropertiesFromWorkspace.mockResolvedValue(dataMocks.serviceProperties)
  mockConsoleCLIInstance.getFirstEntpCredentials.mockResolvedValue(dataMocks.integrations[2])
  mockConsoleCLIInstance.getWorkspaceConfig.mockResolvedValue(dataMocks.enhancedWorkspaceJson)
  // mock nop to not add services by default to avoid infinite loops
  mockConsoleCLIInstance.promptForServiceSubscriptionsOperation.mockResolvedValue('nop')
  // mock add service confirmation to true by default to avoid infinite loops
  mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValue(true)
}

const theGeneratorPath = require.resolve('../../../generators/app')
const Generator = require('yeoman-generator')
let genOptions
beforeEach(() => {
  resetMockConsoleCLI()
  setDefaultMockConsoleCLI()
  // default generator options
  genOptions = {
    'access-token': 'token',
    'allow-create': false,
    'cert-dir': 'certdir'
  }
})

describe('prototype', () => {
  test('exports a yeoman generator', () => {
    expect(require(theGeneratorPath).prototype).toBeInstanceOf(Generator)
  })
})

/** @private */
function expectNoCreateProject () {
  expect(mockConsoleCLIInstance.createProject).not.toHaveBeenCalled()
  expect(mockConsoleCLIInstance.promptForCreateProjectDetails).not.toHaveBeenCalled()
}
/** @private */
function expectNoCreateWorkspace () {
  expect(mockConsoleCLIInstance.createWorkspace).not.toHaveBeenCalled()
  expect(mockConsoleCLIInstance.promptForCreateWorkspaceDetails).not.toHaveBeenCalled()
}
/** @private */
function expectNoAddService () {
  expect(mockConsoleCLIInstance.subscribeToServices).not.toHaveBeenCalled()
  expect(mockConsoleCLIInstance.promptForSelectServiceProperties).not.toHaveBeenCalled()
  expect(mockConsoleCLIInstance.getServicePropertiesFromWorkspace).not.toHaveBeenCalled()
}

describe('run', () => {
  test('test initialization params for console-cli - access-token', async () => {
    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    expect(LibConsoleCLI.init).toHaveBeenCalledWith({
      apiKey: 'aio-cli-console-auth',
      accessToken: 'token',
      env: 'prod'
    }, {})
  })
  test('test initialization params for console-cli - access-token, ims-env', async () => {
    genOptions['ims-env'] = 'stage'
    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    expect(LibConsoleCLI.init).toHaveBeenCalledWith({
      apiKey: 'aio-cli-console-auth-stage',
      accessToken: 'token',
      env: 'stage'
    }, {})
  })
  test('test initialization params for console-cli - access-token, ims-env, apikey', async () => {
    genOptions['ims-env'] = 'stage'
    genOptions['api-key'] = 'apikey'
    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    expect(LibConsoleCLI.init).toHaveBeenCalledWith({
      apiKey: 'apikey',
      accessToken: 'token',
      env: 'stage'
    }, {})
  })

  test('select existing org, project, workspace (read-only)', async () => {
    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, dataMocks.workspace.id, dataMocks.enabledServices
    )
    expectNoCreateProject()
    expectNoCreateWorkspace()
    expectNoAddService()

    expect(mockConsoleCLIInstance.promptForSelectOrganization).toHaveBeenCalledWith(
      dataMocks.organizations,
      { orgId: undefined }
    )
    expect(mockConsoleCLIInstance.promptForSelectProject).toHaveBeenCalledWith(
      dataMocks.projects,
      { projectId: undefined },
      { allowCreate: false }
    )
    expect(mockConsoleCLIInstance.promptForSelectWorkspace).toHaveBeenCalledWith(
      dataMocks.workspaces,
      { workspaceId: undefined },
      { allowCreate: false }
    )
  })

  test('provide orgId, select existing project, workspace (read-only)', async () => {
    genOptions['org-id'] = dataMocks.org.id
    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, dataMocks.workspace.id, dataMocks.enabledServices
    )
    expectNoCreateProject()
    expectNoCreateWorkspace()
    expectNoAddService()

    expect(mockConsoleCLIInstance.promptForSelectOrganization).toHaveBeenCalledWith(
      dataMocks.organizations,
      { orgId: dataMocks.org.id }
    )
    expect(mockConsoleCLIInstance.promptForSelectProject).toHaveBeenCalledWith(
      dataMocks.projects,
      { projectId: undefined },
      { allowCreate: false }
    )
    expect(mockConsoleCLIInstance.promptForSelectWorkspace).toHaveBeenCalledWith(
      dataMocks.workspaces,
      { workspaceId: undefined },
      { allowCreate: false }
    )
  })

  test('provide org-id and project-id select existing workspace (read-only)', async () => {
    genOptions['org-id'] = dataMocks.org.id
    genOptions['project-id'] = dataMocks.project.id
    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, dataMocks.workspace.id, dataMocks.enabledServices
    )
    expectNoCreateProject()
    expectNoCreateWorkspace()
    expectNoAddService()

    expect(mockConsoleCLIInstance.promptForSelectOrganization).toHaveBeenCalledWith(
      dataMocks.organizations,
      { orgId: dataMocks.org.id }
    )
    expect(mockConsoleCLIInstance.promptForSelectProject).toHaveBeenCalledWith(
      dataMocks.projects,
      { projectId: dataMocks.project.id },
      { allowCreate: false }
    )
    expect(mockConsoleCLIInstance.promptForSelectWorkspace).toHaveBeenCalledWith(
      dataMocks.workspaces,
      { workspaceId: undefined },
      { allowCreate: false }
    )
  })

  test('provide org-id, project-id, workspace-id (read-only)', async () => {
    genOptions['org-id'] = dataMocks.org.id
    genOptions['project-id'] = dataMocks.project.id
    genOptions['workspace-id'] = dataMocks.workspace.id
    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, dataMocks.workspace.id, dataMocks.enabledServices
    )
    expectNoCreateProject()
    expectNoCreateWorkspace()
    expectNoAddService()

    expect(mockConsoleCLIInstance.promptForSelectOrganization).toHaveBeenCalledWith(
      dataMocks.organizations,
      { orgId: dataMocks.org.id }
    )
    expect(mockConsoleCLIInstance.promptForSelectProject).toHaveBeenCalledWith(
      dataMocks.projects,
      { projectId: dataMocks.project.id },
      { allowCreate: false }
    )
    expect(mockConsoleCLIInstance.promptForSelectWorkspace).toHaveBeenCalledWith(
      dataMocks.workspaces,
      { workspaceId: dataMocks.workspace.id },
      { allowCreate: false }
    )
  })

  test('select existing org and project but create new workspace - no services added', async () => {
    genOptions['allow-create'] = true
    // workspace will be created
    mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValue(null)
    // don't add services to workspace
    mockConsoleCLIInstance.promptForServiceSubscriptionsOperation.mockResolvedValue('nop')

    await yeoman.run(theGeneratorPath).withOptions(genOptions)
    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, dataMocks.workspace.id, dataMocks.enabledServices
    )

    expectNoCreateProject()
    expectNoAddService()

    // workspace created checks
    expect(mockConsoleCLIInstance.promptForCreateWorkspaceDetails).toHaveBeenCalled()
    expect(mockConsoleCLIInstance.createWorkspace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      { title: 'title', name: 'name' } // res of promptForCreateWorkspaceDetails
    )

    // service operation choices
    expect(mockConsoleCLIInstance.promptForServiceSubscriptionsOperation).toHaveBeenCalledWith(
      [dataMocks.workspace.name],
      { cloneChoice: true, nopChoice: true }
    )
  })

  test('select existing org and project but create new workspace - add services from prompt', async () => {
    genOptions['allow-create'] = true
    // workspace will be created
    mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValue(null)
    // add services from prompt
    mockConsoleCLIInstance.promptForServiceSubscriptionsOperation.mockResolvedValue('select')
    // confirm addition of services on second loop iteration (coverage)
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(false)
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(true)
    // mock service selection
    mockConsoleCLIInstance.promptForSelectServiceProperties.mockResolvedValue(dataMocks.serviceProperties)
    await yeoman.run(theGeneratorPath).withOptions(genOptions)

    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, dataMocks.workspace.id, dataMocks.enabledServices
    )

    expectNoCreateProject()

    // workspace created checks
    expect(mockConsoleCLIInstance.promptForCreateWorkspaceDetails).toHaveBeenCalled()
    expect(mockConsoleCLIInstance.createWorkspace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      { title: 'title', name: 'name' } // res of promptForCreateWorkspaceDetails
    )

    // service operation choices
    expect(mockConsoleCLIInstance.promptForServiceSubscriptionsOperation).toHaveBeenCalledWith(
      [dataMocks.workspace.name],
      { cloneChoice: true, nopChoice: true }
    )

    // services added checks
    expect(mockConsoleCLIInstance.promptForSelectServiceProperties).toHaveBeenCalledWith(
      [dataMocks.workspace.name],
      dataMocks.enabledServices
    )
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project,
      dataMocks.workspace,
      'certdir',
      dataMocks.serviceProperties
    )
  })

  test('select existing org and project but create new workspace - clone services from another workspace', async () => {
    genOptions['allow-create'] = true
    // workspace will be created
    mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValueOnce(null)
    // add services from prompt
    mockConsoleCLIInstance.promptForServiceSubscriptionsOperation.mockResolvedValue('clone')
    // clone from
    mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValueOnce({ id: 'fromid', name: 'fromname' })
    // confirm addition of services on first loop iteration
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(true)
    // mock service source
    mockConsoleCLIInstance.getServicePropertiesFromWorkspace.mockResolvedValue(dataMocks.serviceProperties)
    await yeoman.run(theGeneratorPath).withOptions(genOptions)

    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, dataMocks.workspace.id, dataMocks.enabledServices
    )

    expectNoCreateProject()

    // workspace created checks
    expect(mockConsoleCLIInstance.promptForCreateWorkspaceDetails).toHaveBeenCalled()
    expect(mockConsoleCLIInstance.createWorkspace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      { title: 'title', name: 'name' } // res of promptForCreateWorkspaceDetails
    )
    // service operation choices
    expect(mockConsoleCLIInstance.promptForServiceSubscriptionsOperation).toHaveBeenCalledWith(
      [dataMocks.workspace.name],
      { cloneChoice: true, nopChoice: true }
    )
    // services cloned checks
    expect(mockConsoleCLIInstance.promptForSelectWorkspace).toHaveBeenCalledTimes(2)
    /// second call (make sure there is no preselection nor allowCreate call)
    expect(mockConsoleCLIInstance.promptForSelectWorkspace).toHaveBeenCalledWith(
      dataMocks.workspaces,
      {},
      { allowCreate: false }
    )
    expect(mockConsoleCLIInstance.getServicePropertiesFromWorkspace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      { id: 'fromid', name: 'fromname' },
      dataMocks.enabledServices
    )
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project,
      dataMocks.workspace,
      'certdir',
      dataMocks.serviceProperties
    )
  })

  test('select existing org and workspace but create new project - no services added', async () => {
    genOptions['allow-create'] = true
    const prodWorkspace = dataMocks.workspaces[0]
    const stageWorkspace = dataMocks.workspaces[1]
    // mock workspaces (prod/stage)
    mockConsoleCLIInstance.getWorkspaces.mockResolvedValue([prodWorkspace, stageWorkspace])
    // mock selected workspace (prod)
    mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValue(prodWorkspace)
    // project will be created
    mockConsoleCLIInstance.promptForSelectProject.mockResolvedValue(null)
    mockConsoleCLIInstance.createProject.mockResolvedValue(dataMocks.project)
    // add services from prompt
    mockConsoleCLIInstance.promptForServiceSubscriptionsOperation.mockResolvedValue('nop')
    await yeoman.run(theGeneratorPath).withOptions(genOptions)

    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, prodWorkspace.id, dataMocks.enabledServices
    )

    expectNoCreateWorkspace()
    expectNoAddService()

    // project created checks
    expect(mockConsoleCLIInstance.promptForCreateProjectDetails).toHaveBeenCalled()
    expect(mockConsoleCLIInstance.createProject).toHaveBeenCalledWith(
      dataMocks.org.id,
      { title: 'title', name: 'name', description: 'description' } // res of promptForCreateProjectDetails
    )
  })

  test('select existing org and workspace but create new project - add services from prompt', async () => {
    genOptions['allow-create'] = true
    const prodWorkspace = dataMocks.workspaces[0]
    const stageWorkspace = dataMocks.workspaces[1]
    // mock workspaces (prod/stage)
    mockConsoleCLIInstance.getWorkspaces.mockResolvedValue([prodWorkspace, stageWorkspace])
    // mock selected workspace (prod)
    mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValue(prodWorkspace)
    // project will be created
    mockConsoleCLIInstance.promptForSelectProject.mockResolvedValue(null)
    mockConsoleCLIInstance.createProject.mockResolvedValue(dataMocks.project)
    // add services from prompt
    mockConsoleCLIInstance.promptForServiceSubscriptionsOperation.mockResolvedValue('select')
    // confirm addition of services on third loop iteration
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(false)
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(false)
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(true)
    // mock services to be added selection
    mockConsoleCLIInstance.promptForSelectServiceProperties.mockResolvedValue(dataMocks.serviceProperties)
    await yeoman.run(theGeneratorPath).withOptions(genOptions)

    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, prodWorkspace.id, dataMocks.enabledServices
    )

    expectNoCreateWorkspace()

    // project created checks
    expect(mockConsoleCLIInstance.promptForCreateProjectDetails).toHaveBeenCalled()
    expect(mockConsoleCLIInstance.createProject).toHaveBeenCalledWith(
      dataMocks.org.id,
      { title: 'title', name: 'name', description: 'description' } // res of promptForCreateProjectDetails
    )
    // service operation choices, + adds to all workspaces as project is new (prod and stage)
    expect(mockConsoleCLIInstance.promptForServiceSubscriptionsOperation).toHaveBeenCalledWith(
      [prodWorkspace.name, stageWorkspace.name],
      { cloneChoice: false, nopChoice: true }
    )
    // services added checks
    /// services will be added to all workspaces in new project
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledTimes(2)
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project,
      prodWorkspace,
      'certdir',
      dataMocks.serviceProperties
    )
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project,
      stageWorkspace,
      'certdir',
      dataMocks.serviceProperties
    )
  })

  test('select existing org, create new project and new workspace', async () => {
    genOptions['allow-create'] = true
    const prodWorkspace = dataMocks.workspaces[0]
    const stageWorkspace = dataMocks.workspaces[1]
    const createdWorkspace = dataMocks.workspace
    // mock workspaces (prod/stage/created)
    mockConsoleCLIInstance.getWorkspaces.mockResolvedValue([prodWorkspace, stageWorkspace, createdWorkspace])
    // workspace will be created
    mockConsoleCLIInstance.promptForSelectWorkspace.mockResolvedValue(null)
    mockConsoleCLIInstance.createWorkspace.mockResolvedValue(createdWorkspace)
    // project will be created
    mockConsoleCLIInstance.promptForSelectProject.mockResolvedValue(null)
    mockConsoleCLIInstance.createProject.mockResolvedValue(dataMocks.project)
    // add services from prompt
    mockConsoleCLIInstance.promptForServiceSubscriptionsOperation.mockResolvedValue('select')
    // confirm addition of services on second loop iteration (coverage)
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(false)
    mockConsoleCLIInstance.confirmNewServiceSubscriptions.mockResolvedValueOnce(true)
    // mock services to be added selection
    mockConsoleCLIInstance.promptForSelectServiceProperties.mockResolvedValue(dataMocks.serviceProperties)
    await yeoman.run(theGeneratorPath).withOptions(genOptions)

    // output file checks
    assert.JSONFileContent('console.json', dataMocks.enhancedWorkspaceJson)
    expect(mockConsoleCLIInstance.getWorkspaceConfig).toHaveBeenCalledWith(
      dataMocks.org.id, dataMocks.project.id, createdWorkspace.id, dataMocks.enabledServices
    )

    // project created checks
    expect(mockConsoleCLIInstance.promptForCreateProjectDetails).toHaveBeenCalled()
    expect(mockConsoleCLIInstance.createProject).toHaveBeenCalledWith(
      dataMocks.org.id,
      { title: 'title', name: 'name', description: 'description' } // res of promptForCreateProjectDetails
    )
    // workspace created checks
    expect(mockConsoleCLIInstance.promptForCreateWorkspaceDetails).toHaveBeenCalled()
    expect(mockConsoleCLIInstance.createWorkspace).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project.id,
      { title: 'title', name: 'name' } // res of promptForCreateWorkspaceDetails
    )
    // service operation choices, + adds to all workspaces as project is new (prod and stage and created)
    expect(mockConsoleCLIInstance.promptForServiceSubscriptionsOperation).toHaveBeenCalledWith(
      [prodWorkspace.name, stageWorkspace.name, createdWorkspace.name],
      { cloneChoice: false, nopChoice: true }
    )
    // services added checks
    /// services will be added to all workspaces in new project
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledTimes(3)
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project,
      createdWorkspace,
      'certdir',
      dataMocks.serviceProperties
    )
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project,
      prodWorkspace,
      'certdir',
      dataMocks.serviceProperties
    )
    expect(mockConsoleCLIInstance.subscribeToServices).toHaveBeenCalledWith(
      dataMocks.org.id,
      dataMocks.project,
      stageWorkspace,
      'certdir',
      dataMocks.serviceProperties
    )
  })

  test('error in the prompting phase', async () => {
    mockConsoleCLIInstance.getOrganizations.mockRejectedValue(new Error('orgs error'))
    await expect(yeoman.run(theGeneratorPath).withOptions(genOptions)).rejects.toThrow('orgs error')
  })

  test('error in the writing phase', async () => {
    mockConsoleCLIInstance.getWorkspaceConfig.mockRejectedValue(new Error('wksp error'))
    await expect(yeoman.run(theGeneratorPath).withOptions(genOptions)).rejects.toThrow('wksp error')
  })
})
