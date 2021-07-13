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

/* Functions exposed here are high level and glue together:
Console API calls, Std I/O (including prompts), File I/O and pure helpers */

const fs = require('fs-extra')
const consoleSdk = require('@adobe/aio-lib-console')
const certPlugin = require('@adobe/aio-cli-plugin-certificate')
const spinner = require('ora')()
const loggerNamespace = '@adobe/generator-aio-console'
const logger = require('@adobe/aio-lib-core-logging')(
  loggerNamespace,
  { provider: 'debug', level: process.env.LOG_LEVEL || 'debug' }
)
const promptBuilder = require('./prompt')
const validators = require('./validate')
const helpers = require('./pure-helpers')

// consts
const PROJECT_TYPE = 'jaeger'
const CERT_VALID_DAYS = 365

/**
 * @typedef {object} ConsoleCredentials
 * @property {string} accessToken access token entitled to access the Console Transporter API
 * @property {string} apiKey registered client apiKey, specific to the selected environment
 * @property {string} env prod | stage
 */

class LibConsoleCLI {
  /**
   * @private
   * @param {CoreConsoleAPI} consoleClient
   * @memberof LibConsoleCLI
   */
  constructor (consoleClient, consoleCredentials, options) {
    this.sdkClient = consoleClient
    this.consoleCredentials = consoleCredentials
    this.prompt = promptBuilder()
  }

  /**
   * @static
   * @param {ConsoleCredentials} consoleCredentials credentials needed to access the
   *        Developer Console API
   * @param {object} [options] options
   * @returns {Promise<LibConsoleCLI>} new LibConsoleCLI instance
   * @memberof LibConsoleCLI
   */
  static async init (consoleCredentials, options) {
    const consoleClient = await consoleSdk.init(
      consoleCredentials.accessToken,
      consoleCredentials.apiKey,
      consoleCredentials.env
    )
    return new LibConsoleCLI(consoleClient, consoleCredentials, options)
  }

  async getOrganizations () {
    spinner.start('Getting Organizations...')
    const organizations = (await this.sdkClient.getOrganizations()).body
    spinner.stop()
    logger.debug(`Get Organizations response: ${JSON.stringify(organizations, null, 2)}`)
    return organizations
  }

  async promptForSelectOrganization (organizations, data = { orgId: undefined, orgCode: undefined }) {
    let selectedOrg
    // pre-selection
    if (data.orgId || data.orgCode) {
      selectedOrg = helpers.findOrgOrThrow(data.orgId, data.orgCode, organizations)
    } else {
      // prompt for selection
      const orgChoices = helpers.orgsToPromptChoices(organizations)
      selectedOrg = await this.prompt.promptSelect('Org', orgChoices)
    }

    logger.debug(`Selected Org: ${JSON.stringify(selectedOrg, null, 2)}`)
    return selectedOrg
  }

  async getProjects (orgId) {
    spinner.start('Getting Projects...')
    const projects = (await this.sdkClient.getProjectsForOrg(orgId)).body
    spinner.stop()
    logger.debug(`Get Projects response for Org ${orgId}: ${JSON.stringify(projects, null, 2)}`)
    return projects
  }

  async promptForSelectProject (projects, data = { projectId: undefined, projectName: undefined }, options = { allowCreate: false }) {
    let selectedProject
    if (data.projectId || data.projectName) {
      selectedProject = helpers.findProjectOrThrow(data.projectId, data.projectName, projects)
    } else {
      const projectChoices = helpers.projectsToPromptChoices(projects)
      // Note: promptSelectOrCreate gives the user the possibility to escape the
      // selection, in which case selectedProject will be undefined
      const promptFunc = options.allowCreate ? this.prompt.promptSelectOrCreate : this.prompt.promptSelect
      selectedProject = await promptFunc('Project', projectChoices)
    }
    logger.debug(`Selected Project: ${JSON.stringify(selectedProject, null, 2)}`)
    return selectedProject
  }

  async getWorkspaces (orgId, projectId) {
    spinner.start('Getting Workspaces...')
    const workspaces = (await this.sdkClient.getWorkspacesForProject(orgId, projectId)).body
    spinner.stop()
    logger.debug(`Get Workspaces response for Project ${projectId} in Org ${orgId}: ${JSON.stringify(workspaces, null, 2)}`)
    return workspaces
  }

