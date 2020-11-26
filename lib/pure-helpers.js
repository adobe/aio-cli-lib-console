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

// All functions defined here must be pure, i.e. no I/O call should be done in this file

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
    // we only support entp orgs for now
    .filter(item => item.type === 'entp')
    .find(org => org.id === orgId)
  if (!selectedOrg) {
    throw new Error(`Enterprise Org with id ${orgId} not found`)
  }
  return selectedOrg
}

/**
 * @param projectId
 * @param projects
 */
function findProjectOrThrow (projectId, projects) {
  const selectedOrg = projects
    .find(p => p.id === projectId)
  if (!selectedOrg) {
    throw new Error(`Project with id ${projectId} not found`)
  }
  return selectedOrg
}

/**
 * @param projectId
 * @param projects
 */
function findProjectOrThrow (workspaceId, workspaces) {
  const selectedOrg = workspaces
    .find(p => p.id === workspaceId)
  if (!selectedOrg) {
    throw new Error(`Workspace with id ${workspaceId} not found`)
  }
  return selectedOrg
}

/**
 * @param projects
 */
function projectsToPromptChoices (projects) {
  // show projects by title and reverse order to show latest first, note reverse is in
  // place, let's make sure project is not modified by copying the array
  [...projects.map(item => ({ name: item.title, value: item }))].reverse()
}

/**
 * @param workspaces
 */
function workspacesToPromptChoices (workspaces) {
  return workspaces.map(item => ({ name: item.name, value: item }))
}

/**
 * @param services
 */
function servicesToPromptChoices (services) {
  return services
    // we only support entp integrations for now
    .filter(s => s.type === 'entp')
    .map(s => ({ name: s.name, value: s }))
}

/**
 * @param
 * @param licenseConfigs
 */
function licenseConfigsToPromptChoices (licenseConfigs) {
  return licenseConfigs
    .map(l => ({ name: l.name, value: l }))
}

/**
 * @param service
 */
function getUniqueServiceId (service) {
  return service.code + service.type
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

// todo description
// NOTE 2: this is a workaround for another bug in the returned LicenseConfigs list,
//  After the caching issue, where the returned list may be empty, now every
//  list contains all the LicenseConfigs for all services, so this list must be
//  filtered to map to service specific licenseConfigs
/**
 * @param serviceProperties
 * @param supportedServices
 */
function fixServiceProperties (serviceProperties, supportedServices) {
  return serviceProperties.map(sp => {
    const orgService = supportedServices.find(os => os.code === sp.sdkCode)
    let fixedLicenseConfigs = null
    if (orgService.properties && orgService.properties.licenseConfigs) {
      fixedLicenseConfigs = sp.licenseConfigs
        .filter(l => orgService.properties.licenseConfigs.find(ol => ol.id === l.id))
    }
    return {
      sdkCode: sp.sdkCode,
      roles: sp.roles,
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
      // todo check that we do not need to rewrite roles
      roles: sp.roles,
      licenseConfigs: licenseConfigsToSubscriptionPartialPayload(sp.licenseConfigs)
    }
  })
}

/**
 * @param licenseConfigs
 */
function licenseConfigsToSubscriptionPartialPayload (licenseConfigs) {
  return licenseConfigs.map(l => ({
    op: 'add',
    id: l.id,
    productId: l.productId
  }))
}

/**
 * @param orgId
 * @param project
 * @param workspace
 * @param certDir
 */
function getCertFilesLocation (orgId, project, workspace, certDir) {
  const projectCertDir = path.join(certDir, `${this.org.id}-${this.project.name}`)
  const publicKeyFileName = `${workspace.name}.pem`
  const privateKeyFileName = `${workspace.name}.key`
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
 * @param inputs
 * @param requiredInputKeys
 */
function missingInputs (inputs, requiredInputKeys) {
  return new Set(requiredInputKeys.filter(k => typeof inputs[k] !== 'string'))
}

// todo do loop until confirmation w/o I/O

module.exports = {
  orgsToPromptChoices,
  projectsToPromptChoices,
  workspacesToPromptChoices,
  servicesToPromptChoices,
  licenseConfigsToPromptChoices,
  getUniqueServiceId,
  filterEnabledServices,
  findFirstEntpCredential,
  servicePropertiesToNames,
  fixServiceProperties,
  servicePropertiesToServiceSubscriptionPayload,
  licenseConfigsToSubscriptionPartialPayload,
  getCertFilesLocation,
  missingInputs,
  findOrgOrThrow,
  findProjectOrThrow,
  findWorkspaceOrThrow
}
