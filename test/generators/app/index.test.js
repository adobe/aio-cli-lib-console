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

const helpers = require('yeoman-test')
const assert = require('yeoman-assert')

const theGeneratorPath = require.resolve('../../../generators/app')
const Generator = require('yeoman-generator')

jest.mock('../../../lib/validate')
jest.mock('../../../lib/prompt')
jest.mock('@adobe/aio-lib-console')
jest.mock('ora')

const consoleSdk = require('@adobe/aio-lib-console')
const prompt = require('../../../lib/prompt')

const ora = require('ora')
ora.mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn()
}))

/** @private */
function promptMock ({ select = [], selectOrCreate = [], input = [] } = {}) {
  prompt.mockImplementation(() => {
    const mockObject = {
      promptSelect: jest.fn(),
      promptSelectOrCreate: jest.fn(),
      promptInput: jest.fn()
    }

    const mockReturnValue = (mockedFunction, returnValue) => {
      if (returnValue && !Array.isArray(returnValue)) { returnValue = [returnValue] }
      returnValue.forEach((value) => mockedFunction.mockReturnValueOnce(value))
    }

    mockReturnValue(mockObject.promptSelect, select)
    mockReturnValue(mockObject.promptSelectOrCreate, selectOrCreate)
    mockReturnValue(mockObject.promptInput, input)

    return mockObject
  })
}

const fakeDownloadWorkspaceJson = (orgId) => ({
  project: {
    org: {
      id: orgId
    }
  }
})

/** @private */
function consoleSdkMock ({
  orgs = [],
  projects = [],
  workspaces = [],
  orgServices = [],
  createdWorkspace = {},
  createdProject = {},
  getWorkspace = {},
  getProject = {},
  downloadWorkspaceJson = fakeDownloadWorkspaceJson('fakeId')
} = {}) {
  const mockObject = {
    init: jest.fn(),
    getServicesForOrg: jest.fn(() => ({ body: orgServices })),
    getOrganizations: () => ({ body: orgs }),
    getProjectsForOrg: () => ({ body: projects }),
    getWorkspacesForProject: () => ({ body: workspaces }),
    createWorkspace: jest.fn(() => ({ body: createdWorkspace })),
    createProject: jest.fn(() => ({ body: createdProject })),
    getWorkspace: () => ({ body: getWorkspace }),
    getProject: () => ({ body: getProject }),
    createRuntimeNamespace: jest.fn(),
    downloadWorkspaceJson: jest.fn(() => ({ body: downloadWorkspaceJson }))
  }

  consoleSdk.init = jest.fn(() => mockObject)
  return mockObject
}

describe('prototype', () => {
  test('exports a yeoman generator', () => {
    expect(require(theGeneratorPath).prototype).toBeInstanceOf(Generator)
  })
})