  async promptForSelectWorkspace (workspaces, data = { workspaceId: undefined, workspaceName: undefined }, options = { allowCreate: false }) {
    let selectedWorkspace
    if (data.workspaceId || data.workspaceName) {
      selectedWorkspace = helpers.findWorkspaceOrThrow(data.workspaceId, data.workspaceName, workspaces)
    } else {
      const workspaceChoices = helpers.workspacesToPromptChoices(workspaces)
      // Note: promptSelectOrCreate gives the user the possibility to escape the
      // selection, in which case the selected workspace will be undefined
      const promptFunc = options.allowCreate ? this.prompt.promptSelectOrCreate : this.prompt.promptSelect
      selectedWorkspace = await promptFunc('Workspace', workspaceChoices)
    }
    logger.debug(`Selected Workspace: ${JSON.stringify(selectedWorkspace, null, 2)}`)
    return selectedWorkspace
  }

  async promptForCreateProjectDetails () {
    // needs support for predefined data input
    // prompt for project details
    console.error('Enter Project details:')
    const name = await this.prompt.promptInput('Name', {
      validate: validators.validateProjectName
    })
    const title = await this.prompt.promptInput('Title', {
      validate: validators.validateProjectTitle
    })
    const description = await this.prompt.promptInput('Description', {
      validate: validators.validateProjectDescription,
      default: ''
    })

    const projectDetails = { name, title, description }
    logger.debug(`Entered Project Details: ${JSON.stringify(projectDetails, null, 2)}`)
    return projectDetails
  }

  async createProject (orgId, createProjectDetails) {
    const { name, title, description } = createProjectDetails

    // create the project, get the projectId
    spinner.start('Creating Project...')
    const createdProject = (await this.sdkClient.createProject(
      orgId,
      { name, title, description, type: PROJECT_TYPE }
    )).body
    const projectId = createdProject.projectId

    // create the missing stage workspace
    spinner.text = 'Creating Stage Workspace...'
    await this.sdkClient.createWorkspace(orgId, projectId, { name: 'Stage' })

    // enable runtime on the Production and Stage workspace
    spinner.text = 'Enabling Adobe I/O Runtime...'
    const workspaces = (await (this.sdkClient.getWorkspacesForProject(orgId, projectId))).body
    await Promise.all(workspaces.map(w => this.sdkClient.createRuntimeNamespace(orgId, projectId, w.id)))

    // get complete record
    spinner.text = 'Getting new Project...'
    const project = (await this.sdkClient.getProject(orgId, projectId)).body

    spinner.stop()
    logger.debug(`Created project: ${JSON.stringify(project, null, 2)}`)
    return project
  }

  async promptForCreateWorkspaceDetails () {
    // needs support for predefined data input
    console.error('Enter Workspace details:')
    const name = await this.prompt.promptInput('Name', {
      validate: validators.validateWorkspaceName
    })
    const title = await this.prompt.promptInput('Title', {
      default: '',
      validate: validators.validateWorkspaceTitle
    })
    const workspaceDetails = { name, title }
    logger.debug(`Entered Workspace Details: ${JSON.stringify(workspaceDetails, null, 2)}`)
    return workspaceDetails
  }

  async createWorkspace (orgId, projectId, createWorkspaceDetails) {
    const { name, title } = createWorkspaceDetails

    spinner.start()
    // create workspace, retrieve workspaceId
    spinner.text = 'Creating Workspace...'
    const createdWorkspace = (await this.sdkClient.createWorkspace(
      orgId,
      projectId,
      { name, title }
    )).body
    const workspaceId = createdWorkspace.workspaceId

    // enable runtime on the newly created workspace
    spinner.text = 'Enabling Adobe I/O Runtime...'
    await this.sdkClient.createRuntimeNamespace(orgId, projectId, workspaceId)

    // get complete record
    spinner.text = 'Getting new Workspace...'
    const workspace = (await this.sdkClient.getWorkspace(orgId, projectId, workspaceId)).body

    spinner.stop()
    logger.debug(`Created Workspace: ${JSON.stringify(workspace, null, 2)}`)
    return workspace
  }

  async getEnabledServicesForOrg (orgId) {
    spinner.start('Retrieving services supported by the Organization...')
    const res = await this.sdkClient.getServicesForOrg(orgId)
    spinner.stop()
    const enabledServices = helpers.filterEnabledServices(res.body)
    logger.debug(`Enabled Services in Org ${orgId}: ${JSON.stringify(enabledServices, null, 2)}`)
    return enabledServices
  }

