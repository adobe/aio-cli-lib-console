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
const certPlugin = require('@adobe/aio-cli-plugin-certificate')
const fs = require('fs-extra')
const path = require('path')

const prompt = require('../../lib/prompt')
const {
  validateProjectName,
  validateProjectTitle,
  validateProjectDescription,
  validateWorkspaceName,
  validateWorkspaceTitle
} = require('../../lib/validate')

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
  PROJECT_TYPE: 'jaeger',
  CERT_VALID_DAYS: 365
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
    this.option(Option.PROJECT_TYPE, { type: String, default: Default.PROJECT_TYPE })

    this.option(Option.ORG_ID, { type: String })
    this.option(Option.PROJECT_ID, { type: String })
    this.option(Option.WORKSPACE_ID, { type: String })

    const env = this.options[Option.ENV]
    this.option(Option.API_KEY, { type: String, default: Default.API_KEY[env] })
  }

  async initializing () {
    this.env.adapter.promptModule.registerPrompt('autocomplete',
      require('../../lib/inquirer-autocomplete-with-escape-prompt')
    )

    const env = this.options[Option.ENV]
    const accessToken = this.options[Option.ACCESS_TOKEN]
    const apiKey = this.options[Option.API_KEY]

    this.sdkClient = await consoleSdk.init(accessToken, apiKey, env)
    this.customPrompt = prompt(this)
    this.allowCreate = this.options[Option.ALLOW_CREATE]
    this.projectType = this.options[Option.PROJECT_TYPE]
    this.certDir = this.options[Option.CERT_DIR]

    // hierarchy of ids:
    // project id is invalid if org id is not set, workspace id is not valid if project id is not set, etc
    this.orgId = this.options[Option.ORG_ID]
    this.projectId = this.orgId ? this.options[Option.PROJECT_ID] : null
    this.workspaceId = this.projectId ? this.options[Option.WORKSPACE_ID] : null
  }

  async prompting () {
    this.log('Retrieving information from Adobe I/O Console..')

    try {
      const { selectedOrg } = await this._getOrg()
      const { selectedProject } = await this._getProject(selectedOrg.id)
      const { selectedWorkspace, workspaces } = await this._getWorkspace(selectedOrg.id, selectedProject.id)

      // persist selections
      this.org = selectedOrg
      this.project = selectedProject
      this.workspace = selectedWorkspace

      // get and persist support services in org
      this.supportedServices = await this._getEnabledServicesForOrg(selectedOrg.id)

      // todo allow to create multiple workspaces, add same services to each ? Hmm actually that could be handled by aio app use switch..
      // add services to newly created Workspace
      if (selectedWorkspace.isNew) {
        let hasServices = false
        if (!selectedProject.isNew) {
          // if the project isn't new allow to copy over services from another workspace
          const confirmServiceClone = await this.customPrompt.promptConfirm(
            `Do you wish to clone service subscriptions from another Workspace into ${selectedWorkspace.name}?`
          )
          if (confirmServiceClone) {
            hasServices = await this._cloneServices(selectedOrg.id, selectedProject, selectedWorkspace, workspaces, this.certDir)
          }
        }
        if (!hasServices) {
          // prompt and add services to workspace
          await this._addServices(this.org.id, this.project, this.workspace, this.supportedServices, this.certDir)
        }
      }
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

    // enhance configuration with supported services
    json.project.org.details = {
      ...json.project.org.details,
      services: this.supportedServices.map(s => ({ name: s.name, code: s.code, type: s.type }))
    }
    spinner.stop()

    this.fs.writeJSON(this.destinationPath(this.options[Option.DESTINATION_FILE]), json)
  }

  // helpers

  /**
   * Prompt to select for an Org.
   *
   * @private
   * @returns {object} { selectedOrg, orgs }
   */
  async _getOrg () {
    if (this.orgId) {
      return { id: this.orgId }
    }

    spinner.start()

    spinner.text = 'Getting Organizations...'
    const orgs = (await this.sdkClient.getOrganizations()).body

    spinner.stop()

    const orgChoices = orgs
      .filter(item => item.type === 'entp')
      .map(item => ({ name: item.name, value: item }))
    const selectedOrg = await this.customPrompt.promptSelect('Org', orgChoices)

    return { selectedOrg, orgs }
  }

  /**
   * Prompt to select a Project, or create a new one.
   *
   * @private
   * @param {string} orgId the organization id
   * @returns {object} { selectedProject, projects }
   */
  async _getProject (orgId) {
    if (this.projectId) {
      return { id: this.projectId }
    }

    spinner.start()

    spinner.text = 'Getting Projects...'
    const projects = (await this.sdkClient.getProjectsForOrg(orgId)).body
    spinner.stop()

    // show projects by title and reverse order to show latest first, note reverse is in
    // place, let's make sure project is not modified by copying the array
    const projectsChoices = [...projects.map(item => ({ name: item.title, value: item }))].reverse()
    const promptFunc = this.allowCreate ? this.customPrompt.promptSelectOrCreate : this.customPrompt.promptSelect
    let selectedProject = await promptFunc('Project', projectsChoices)

    if (!selectedProject) { // create new
      console.log('Enter Project details:')
      const name = await this.customPrompt.promptInput('Name', {
        validate: validateProjectName
      })
      const title = await this.customPrompt.promptInput('Title', {
        validate: validateProjectTitle
      })
      const description = await this.customPrompt.promptInput('Description', {
        validate: validateProjectDescription,
        default: ''
      })

      spinner.start()

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
      selectedProject = (await this.sdkClient.getProject(orgId, projectId)).body

      selectedProject.isNew = true

      spinner.stop()
      selectedProject.isNew = true
    }
    return { selectedProject, projects }
  }

  /**
   * Prompt to select a workspace, or create a new one.
   *
   * @private
   * @param {string} orgId the organization id
   * @param {string} projectId the project id
   * @returns {object} { selectedWorkspace, workspaces }
   */
  async _getWorkspace (orgId, projectId) {
    if (this.workspaceId) {
      return { id: this.workspaceId }
    }

    spinner.start()

    spinner.text = 'Getting Workspaces...'
    const workspaces = (await this.sdkClient.getWorkspacesForProject(orgId, projectId)).body
    spinner.stop()

    const workspacesChoices = workspaces.map(item => ({ name: item.name, value: item }))
    const promptFunc = this.allowCreate ? this.customPrompt.promptSelectOrCreate : this.customPrompt.promptSelect
    let selectedWorkspace = await promptFunc('Workspace', workspacesChoices)

    if (!selectedWorkspace) { // create new
      console.log('Enter Workspace details:')
      const name = await this.customPrompt.promptInput('Name', {
        validate: validateWorkspaceName
      })
      const title = await this.customPrompt.promptInput('Title', {
        default: '',
        validate: validateWorkspaceTitle
      })

      spinner.start()

      spinner.text = 'Creating Workspace...'
      const createdWorkspace = (await this.sdkClient.createWorkspace(orgId, projectId, { name, title })).body

      // enable runtime on the newly created workspace
      spinner.text = 'Enabling Adobe I/O Runtime...'
      await this.sdkClient.createRuntimeNamespace(orgId, projectId, createdWorkspace.workspaceId)

      // get complete record
      spinner.text = 'Getting new Workspace...'
      selectedWorkspace = (await this.sdkClient.getWorkspace(orgId, projectId, createdWorkspace.workspaceId)).body

      spinner.stop()

      selectedWorkspace.isNew = true
    }
    return { selectedWorkspace, workspaces }
  }

  /**
   * @private
   * @memberof ConsoleGenerator
   */
  async _getEnabledServicesForOrg (orgId) {
    spinner.start('Retrieving services supported by the Organization...')
    const res = await this.sdkClient.getServicesForOrg(orgId)
    spinner.stop()
    return res.body.filter(s => s.enabled)
  }

  /**
   * @private
   * @memberof ConsoleGenerator
   */
  async _cloneServices (orgId, project, toWorkspace, workspaces, certDir) {
    // prompt to get the source workspace
    const workspaceChoices = workspaces.map(w => ({ name: w.name, value: w }))
    const fromWorkspace = await this.customPrompt.promptSelect(
      'Workspace you want to clone the Service subscriptions from',
      workspaceChoices
    )

    // get first entp credential attached to workspace
    spinner.start(`Getting Services attached to the Workspace ${fromWorkspace.name}`)
    const credentialResponse = await this.sdkClient.getCredentials(orgId, project.id, fromWorkspace.id)
    const entpCredential = credentialResponse.body.find(c => c.flow_type === 'entp' && c.integration_type === 'service')

    // todo remove those
    console.log(JSON.stringify(credentialResponse))
    console.log(entpCredential)

    const noServicesFoundMessage = `Could not find any Services attached to the Workspace ${fromWorkspace.name}`
    if (!entpCredential) {
      spinner.stop()
      console.log(noServicesFoundMessage)
      return false
    }

    // get services from the entp workspace credential
    const integrationResponse = await this.sdkClient.getIntegration(orgId, entpCredential.id_integration)
    const serviceInfo = integrationResponse.body.serviceProperties.map(s => ({
      sdkCode: s.sdkCode,
      roles: s.roles,
      licenseConfigs: s.licenseConfigs
    }))

    const serviceNames = integrationResponse.body.serviceProperties.map(s => s.name)
    if (serviceNames.length <= 0) {
      spinner.stop()
      console.log(noServicesFoundMessage)
      return false
    }

    // confirmation step
    spinner.stop()
    console.log(`Workspace ${fromWorkspace.name} is subscribed to the following services:\n${JSON.stringify(serviceNames, null, 4)}`)
    const confirmSubscription = await this.customPrompt.promptConfirm(
      `  > do you confirm adding these services to the Workspace ${toWorkspace.name} ?`
    )
    if (!confirmSubscription) {
      return false
    }
    // todo loop back to prompt for confirm clone from workspace !!

    // create credentials in the new Workspace subscribe services to the new Workspace
    const credential = await this._createEnterpriseCredentials(orgId, project, toWorkspace, certDir)

    spinner.start(`Subscribing to services from Workspace ${fromWorkspace.name} in Workspace ${toWorkspace.name}`)
    const a = await this.sdkClient.subscribeCredentialToServices(
      orgId,
      project.id,
      toWorkspace.id,
      'entp',
      credential.id,
      serviceInfo
    )

    // todo remove those
    console.log(JSON.stringify(serviceInfo, null, 2))
    console.log(JSON.stringify(a, null, 2))
    spinner.stop()
    return true
  }

  /**
   * @private
   * @memberof ConsoleGenerator
   */
  async _addServices (orgId, project, workspace, supportedServices, certDir) {
    const serviceChoices = supportedServices
      // we only support entp integrations for now
      .filter(s => s.type === 'entp')
      .map(s => ({ name: s.name, value: s }))

    const selectedServices = await this.customPrompt.promptMultiSelect(`Add Services to new Workspace '${workspace.name}'`, serviceChoices)

    // for each selected service, prompt to select from the licenseConfigs list
    const selectedLicenseConfigs = {}
    for (let i = 0; i < selectedServices.length; ++i) {
      const s = selectedServices[i]
      selectedLicenseConfigs[s.code] = null // default value
      if (s.properties && s.properties.licenseConfigs) {
        const licenseConfigsChoices = s.properties.licenseConfigs.map(s => ({
          // display name
          name: s.name,
          // value returned, ready for subscribe API call
          value: { op: 'add', id: s.id, productId: s.productId }
        }))
        const selection = await this.customPrompt.promptMultiSelect(
                `Select Product Profiles for the service '${s.name}'`,
                licenseConfigsChoices
        )
        selectedLicenseConfigs[s.code] = selection
      }
    }
    // todo think about confirmation ?
    // todo2 add services in all workspaces ?
    // todo3 ask for adding services from existing workspace ?

    if (selectedServices.length > 0) {
      const credential = await this._createEnterpriseCredentials(orgId, project, workspace, certDir)

      spinner.start(`Attaching Services to the Enterprise Credentials of Workspace ${workspace.name}...`)
      const serviceInfo = selectedServices.map(s => ({
        sdkCode: s.code,
        licenseConfigs: selectedLicenseConfigs[s.code],
        roles: (s.properties && s.properties.roles) || null
      }))
      await this.sdkClient.subscribeCredentialToServices(
        orgId,
        project.id,
        workspace.id,
        'entp',
        credential.id,
        serviceInfo
      )
      spinner.stop()
    }
  }

  async _createEnterpriseCredentials (orgId, project, workspace, certDir) {
    spinner.start(`Generating Credential key pair for Workspace ${workspace.name}...`)
    const projectCertDir = path.join(certDir, `${this.org.id}-${this.project.name}`)
    const publicKeyFileName = `${workspace.name}.pem`
    const privateKeyFileName = `${workspace.name}.key`
    const publicKeyFilePath = path.join(projectCertDir, publicKeyFileName)
    const privateKeyFilePath = path.join(projectCertDir, privateKeyFileName)
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
    return createCredentialResponse.body
  }
}

module.exports = ConsoleGenerator
