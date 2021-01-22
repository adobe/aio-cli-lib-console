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
const loggerNamespace = '@adobe/generator-aio-console'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { provider: 'debug', level: process.env.LOG_LEVEL || 'debug' })

const LibConsoleCLI = require('../../lib/console-cli')

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
  ALLOW_CREATE: false
}

const Option = {
  DESTINATION_FILE: 'destination-file',
  ACCESS_TOKEN: 'access-token',
  API_KEY: 'api-key',
  ENV: 'ims-env',
  ALLOW_CREATE: 'allow-create',
  ORG_ID: 'org-id',
  PROJECT_ID: 'project-id',
  WORKSPACE_ID: 'workspace-id',
  // path to the base directory to store generated certificates for new Workspace integrations
  CERT_DIR: 'cert-dir'
}

class ConsoleGenerator extends Generator {
  constructor (args, opts) {
    super(args, opts)

    // options are inputs from CLI or yeoman parent generator
    this.option(Option.DESTINATION_FILE, { type: String, default: Default.DESTINATION_FILE })
    this.option(Option.ACCESS_TOKEN, { type: String })
    this.option(Option.ENV, { type: String, default: Default.ENV })
    this.option(Option.ALLOW_CREATE, { type: Boolean, default: Default.ALLOW_CREATE })

    this.option(Option.ORG_ID, { type: String })
    this.option(Option.PROJECT_ID, { type: String })
    this.option(Option.WORKSPACE_ID, { type: String })
    this.option(Option.CERT_DIR, { type: String })

    const env = this.options[Option.ENV]
    this.option(Option.API_KEY, { type: String, default: Default.API_KEY[env] })
  }

  async initializing () {
    const env = this.options[Option.ENV]
    const accessToken = this.options[Option.ACCESS_TOKEN]
    const apiKey = this.options[Option.API_KEY]

    this.allowCreate = this.options[Option.ALLOW_CREATE]
    this.certDir = this.options[Option.CERT_DIR]

    // hierarchy of ids:
    // project id is invalid if org id is not set, workspace id is not valid if project id is not set, etc
    this.preSelectedOrgId = this.options[Option.ORG_ID]
    this.preSelectedProjectId = this.preSelectedOrgId ? this.options[Option.PROJECT_ID] : undefined
    this.preSelectedWorkspaceId = this.preSelectedProjectId ? this.options[Option.WORKSPACE_ID] : undefined

    this.consoleCLI = await LibConsoleCLI.init({ env, accessToken, apiKey }, {})
  }

  async prompting () {
    this.log('Retrieving information from Adobe I/O Console..')

    try {
      // 1. select org
      const orgs = await this.consoleCLI.getOrganizations()
      const org = await this.consoleCLI.promptForSelectOrganization(
        orgs,
        { orgId: this.preSelectedOrgId }
      )
      const orgId = org.id

      // 2. select or create project
      const projects = await this.consoleCLI.getProjects(orgId)
      let project = await this.consoleCLI.promptForSelectProject(
        projects,
        { projectId: this.preSelectedProjectId },
        { allowCreate: this.allowCreate }
      )
      if (!project) {
        // user has escaped project selection prompt, let's create a new one
        const projectDetails = await this.consoleCLI.promptForCreateProjectDetails()
        project = await this.consoleCLI.createProject(orgId, projectDetails)
        project.isNew = true
      }
      const projectId = project.id

      // 3. select or create workspace
      const workspaces = await this.consoleCLI.getWorkspaces(orgId, projectId)
      let workspace = await this.consoleCLI.promptForSelectWorkspace(
        workspaces,
        { workspaceId: this.preSelectedWorkspaceId },
        { allowCreate: this.allowCreate }
      )
      if (!workspace) {
        // user has escaped workspace selection prompt, let's create a new one
        const workspaceDetails = await this.consoleCLI.promptForCreateWorkspaceDetails()
        workspace = await this.consoleCLI.createWorkspace(orgId, projectId, workspaceDetails)
        workspace.isNew = true
      }

      // retrieve supported services in org
      const supportedServices = await this.consoleCLI.getEnabledServicesForOrg(orgId)

      // 4. add services if workspace is new
      if (workspace.isNew || project.isNew) {
        // Note: some or all of this loop should be moved to console-cli.js
        while (true) {
          let workspacesToAddServicesTo = [workspace]
          if (project.isNew) {
            // add to all newly created workspaces, i.e Stage and Production + new created Workspace if project.isNew
            workspacesToAddServicesTo = workspace.isNew ? workspaces.concat(workspace) : workspaces
          }
          const workspaceNamesToAddServicesTo = workspacesToAddServicesTo.map(w => w.name)

          // if project is not new, allow to clone services from another workspace
          const operation = await this.consoleCLI.promptForServiceSubscriptionsOperation(
            workspaceNamesToAddServicesTo,
            { cloneChoice: !project.isNew, nopChoice: true }
          )

          if (operation === 'nop') {
            // done
            break
          }

          let serviceProperties

          if (operation === 'select') {
            serviceProperties = await this.consoleCLI.promptForSelectServiceProperties(
              workspaceNamesToAddServicesTo,
              supportedServices
            )
          }

          if (operation === 'clone') {
            const workspaceFrom = await this.consoleCLI.promptForSelectWorkspace(
              workspaces,
              {},
              { allowCreate: false }
            )
            serviceProperties = await this.consoleCLI.getServicePropertiesFromWorkspace(
              orgId,
              projectId,
              workspaceFrom,
              supportedServices
            )
          }

          const confirm = await this.consoleCLI.confirmNewServiceSubscriptions(
            workspaceNamesToAddServicesTo,
            serviceProperties
          )
          if (confirm) {
            await Promise.all(workspacesToAddServicesTo.map(workspace =>
              this.consoleCLI.subscribeToServices(
                orgId,
                project,
                workspace,
                this.certDir,
                serviceProperties
              )
            ))
            // we are done
            break
          }
          // not confirm == restart loop
        }
      }

      // 5. persist data for write step
      this.supportedServices = supportedServices
      this.org = org
      this.project = project
      this.workspace = workspace
    } catch (e) {
      LibConsoleCLI.cleanStdOut()
      logger.error(e)
      throw e
    }
  }

  async writing () {
    try {
      const json = await this.consoleCLI.getWorkspaceConfig(
        this.org.id,
        this.project.id,
        this.workspace.id,
        this.supportedServices
      )
      this.fs.writeJSON(this.destinationPath(this.options[Option.DESTINATION_FILE]), json)
    } catch (e) {
      LibConsoleCLI.cleanStdOut()
      logger.error(e)
      throw e
    }
  }
}

module.exports = ConsoleGenerator