  async promptForSelectServiceProperties (workspaceNameOrNames, supportedServices) {
    const what = helpers.workspaceNamesToPromptString(workspaceNameOrNames)
    const serviceChoices = helpers.servicesToPromptChoices(supportedServices)
    const selectedServices = await this.prompt.promptMultiSelect(
      `Add Services to ${what}`,
      serviceChoices,
      { validate: validators.atLeastOne }
    )

    // for each selected service, prompt to select from the licenseConfigs list
    // and convert supportedService selection to serviceProperties array
    const serviceProperties = []
    for (let i = 0; i < selectedServices.length; ++i) {
      const s = selectedServices[i]
      let licenseConfigs = null
      if (s.properties && s.properties.licenseConfigs) {
        const licenseConfigsChoices = helpers.licenseConfigsToPromptChoices(s.properties.licenseConfigs)
        const selection = await this.prompt.promptMultiSelect(
                `Select Product Profiles for the service '${s.name}'`,
                licenseConfigsChoices,
                { validate: validators.atLeastOne }
        )
        licenseConfigs = selection
      }
      const roles = (s.properties && s.properties.roles) || null

      // push a new serviceProperty object
      serviceProperties.push({
        name: s.name,
        sdkCode: s.code,
        roles,
        licenseConfigs
      })
    }
    logger.debug(`Selected Service Properties: ${JSON.stringify(serviceProperties, null, 2)}`)
    return serviceProperties
  }

  async subscribeToServices (orgId, project, workspace, certDir, serviceProperties) {
    // prepare the service info payload, with License Configs "Add" payload for each services
    const serviceInfo = helpers.servicePropertiesToServiceSubscriptionPayload(serviceProperties)

    // get or create credentials
    const credential = await this.getFirstEntpCredentials(orgId, project.id, workspace)
    let credentialId = credential && credential.id_integration
    if (!credentialId) {
      credentialId = (await this.createEnterpriseCredentials(orgId, project, workspace, certDir)).id
    }

    spinner.start(`Attaching Services to the Enterprise Credentials of Workspace ${workspace.name}...`)

    logger.debug(`Subscription Payload: ${JSON.stringify(serviceInfo, null, 2)}`)

    const subscriptionResponse = (await this.sdkClient.subscribeCredentialToServices(
      orgId,
      project.id,
      workspace.id,
      'entp',
      credentialId,
      serviceInfo
    )).body

    spinner.stop()
    logger.debug(`Subscription Response: ${JSON.stringify(subscriptionResponse, null, 2)}`)
    // { sdkList: [<string>] }
    return subscriptionResponse
  }

  // pass in supportedServices to fix licenseConfigs
  async getServicePropertiesFromWorkspace (orgId, projectId, workspace, supportedServices = null) {
    const credential = await this.getFirstEntpCredentials(orgId, projectId, workspace)
    if (!credential) {
      return []
    }
    spinner.start(`Getting Services attached to the Workspace ${workspace.name}`)

    const fromCredentialId = credential.id_integration

    // NOTE this is a workaround for a bug in the Console API:
    //   By calling getSDKProperties via the graphQL API we make sure a backend cache for
    //   LicenseConfigs is invalidated, otherwise getIntegrationDetails might return empty LicenseConfigs arrays.
    const anyValidSDKCodeIsFine = 'AdobeAnalyticsSDK'
    await this.sdkClient.getSDKProperties(
      orgId, fromCredentialId, anyValidSDKCodeIsFine
    )
    // end workaround

    // get services attached to the source workspace credential
    const integrationResponse = await this.sdkClient.getIntegration(orgId, fromCredentialId)
    let serviceProperties = integrationResponse.body.serviceProperties
    if (serviceProperties.length <= 0) {
      spinner.stop()
      return []
    }

    if (supportedServices) {
      // NOTE 2: this is a workaround for another bug in the returned LicenseConfigs list,
      //  After the caching issue, where the returned list may be empty, now every
      //  list contains all the LicenseConfigs for all services, so this list must be
      //  filtered to map to service specific licenseConfigs
      serviceProperties = helpers.fixServiceProperties(serviceProperties, supportedServices)
    }

    spinner.stop()
    logger.debug(`Service Properties for Workspace ${workspace.id}: ${JSON.stringify(serviceProperties, null, 2)}`)
    return serviceProperties
  }

