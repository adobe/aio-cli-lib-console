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

/** @private */
function consoleSdkMock ({
  orgs = [],
  projects = [],
  workspaces = [],
  createdWorkspace = {},
  createdProject = {},
  getWorkspace = {},
  getProject = {},
  downloadWorkspaceJson = {}
} = {}) {
  const mockObject = {
    init: jest.fn(),
    getOrganizations: () => ({ body: orgs }),
    getProjectsForOrg: () => ({ body: projects }),
    getWorkspacesForProject: () => ({ body: workspaces }),
    createWorkspace: () => ({ body: createdWorkspace }),
    createProject: () => ({ body: createdProject }),
    getWorkspace: () => ({ body: getWorkspace }),
    getProject: () => ({ body: getProject }),
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

    const downloadWorkspaceJson = { name: projects[0].name }

    const mockObject = consoleSdkMock({
      orgs,
      projects,
      workspaces,
      downloadWorkspaceJson
    })

    promptMock({
      select: ['Foo Bar Org', 'My Project', 'My Workspace'],
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
      }
    ]

    const newProject = {
      id: 'ABC',
      name: 'My New Project',
      title: 'this is my new project'
    }

    const newWorkspace = {
      id: 'XYZ',
      name: 'My New Workspace',
      title: 'this is my new workspace'
    }

    const downloadWorkspaceJson = { name: projects[0].name }

    const mockObject = consoleSdkMock({
      orgs,
      projects,
      workspaces,
      downloadWorkspaceJson,
      getProject: newProject,
      getWorkspace: newWorkspace
    })

    promptMock({
      select: 'Foo Bar Org',
      selectOrCreate: ['My New Project', 'My New Workspace'],
      input: ['My New Project', 'project name', 'project title', 'project description', 'My New Workspace', 'workspace name', 'workspace title']
    })

    await helpers.run(theGeneratorPath).withOptions(options)
    assert.JSONFileContent('console.json', downloadWorkspaceJson)
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalledWith(orgs[0].id, newProject.id, newWorkspace.id)
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

    const downloadWorkspaceJson = { name: projects[0].name }

    const mockObject = consoleSdkMock({
      orgs,
      projects,
      workspaces,
      downloadWorkspaceJson
    })

    promptMock({
      select: ['Foo Bar Org', 'My Project', 'My Workspace'],
      input: 'My New Workspace'
    })

    await helpers.run(theGeneratorPath).withOptions(options)
    assert.JSONFileContent('console.json', downloadWorkspaceJson)
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalled()
    expect(mockObject.downloadWorkspaceJson).toHaveBeenCalledWith(orgs[0].id, projects[0].id, workspaces[0].id)
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

    const downloadWorkspaceJson = { name: 'MyProject' }

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
