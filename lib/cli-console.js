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

const spinner = require('ora')()
const fs = require('fs-extra')

const loggerNamespace = '@adobe/generator-aio-console'
const logger = require('@adobe/aio-lib-core-logging')(loggerNamespace, { provider: 'debug', level: process.env.LOG_LEVEL || 'debug' })
const consoleSdk = require('@adobe/aio-lib-console')
const certPlugin = require('@adobe/aio-cli-plugin-certificate')

// todo should I move those in here ?
const prompt = require('./prompt')
const validators = require('./validate')
const helpers = require('./pure-helpers')

// import CoreConsoleAPI type
require('@adobe/aio-lib-console/types')

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
  constructor (consoleClient, options) {
    this.sdkClient = consoleClient
    // todo cache fetched resources ?
  }

  /**
   *
   *
   * @static
   * @param {ConsoleCredentials} consoleCredentials credentials needed to access the
   *        Developer Console API
   * @param {object} [options={}] options
   * @returns {Promise<LibConsoleCLI>} new LibConsoleCLI instance
   * @memberof LibConsoleCLI
   */
  static async init (consoleCredentials, options = {}) {
    const consoleClient = await consoleSdk.init(
      consoleCredentials.accessToken,
      consoleCredentials.apiKey,
      consoleCredentials.env
    )
    return new LibConsoleCLI(consoleClient, options)
  }

  async selectOrg (data = {}) {
    spinner.start()
    spinner.text = 'Getting Organizations...'
    const organizations = (await this.sdkClient.getOrganizations()).body
    spinner.stop()

    let selectedOrg
    // pre-selection
    if (data.orgId) {
      selectedOrg = helpers.findOrgOrThrow(data.orgId, organizations)
    } else {
      // prompt for selection
      const orgChoices = helpers.orgsToPromptChoices(organizations)
      selectedOrg = await prompt.promptSelect('Org', orgChoices)
    }

    logger.debug('Selected Org', JSON.stringify(selectedOrg, null, 2))
    return { selectedOrg, organizations }
  }

  async selectProject (orgId, data = {}, options = {}) {
    spinner.start()
    spinner.text = 'Getting Projects...'
    const projects = (await this.sdkClient.getProjectsForOrg(orgId))
    spinner.stop()

    let selectedProject
    if (data.projectId) {
      selectedProject = helpers.findProjectOrThrow(data.projectId, projects)
    } else {
      const projectsChoices = helpers.projectsToPromptChoices(projects)
      // Note: promptSelectOrCreate gives the user the possibility to escape the
      // selection, in which case selectedProject will be null
      const promptFunc = options.allowCreate ? prompt.promptSelectOrCreate : prompt.promptSelect
      selectedProject = await promptFunc('Project', projectsChoices)
    }
    logger.debug('Selected Project', JSON.stringify(selectedProject, null, 2))
    return { selectedProject, projects }
  }

  async selectWorkspace (orgId, projectId, data = {}, options = {}) {
    spinner.start()
    spinner.text = 'Getting Workspaces...'
    const workspaces = (await this.sdkClient.getWorkspacesForProject(orgId, projectId))
    spinner.stop()

    let selectedWorkspace
    if (data.workspaceId) {
      selectedWorkspace = helpers.findWorkspaceOrThrow(data.workspaceId, workspaces)
    } else {
      const workspaceChoices = helpers.projectsToPromptChoices(workspaces)
      // Note: promptSelectOrCreate gives the user the possibility to escape the
      // selection, in which case selectedProject will be null
      const promptFunc = options.allowCreate ? prompt.promptSelectOrCreate : prompt.promptSelect
      selectedWorkspace = await promptFunc('Workspace', workspaceChoices)
    }
    logger.debug('Selected Workspace', JSON.stringify(selectedWorkspace, null, 2))
    return { selectedWorkspace, workspaces }
  }

  /**
   * @param orgId
   * @param data
   */
  async createProject (orgId, data = {}) {
    // todo handle predefined data
    // prompt for project details
    console.log('Enter Project details:')
    const name = await prompt.promptInput('Name', {
      validate: validators.validateProjectName
    })
    const title = await prompt.promptInput('Title', {
      validate: validators.validateProjectTitle
    })
    const description = await prompt.promptInput('Description', {
      validate: validators.validateProjectDescription,
      default: ''
    })

    // create the projectId
    spinner.text = 'Creating Project...'
    const createdProject = (await this.sdkClient.createProject(orgId, { name, title, description, type: this.projectType })).body
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
    logger.debug('Created project', JSON.stringify(project, null, 2))
    return project
  }

  /**
   * @param orgId
   * @param projectId
   * @param data
   */
  async createWorkspace (orgId, projectId, data = {}) {
    // todo handle predefined data
    console.log('Enter Workspace details:')
    const name = await prompt.promptInput('Name', {
      validate: validators.validateWorkspaceName
    })
    const title = await prompt.promptInput('Title', {
      default: '',
      validate: validators.validateWorkspaceTitle
    })

    spinner.start()

    // create resources

    spinner.text = 'Creating Workspace...'
    const createdWorkspace = (await this.sdkClient.createWorkspace(orgId, projectId, { name, title })).body

    // enable runtime on the newly created workspace
    spinner.text = 'Enabling Adobe I/O Runtime...'
    await this.sdkClient.createRuntimeNamespace(orgId, projectId, createdWorkspace.workspaceId)

    // get complete record
    spinner.text = 'Getting new Workspace...'
    const workspace = (await this.sdkClient.getWorkspace(orgId, projectId, createdWorkspace.workspaceId)).body

    spinner.stop()
    logger.debug('Created Workspace', JSON.stringify(workspace, null, 2))
    return workspace
  }

  async getEnabledServicesForOrg (orgId) {
    spinner.start('Retrieving services supported by the Organization...')
    const res = await this.sdkClient.getServicesForOrg(orgId)
    spinner.stop()
    return helpers.filterEnabledServices(res.body)
  }

  async addServicesToWorkspace (orgId, project, workspace, supportedServices, certDir) {
    const serviceChoices = helpers.servicesToPromptChoices(supportedServices)
    const selectedServices = await prompt.promptMultiSelect(
      `Add Services to new Workspace '${workspace.name}'`,
      serviceChoices
    )

    // for each selected service, prompt to select from the licenseConfigs list
    // todo LESS LOGIC!
    const selectedLicenseConfigs = {}
    for (let i = 0; i < selectedServices.length; ++i) {
      const s = selectedServices[i]
      const key = helpers.getUniqueServiceId(s)
      selectedLicenseConfigs[key] = null // default value
      if (s.properties && s.properties.licenseConfigs) {
        const licenseConfigsChoices = helpers.licenseConfigsToPromptChoices(s.properties.licenseConfigs)

        const selection = await prompt.promptMultiSelect(
                `Select Product Profiles for the service '${s.name}'`,
                licenseConfigsChoices,
                { validate: validators.atLeastOne }
        )
        selectedLicenseConfigs[key] = selection
      }
    }
    // todo think about confirmation ?
    // todo2 add services in all workspaces ?
    // todo3 ask for adding services from existing workspace ?

    if (selectedServices.length > 0) {
      const credential = await this.createEnterpriseCredentials(orgId, project, workspace, certDir)

      spinner.start(`Attaching Services to the Enterprise Credentials of Workspace ${workspace.name}...`)
      const serviceInfo = selectedServices.map(s => ({
        sdkCode: s.code,
        licenseConfigs: helpers.licenseConfigsToSubscriptionPartialPayload(
          selectedLicenseConfigs[helpers.getUniqueServiceId(s)]
        ),
        roles: (s.properties && s.properties.roles) || null
      }))
      // todo THROW error if error object ?
      const subscriptionResponse = await this.sdkClient.subscribeCredentialToServices(
        orgId,
        project.id,
        workspace.id,
        'entp',
        credential.id,
        serviceInfo
      )

      spinner.stop()
      logger.debug('Subscription Response', JSON.stringify(subscriptionResponse.body, null, 2))
    }
  }

  async createEnterpriseCredentials (orgId, project, workspace, certDir) {
    const {
      projectCertDir,
      publicKeyFileName,
      publicKeyFilePath,
      privateKeyFileName,
      privateKeyFilePath
    } = helpers.getCertFilesLocation(orgId, project, workspace, certDir)

    spinner.start(`Generating Credential key pair for Workspace ${workspace.name}...`)
    const { cert, privateKey } = certPlugin.generate(orgId + project.name + workspace.name, Default.CERT_VALID_DAYS)
    fs.ensureDirSync(projectCertDir)
    fs.writeFileSync(publicKeyFilePath, cert)
    fs.writeFileSync(privateKeyFilePath, privateKey)
    spinner.stop()
    console.log(`Key pair '${publicKeyFileName}, ${privateKeyFileName}' valid for '${Default.CERT_VALID_DAYS}' days, has been created into the folder: ${projectCertDir}`)

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

    logger.debug('Create Credential Response', JSON.stringify(createCredentialResponse.body, null, 2))
    return createCredentialResponse.body
  }

  async cloneServices (orgId, project, toWorkspace, workspaces, supportedServices, certDir) {
    // prompt to get the source workspace
    // todo use selectWorkspace ?
    const workspaceChoices = helpers.workspacesToPromptChoices(workspaces)
    const fromWorkspace = await prompt.promptSelect(
      'Workspace you want to clone the Service subscriptions from',
      workspaceChoices
    )

    // get first entp credential attached to workspace
    spinner.start(`Getting Services attached to the Workspace ${fromWorkspace.name}`)
    const credentialResponse = await this.sdkClient.getCredentials(orgId, project.id, fromWorkspace.id)
    const entpCredential = helpers.findFirstEntpCredential(credentialResponse)

    const noServicesFoundMessage = `Could not find any Services attached to the Workspace ${fromWorkspace.name}`
    if (!entpCredential) {
      spinner.stop()
      console.log(noServicesFoundMessage)
      return false
    }

    // NOTE this is a workaround for a bug in the Console API:
    //   By calling getSDKProperties via the graphQL API we make sure a backend cache for
    //   LicenseConfigs is invalidated, otherwise getIntegrationDetails might return empty LicenseConfigs arrays.
    const anyValidSDKCodeIsFine = 'AdobeAnalyticsSDK'
    await getSDKPropertiesViaGraphQLApi(
      this.sdkClient.env, this.sdkClient.orgId, this.sdkClient.accessToken,
      orgId, entpCredential.id_integration, anyValidSDKCodeIsFine
    )
    // end workaround

    // get services from the entp workspace credential
    const integrationResponse = await this.sdkClient.getIntegration(orgId, entpCredential.id_integration)
    const serviceProperties = integrationResponse.body.serviceProperties
    const serviceNames = helpers.servicePropertiesToNames(serviceProperties)

    // if no services attached, there is nothing to subscribe to, so return
    if (serviceNames.length <= 0) {
      spinner.stop()
      console.log(noServicesFoundMessage)
      return false
    }

    // confirmation step
    spinner.stop()
    console.log(`Workspace ${fromWorkspace.name} is subscribed to the following services:\n${JSON.stringify(serviceNames, null, 4)}`)
    const confirmSubscription = await prompt.promptConfirm(
      `  > do you confirm adding these services to the Workspace ${toWorkspace.name} ?`
    )
    if (!confirmSubscription) {
      return false
    }
    // todo loop back to prompt for confirm clone from workspace !!

    // create credentials in the new Workspace subscribe services to the new Workspace
    const credential = await this._createEnterpriseCredentials(orgId, project, toWorkspace, certDir)

    spinner.start(`Subscribing to services from Workspace ${fromWorkspace.name} in Workspace ${toWorkspace.name}`)

    // NOTE 2: this is a workaround for another bug in the returned LicenseConfigs list,
    //  After the caching issue, where the returned list may be empty, now every
    //  list contains all the LicenseConfigs for all services, so this list must be
    //  filtered to map to service specific licenseConfigs
    const fixedServiceProperties = helpers.fixServiceProperties(serviceProperties, supportedServices)

    // prepare the service info payload, with License Configs "Add" payload for each services
    const serviceInfo = helpers.servicePropertiesToServiceSubscriptionPayload(fixedServiceProperties)

    // finally subscribe to the services
    const subscriptionResponse = await this.sdkClient.subscribeCredentialToServices(
      orgId,
      project.id,
      toWorkspace.id,
      'entp',
      credential.id,
      serviceInfo
    )
    spinner.stop()

    logger.debug('Subscription Response', JSON.stringify(subscriptionResponse.body, null, 2))
    return true
  }
}

module.exports = LibConsoleCLI