  async confirmNewServiceSubscriptions (workspaceNameOrNames, serviceProperties) {
    const what = helpers.workspaceNamesToPromptString(workspaceNameOrNames)
    const serviceNames = helpers.servicePropertiesToNames(serviceProperties)
    const confirmSubscription = await this.prompt.promptConfirm(
      `${what} will have the following Services attached:\n${JSON.stringify(serviceNames, null, 4)}
  > Confirm and Save ?`
    )
    logger.debug(`New Service Subscription list: ${confirmSubscription}`)
    return confirmSubscription
  }

  async createEnterpriseCredentials (orgId, project, workspace, certDir) {
    const {
      projectCertDir,
      publicKeyFileName,
      publicKeyFilePath,
      privateKeyFileName,
      privateKeyFilePath
    } = helpers.getCertFilesLocation(orgId, project.name, workspace.name, certDir)

    // Note: an alternative could be to use
    // generateKeyPairAndCreateEntpIntegrationForWorkspace from the graphQL Console API

    spinner.start(`Generating Credential key pair for Workspace ${workspace.name}...`)
    const { cert, privateKey } = certPlugin.generate(orgId + project.name + workspace.name, CERT_VALID_DAYS)
    fs.ensureDirSync(projectCertDir)
    fs.writeFileSync(publicKeyFilePath, cert)
    fs.writeFileSync(privateKeyFilePath, privateKey)
    spinner.stop()
    console.error(`Key pair '${publicKeyFileName}, ${privateKeyFileName}' valid for '${CERT_VALID_DAYS}' days, has been created into the folder: ${projectCertDir}`)

    spinner.start(`Creating Enterprise Credentials for Workspace ${workspace.name}...`)
    const createCredentialResponse = await this.sdkClient.createEnterpriseCredential(
      orgId,
      project.id,
      workspace.id,
      fs.createReadStream(publicKeyFilePath),
      // As of now we only support 1 integration, so uniqueness based on id is fine
      // must be between 6 and 25 chars long, workspace id length is 19
      `aio-${workspace.id}`,
      'Auto generated enterprise credentials from aio CLI'
    )

    spinner.stop()

    logger.debug(`Create Credential Response: ${JSON.stringify(createCredentialResponse.body, null, 2)}`)
    return createCredentialResponse.body
  }

  async getFirstEntpCredentials (orgId, projectId, workspace) {
    spinner.start(`Getting Enterprise Credentials attached to Workspace ${workspace.name}...`)
    const credentials = (await this.sdkClient.getCredentials(orgId, projectId, workspace.id)).body
    spinner.stop()
    logger.debug(`Get Credentials Response: ${JSON.stringify(credentials, null, 2)}`)
    return helpers.findFirstEntpCredential(credentials)
  }

  async getWorkspaceConfig (orgId, projectId, workspaceId, supportedServices = null) {
    spinner.start('Downloading Workspace config...')
    let json = (await this.sdkClient.downloadWorkspaceJson(orgId, projectId, workspaceId)).body
    spinner.stop()
    if (supportedServices !== null) {
      json = helpers.enhanceWorkspaceConfiguration(json, supportedServices)
    }
    logger.debug(`(Enhanced) Downloaded Workspace config: ${JSON.stringify(json, null, 2)}`)

    return json
  }

  async promptForServiceSubscriptionsOperation (workspaceNameOrNames, options = { cloneChoice: false, nopChoice: true }) {
    const what = helpers.workspaceNamesToPromptString(workspaceNameOrNames)
    if (!options.cloneChoice && !options.nopChoice) {
      return 'select'
    }
    const choices = helpers.getServiceSubscriptionsOperationPromptChoices(options)
    const choice = await this.prompt.promptChoice(
      `Add new Services to the ${what}?`,
      choices,
      { }
    )
    logger.debug(`Selected add service operation: ${choice}`)
    // "add" | "clone" | "nop"
    return choice
  }

