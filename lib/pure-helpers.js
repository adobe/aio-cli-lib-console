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

/*
  All functions defined here must be pure, i.e. no I/O call should be done in this file
*/

const path = require('path')

/**
 * @param orgs
 */
function orgsToPromptChoices (orgs) {
  return orgs
    // we only support entp orgs for now
    .filter(item => item.type === 'entp')
    .map(item => ({ name: item.name, value: item }))
}

/**
 * @param orgId
 * @param organizations
 */
function findOrgOrThrow (orgId, organizations) {
  const selectedOrg = organizations
    .find(org => org.id === orgId)
  if (!selectedOrg) {
    throw new Error(`Org with id ${orgId} not found`)
  }
  return selectedOrg
}

/**
 * @param projectId
 * @param projects
 */
function findProjectOrThrow (projectId, projects) {
  const selectedProject = projects
    .find(p => p.id === projectId)
  if (!selectedProject) {
    throw new Error(`Project with id ${projectId} not found`)
  }
  return selectedProject
}

/**
 * @param workspaceId
 * @param workspaces
 */
function findWorkspaceOrThrow (workspaceId, workspaces) {
  const selectedWorkspace = workspaces
    .find(p => p.id === workspaceId)
  if (!selectedWorkspace) {
    throw new Error(`Workspace with id ${workspaceId} not found`)
  }
  return selectedWorkspace
}

/**
 * @param projects
 */
function projectsToPromptChoices (projects) {
  const projectChoices = projects
    .filter(p => !p.deleted && p.enabled)
    .filter(p => p.type === 'jaeger')
    .map(item => ({ name: item.title, value: item }))
  // show projects by title and reverse order to show latest first, note reverse is in
  // place, let's make sure projects are not modified by copying the array
  return [...projectChoices].reverse()
}

/**
 * @param workspaces
 */
function workspacesToPromptChoices (workspaces) {
  return workspaces
    .filter(p => p.enabled)
    .filter(p => p.runtime_enabled)
    .map(item => ({ name: item.name, value: item }))
}

/**
 * @param services
 */
function servicesToPromptChoices (services) {
  return filterEnabledServices(services)
    // we only support entp integrations for now
    .filter(s => s.type === 'entp')
    .map(s => ({ name: s.name, value: s }))
}

/**
 * @param licenseConfigs
 */
function licenseConfigsToPromptChoices (licenseConfigs) {
  // should handle licenseConfigs = null
  return licenseConfigs
    .map(l => ({ name: l.name, value: l }))
}

/**
 * @param services
 */
function filterEnabledServices (services) {
  return services.filter(s => s.enabled)
}

/**
 * @param credentials
 */
function findFirstEntpCredential (credentials) {
  return credentials.find(c => c.flow_type === 'entp' && c.integration_type === 'service')
}

/**
 * @param serviceProperties
 */
function servicePropertiesToNames (serviceProperties) {
  return serviceProperties.map(s => s.name)
}

// NOTE: this is a workaround for a bug in the returned LicenseConfigs lists (from getIntegration api call), every list
//  contains all the LicenseConfigs for all services, so this list must be filtered to map
//  to service specific licenseConfigs
/**
 * @param serviceProperties
 * @param supportedServices
 */
function fixServiceProperties (serviceProperties, supportedServices) {
  return serviceProperties.map(sp => {
    const orgService = supportedServices.find(os => os.code === sp.sdkCode)
    let fixedLicenseConfigs = null
    if (sp.licenseConfigs && orgService.properties && orgService.properties.licenseConfigs) {
      fixedLicenseConfigs = sp.licenseConfigs
        .filter(l => orgService.properties.licenseConfigs.find(ol => ol.id === l.id))
    }
    return {
      ...sp,
      licenseConfigs: fixedLicenseConfigs
    }
  })
}

/**
 * @param serviceProperties
 */
function servicePropertiesToServiceSubscriptionPayload (serviceProperties) {
  return serviceProperties.map(sp => {
    return {
      sdkCode: sp.sdkCode,
      roles: sp.roles,
      licenseConfigs: (sp.licenseConfigs || null) && sp.licenseConfigs.map(l => ({
        op: 'add',
        id: l.id,
        productId: l.productId
      }))
    }
  })
}

/**
 * @param orgId
 * @param projectName
 * @param workspaceName
 * @param certDir
 */
function getCertFilesLocation (orgId, projectName, workspaceName, certDir) {
  const projectCertDir = path.join(certDir, `${orgId}-${projectName}`)
  const publicKeyFileName = `${workspaceName}.pem`
  const privateKeyFileName = `${workspaceName}.key`
  const publicKeyFilePath = path.join(projectCertDir, publicKeyFileName)
  const privateKeyFilePath = path.join(projectCertDir, privateKeyFileName)
  return {
    projectCertDir,
    publicKeyFileName,
    publicKeyFilePath,
    privateKeyFileName,
    privateKeyFilePath
  }
}

/**
 * @param options
 */
function getAddServicesOperationPromptChoices (options = { cloneChoice: false, nopChoice: true }) {
  const addChoice = { name: 'Add Services after selecting them manually', value: 'add' }
  const cloneChoice = { name: 'Clone Services from another Workspace in the same Project', value: 'clone' }
  const nopChoice = { name: 'Do not add any Service', value: 'nop' }

  const choices = [addChoice]
  if (options.cloneChoice) {
    choices.push(cloneChoice)
  }
  if (options.nopChoice) {
    choices.push(nopChoice)
  }
  return choices
}

/**
 * @param workspaceConfig
 * @param supportedServices
 */
function enhanceWorkspaceConfiguration (workspaceConfig, supportedServices) {
  // enhance configuration with supported services (immutably)
  const enabledServices = filterEnabledServices(supportedServices)
  const orgServices = enabledServices.map(s => ({ name: s.name, code: s.code, type: s.type }))
  return {
    ...workspaceConfig,
    project: {
      ...workspaceConfig.project,
      org: {
        ...workspaceConfig.project.org,
        details: {
          ...workspaceConfig.project.org.details,
          services: orgServices
        }
      }
    }
  }
}

/**
 * @param workspaceName
 */
function workspaceNamesToPromptString (workspaceName) {
  if (!Array.isArray(workspaceName)) {
    workspaceName = [workspaceName]
  }
  if (workspaceName.length > 1) {
    const allButLast = workspaceName.slice(0, workspaceName.length - 1)
    const last = workspaceName[workspaceName.length - 1]
    return `Workspaces ${allButLast.join(', ')} and ${last}`
  }
  return `Workspace ${workspaceName[0]}`
}

module.exports = {
  orgsToPromptChoices,
  projectsToPromptChoices,
  workspacesToPromptChoices,
  servicesToPromptChoices,
  licenseConfigsToPromptChoices,
  filterEnabledServices,
  findFirstEntpCredential,
  servicePropertiesToNames,
  fixServiceProperties,
  servicePropertiesToServiceSubscriptionPayload,
  getCertFilesLocation,
  findOrgOrThrow,
  findProjectOrThrow,
  findWorkspaceOrThrow,
  getAddServicesOperationPromptChoices,
  enhanceWorkspaceConfiguration,
  workspaceNamesToPromptString
}
