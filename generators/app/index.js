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

const Generator = require('yeoman-generator')
const consoleSdk = require('@adobe/aio-lib-console')
const spinner = require('ora')()
const prompt = require('../../lib/prompt')
const { validateName, validateTitle } = require('../../lib/validate')

/*
  'initializing',
  'prompting',
  'configuring',
  'default',
  'writing',
  'conflicts',
  'install',
  'end'
*/

const ApiKey = {
  prod: 'aio-cli-console-auth',
  stage: 'aio-cli-console-auth-stage'
}

const Default = {
  DESTINATION_FILE: 'console.json',
  API_KEY: ApiKey,
  ENV: 'prod',
  ALLOW_CREATE: false,
  PROJECT_TYPE: 'jaeger'
}

const Option = {
  DESTINATION_FILE: 'destination-file',
  ACCESS_TOKEN: 'access-token',
  API_KEY: 'api-key',
  ENV: 'ims-env',
  ALLOW_CREATE: 'allow-create',
  PROJECT_TYPE: 'project-type',
  ORG_ID: 'org-id',
  PROJECT_ID: 'project-id',
  WORKSPACE_ID: 'workspace-id'
}

class ConsoleGenerator extends Generator {
  constructor (args, opts) {
    super(args, opts)

    // options are inputs from CLI or yeoman parent generator
    this.option(Option.DESTINATION_FILE, { type: String, default: Default.DESTINATION_FILE })
    this.option(Option.ACCESS_TOKEN, { type: String })
    this.option(Option.ENV, { type: String, default: Default.ENV })
    this.option(Option.ALLOW_CREATE, { type: Boolean, default: Default.ALLOW_CREATE })
    this.option(Option.PROJECT_TYPE, { type: String, default: Default.PROJECT_TYPE })

    this.option(Option.ORG_ID, { type: String })
    this.option(Option.PROJECT_ID, { type: String })
    this.option(Option.WORKSPACE_ID, { type: String })

    const env = this.options[Option.ENV]
    this.option(Option.API_KEY, { type: String, default: Default.API_KEY[env] })
  }

  async initializing () {
    this.env.adapter.promptModule.registerPrompt('autocomplete',
      require('inquirer-autocomplete-prompt')
    )

    const env = this.options[Option.ENV]
    const accessToken = this.options[Option.ACCESS_TOKEN]
    const apiKey = this.options[Option.API_KEY]

    this.sdkClient = await consoleSdk.init(accessToken, apiKey, env)
    this.customPrompt = prompt(this)
    this.allowCreate = this.options[Option.ALLOW_CREATE]
    this.projectType = this.options[Option.PROJECT_TYPE]

    // hierarchy of ids:
    // project id is invalid if org id is not set, workspace id is not valid if project id is not set, etc
    this.orgId = this.options[Option.ORG_ID]
    this.projectId = this.orgId ? this.options[Option.PROJECT_ID] : null
    this.workspaceId = this.projectId ? this.options[Option.WORKSPACE_ID] : null
  }

  /**
   * Prompt to select for an Org.
   *
   * @returns {object} an Org record
   */
  async _getOrg () {
    if (this.orgId) {
      return { id: this.orgId }
    }

    spinner.start()

    spinner.text = 'Getting organizations...'
    const orgs = (await this.sdkClient.getOrganizations()).body

    spinner.stop()

    const orgsList = orgs
      .filter(item => item.type === 'entp')
      .map(item => item.name)
    const orgResult = await this.customPrompt.promptSelect('Org', orgsList)
    return orgs.find(item => item.name === orgResult)
  }

  /**
   * Prompt to select a Project, or create a new one.
   *
   * @param {string} orgId the organization id
   * @returns {object} a Project record
   */
  async _getProject (orgId) {
    if (this.projectId) {
      return { id: this.projectId }
    }

    spinner.start()

    spinner.text = 'Getting projects...'
    const projects = (await this.sdkClient.getProjectsForOrg(orgId)).body
    spinner.stop()

    const projectsList = projects.map(item => item.name)
    const promptFunc = this.allowCreate ? this.customPrompt.promptSelectOrCreate : this.customPrompt.promptSelect
    const projectResult = await promptFunc('Project', projectsList)
    let project = projects.find(item => item.name === projectResult)

    if (!project) { // create new
      console.log('Enter Project details:')
      const name = await this.customPrompt.promptInput('Name', {
        default: projectResult,
        validate: validateName
      })
      const title = await this.customPrompt.promptInput('Title', {
        default: projectResult,
        validate: validateTitle
      })
      const description = await this.customPrompt.promptInput('Description', { default: '' })

      spinner.start()

      spinner.text = 'Creating project...'
      const createdProject = (await this.sdkClient.createProject(orgId, { name, title, description, type: this.projectType })).body

      // get complete record
      spinner.text = 'Getting new project...'
      project = (await this.sdkClient.getProject(orgId, createdProject.projectId)).body

      spinner.stop()
    }

    return project
  }

  /**
   * Prompt to select a workspace, or create a new one.
   *
   * @param {string} orgId the organization id
   * @param {string} projectId the project id
   * @returns {object} a Workspace record
   */
  async _getWorkspace (orgId, projectId) {
    if (this.workspaceId) {
      return { id: this.workspaceId }
    }

    spinner.start()

    spinner.text = 'Getting workspaces...'
    const workspaces = (await this.sdkClient.getWorkspacesForProject(orgId, projectId)).body
    spinner.stop()

    const workspacesList = workspaces.map(item => item.name)
    const promptFunc = this.allowCreate ? this.customPrompt.promptSelectOrCreate : this.customPrompt.promptSelect
    const workspaceResult = await promptFunc('Workspace', workspacesList)
    let workspace = workspaces.find(item => item.name === workspaceResult)

    if (!workspace) { // create new
      console.log('Enter Workspace details:')
      const name = await this.customPrompt.promptInput('Name', {
        default: workspaceResult,
        validate: validateName
      })
      const title = await this.customPrompt.promptInput('Title', {
        default: ''
      })

      spinner.start()

      spinner.text = 'Creating workspace...'
      const createdWorkspace = (await this.sdkClient.createWorkspace(orgId, projectId, { name, title })).body

      // get complete record
      spinner.text = 'Getting new workspace...'
      workspace = (await this.sdkClient.getWorkspace(orgId, projectId, createdWorkspace.workspaceId)).body

      spinner.stop()
    }

    return workspace
  }

  async prompting () {
    this.log('Retrieving information from Adobe I/O Console..')

    try {
      this.org = await this._getOrg()
      this.project = await this._getProject(this.org.id)
      this.workspace = await this._getWorkspace(this.org.id, this.project.id)
    } catch (e) {
      spinner.stop()
      throw e
    }
  }

  async writing () {
    spinner.start()

    spinner.text = 'Downloading project config...'
    const json = (await this.sdkClient.downloadWorkspaceJson(this.org.id, this.project.id, this.workspace.id)).body
    spinner.stop()

    this.fs.writeJSON(this.destinationPath(this.options[Option.DESTINATION_FILE]), json)
  }
}

module.exports = ConsoleGenerator