describe('run', () => {
  test('select existing org, project, workspace (read-only)', async () => {
    const options = {
      'access-token': 'abc123'
    }

    const orgs = [
      {
        id: '123',
        code: 'foobar@MyOrg',
        name: 'Foo Bar Org',
        type: 'entp'
      }
    ]

    const projects = [
      {
        id: '456',
        name: 'My Project',
        title: 'this is my project'
      }
    ]

    const workspaces = [
      {
        id: '789',
        name: 'My Workspace',
        title: 'this is my workspace'
      }
    ]

    const downloadWorkspaceJson = {
      ...fakeDownloadWorkspaceJson(orgs[0].id),
      name: projects[0].name
    }

    const mockObject = consoleSdkMock({
      orgs,
      projects,
      workspaces,
      downloadWorkspaceJson
    })

    promptMock({
      select: ['Foo Bar Org', 'this is my project', 'My Workspace'],
      input: 'My New Workspace'
    })

    await helpers.run(theGeneratorPath).withOptions(options)
    assert.JSONFileContent('console.json', downloadWorkspaceJson)
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalled()
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalledWith(orgs[0].id, projects[0].id, workspaces[0].id)
  })

  test('select existing org, create project, create workspace (not read-only)', async () => {
    const options = {
      'access-token': 'abc123',
      'allow-create': true
    }

    const orgs = [
      {
        id: '123',
        code: 'foobar@MyOrg',
        name: 'Foo Bar Org',
        type: 'entp'
      }
    ]

    const projects = [
      {
        id: '456',
        name: 'My Project',
        title: 'this is my project'
      }
    ]

    const workspaces = [
      {
        id: '789',
        name: 'My Workspace',
        title: 'this is my workspace'
      },
      {
        id: '012',
        name: 'My Workspace2',
        title: 'this is my workspace'
      }
    ]

    const newProject = {
      id: 'ABC',
      name: 'My New Project',
      title: 'this is my new project',
      description: 'a new project'
    }

    const newWorkspace = {
      id: 'XYZ',
      name: 'My New Workspace',
      title: 'this is my new workspace'
    }

    const downloadWorkspaceJson = {
      ...fakeDownloadWorkspaceJson(orgs[0].id),
      name: projects[0].name
    }

    const mockObject = consoleSdkMock({
      orgs,
      projects,
      workspaces,
      downloadWorkspaceJson,
      getProject: newProject,
      getWorkspace: newWorkspace,
      createdWorkspace: { workspaceId: newWorkspace.id },
      createdProject: { projectId: newProject.id }
    })

    promptMock({
      select: 'Foo Bar Org',
      selectOrCreate: ['My New Project', 'My New Workspace'],
      input: [newProject.name, newProject.title, newProject.description, newWorkspace.name, newWorkspace.title, newWorkspace.description]
    })

    await helpers.run(theGeneratorPath).withOptions(options)
    assert.JSONFileContent('console.json', downloadWorkspaceJson)
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalledWith(orgs[0].id, newProject.id, newWorkspace.id)
    expect(mockObject.getServicesForOrg).toHaveBeenCalledWith(orgs[0].id)

    // project creation
    expect(mockObject.createProject).toHaveBeenCalledWith('123', { ...newProject, type: 'jaeger', id: undefined })
    /// creates stage workspace
    expect(mockObject.createWorkspace).toHaveBeenCalledWith(orgs[0].id, newProject.id, { name: 'Stage' })
    /// enables runtime on all workspaces in new project
    expect(mockObject.createRuntimeNamespace).toHaveBeenCalledWith(orgs[0].id, newProject.id, workspaces[0].id)
    expect(mockObject.createRuntimeNamespace).toHaveBeenCalledWith(orgs[0].id, newProject.id, workspaces[1].id)

    // workspace creation
    expect(mockObject.createWorkspace).toHaveBeenCalledWith(orgs[0].id, newProject.id, { ...newWorkspace, id: undefined })
    expect(mockObject.createRuntimeNamespace).toHaveBeenCalledWith(orgs[0].id, newProject.id, newWorkspace.id)
  })

  test('set workspace-id (will be nulled, since org-id and project-id not set)', async () => {
    const options = {
      'access-token': 'abc123',
      'workspace-id': 'W567'
    }

    const orgs = [
      {
        id: '123',
        code: 'foobar@MyOrg',
        name: 'Foo Bar Org',
        type: 'entp'
      }
    ]

    const projects = [
      {
        id: '456',
        name: 'My Project',
        title: 'this is my project'
      }
    ]

    const workspaces = [
      {
        id: '789',
        name: 'My Workspace',
        title: 'this is my workspace'
      }
    ]

    const downloadWorkspaceJson = {
      ...fakeDownloadWorkspaceJson(orgs[0].id),
      name: projects[0].name
    }

    const mockObject = consoleSdkMock({
      orgs,
      projects,
      workspaces,
      downloadWorkspaceJson
    })

    promptMock({
      select: ['Foo Bar Org', 'this is my project', 'My Workspace'],
      input: 'My New Workspace'
    })

    await helpers.run(theGeneratorPath).withOptions(options)
    assert.JSONFileContent('console.json', downloadWorkspaceJson)
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalled()
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalledWith(orgs[0].id, projects[0].id, workspaces[0].id)
    expect(mockObject.getServicesForOrg).toHaveBeenCalledWith(orgs[0].id)
  })

  test('test org-id, project-id, workspace-id set in options', async () => {
    const orgId = 'O123'
    const projectId = 'P456'
    const workspaceId = 'W789'

    const options = {
      'access-token': 'abc123',
      'allow-create': true,
      'org-id': orgId,
      'project-id': projectId,
      'workspace-id': workspaceId
    }

    const downloadWorkspaceJson = {
      ...fakeDownloadWorkspaceJson(orgId),
      name: 'MyProject'
    }

    const mockObject = consoleSdkMock({
      downloadWorkspaceJson
    })

    await helpers.run(theGeneratorPath).withOptions(options)
    assert.JSONFileContent('console.json', downloadWorkspaceJson)
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalledWith(orgId, projectId, workspaceId)
  })

  test('exception in any call (getOrg, getProject, getWorkspace)', async () => {
    const options = {
      'access-token': 'abc123'
    }

    consoleSdkMock()
    promptMock()

    await expect(helpers.run(theGeneratorPath).withOptions(options)).rejects.toEqual(expect.any(Error))
  })
})

test('test that supported services are added to the downloaded file', async () => {
  // use options
  const orgId = 'O123'
  const projectId = 'P456'
  const workspaceId = 'W789'

  const options = {
    'access-token': 'abc123',
    'allow-create': true,
    'org-id': orgId,
    'project-id': projectId,
    'workspace-id': workspaceId
  }

  const orgServices = [
    {
      name: 'the first service',
      code: 'service1SDK',
      enabled: true
    },
    {
      name: 'the second service',
      code: 'service2SDK',
      enabled: false
    },
    {
      name: 'the third service',
      code: 'service2SDK',
      enabled: false
    },
    {
      name: 'the fourth service',
      code: 'service4SDK',
      enabled: true
    }
  ]

  const downloadWorkspaceJson = {
    ...fakeDownloadWorkspaceJson(orgId),
    name: 'MyProject'
  }

  promptMock()

  const mockObject = consoleSdkMock({
    orgServices,
    downloadWorkspaceJson
  })

  await helpers.run(theGeneratorPath).withOptions(options)

  assert.JSONFileContent('console.json', {
    ...downloadWorkspaceJson,
    project: {
      ...downloadWorkspaceJson.project,
      org: {
        ...downloadWorkspaceJson.org,
        details: {
          services: [{
            name: 'the first service',
            code: 'service1SDK'
          },
          {
            name: 'the fourth service',
            code: 'service4SDK'
          }]
        }
      }
    }
  })
  expect(mockObject.getServicesForOrg).toHaveBeenCalledWith(orgId)
})