  /**
   *
   * Prompts for services to be removed. Takes in service properties that can be obtained
   * via `getServicePropertiesFromWorkspace`. Returns a new array of service properties
   * that contains all services which where not selected for removal. This array can then
   * be passed to `subscribeToServices` to remove the selected services. Returns null if
   * no services where selected.
   *
   * @param {string|Array} workspaceNameOrNames workspace name or list of workspace names
   *        from which the services should be deleted.
   * @param {object} serviceProperties current service Properties attached to the
   *        workspace.
   * @returns {object|null} new service properties that contain the input
   *          serviceProperties minus the selected services
   * @memberof LibConsoleCLI
   */
  async promptForRemoveServiceSubscriptions (workspaceNameOrNames, serviceProperties) {
    const what = helpers.workspaceNamesToPromptString(workspaceNameOrNames)
    const serviceChoices = serviceProperties.map(s => ({ name: s.name, value: s }))
    const selectedService = await this.prompt.promptMultiSelect(
      `Delete Services from ${what}`,
      serviceChoices
    )
    if (selectedService.length <= 0) {
      return null
    }
    logger.debug(`Selected Services to be deleted: ${JSON.stringify(selectedService, null, 2)}`)
    const selectedServicesSet = new Set(selectedService.map(s => s.name))
    const newServiceProperties = serviceProperties.filter(s => !selectedServicesSet.has(s.name))
    return newServiceProperties
  }

  async getExtensionPoints (org, project, workspace) {
    spinner.start(`Getting Extension Points in Workspace=${workspace.name}...`)
    // api returns null if not set
    logger.debug(`Get Extension Points for org: '${org.name}', project: '${project.name}', workspace: '${workspace.name}'`)
    const extensionPoints = (await this.sdkClient.getEndPointsInWorkspace(org.id, project.id, workspace.id)).body || {}
    spinner.stop()
    logger.debug(`Get Extension Points Response: ${JSON.stringify(extensionPoints, null, 2)}`)
    return { endpoints: extensionPoints }
  }

  async updateExtensionPoints (org, project, workspace, extensionPoints) {
    spinner.start(`Updating Extension Points '${Object.keys(extensionPoints)}' in Workspace=${workspace.name}...`)
    logger.debug(`Update Extension Points for org: '${org.name}', project: '${project.name}', workspace: '${workspace.name}'`)
    logger.debug(`Update Extension Points payload: ${JSON.stringify(extensionPoints, null, 2)}`)
    const res = (await this.sdkClient.updateEndPointsInWorkspace(org.id, project.id, workspace.id, extensionPoints)).body
    spinner.stop()
    logger.debug(`Update Extension Points response: ${JSON.stringify(res, null, 2)}`)
    return { endpoints: res }
  }

  /**
   * Get current extension points, merge with provided argument and update with merged
   * extension points object, not atomic
   *
   * @param {object} org organization
   * @param {object} project project
   * @param {object} workspace workspace
   * @param {object} extensionPoints extension point payload for update
   * @returns {object} update response
   */
  async updateExtensionPointsWithoutOverwrites (org, project, workspace, extensionPoints) {
    const prevExtensionPoints = await this.getExtensionPoints(org, project, workspace)
    const newExtensionPoints = helpers.mergeExtensionPoints(prevExtensionPoints, extensionPoints)
    const res = await this.updateExtensionPoints(org, project, workspace, newExtensionPoints)
    return res
  }

  async removeSelectedExtensionPoints (org, project, workspace, extensionPoints) {
    const prevExtensionPoints = await this.getExtensionPoints(org, project, workspace)
    const newExtensionPoints = helpers.removeExtensionPoints(prevExtensionPoints, extensionPoints)
    const res = await this.updateExtensionPoints(org, project, workspace, newExtensionPoints)
    return res
  }

  /**
   * Get all extension-points for the given org
   *
   * @param {string} orgId organizationId
   * @param {string} xpId xpId
   * @returns {Array} extension-point list
   */
  async getAllExtensionPoints (orgId, xpId) {
    spinner.start(`Getting All Extension Points for Org=${orgId}...`)
    const extensionPoints = (await this.sdkClient.getAllExtensionPoints(orgId, xpId)).body || {}
    spinner.stop()
    logger.debug(`Get All Extension Points Response: ${JSON.stringify(extensionPoints, null, 2)}`)
    return extensionPoints
  }
}

// static function making sure there are no spinner running (e.g. in case of error)
LibConsoleCLI.cleanStdOut = () => { spinner.stop() }
module.exports = LibConsoleCLI
