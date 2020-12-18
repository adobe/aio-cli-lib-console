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

const someDate = '2020-02-04T15:55:15.000Z'
const someLaterDate = '2020-04-05T13:33:13.000Z'
const someUserOrgCode = '22222222226666666666DDDD@AdobeOrg'
const someOtherUserOrgCode = '22222222226666666666EEEE@AdobeOrg'

const organizations = [
  {
    id: '12345',
    code: '11111111111AAAAAAAAABBBB@AdobeOrg',
    name: 'First ENTP org',
    description: null,
    type: 'entp',
    roles: [], // no need to mock roles for now
    role: 'ADMIN'
  },
  {
    id: '55555',
    code: someUserOrgCode,
    name: 'johndoe-adobe.com',
    description: null,
    type: 'developer',
    roles: [],
    role: 'DEVELOPER'
  },
  {
    id: '67890',
    code: '22222222222NNNNNNNNNCCCC@AdobeOrg',
    name: 'Second ENTP org',
    description: 'hello from the second entp org',
    type: 'entp',
    roles: [], // no need to mock roles for now
    role: 'DEVELOPER'
  }
]
const org = organizations[0]

const projects = [{
  name: 'myFirstProject',
  enabled: 1,
  title: 'first-project',
  org_id: org.id,
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someOtherUserOrgCode,
  description: 'some project description',
  type: 'default',
  deleted: 0,
  appId: 'OPad1234567890WWWW',
  id: '1234567890123456789'
},
{
  name: 'mySecondProject',
  enabled: 1,
  title: 'second-project',
  org_id: org.id,
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: 'System',
  who_last_modified: 'System',
  description: '',
  type: 'jaeger',
  deleted: 0,
  appId: 'OPad1234567890WWWW',
  id: '0123456789012345678'
},
{
  name: 'myThirdProject',
  enabled: 0,
  title: 'third-project',
  org_id: org.id,
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: 'System',
  who_last_modified: 'System',
  description: '',
  type: 'jaeger',
  deleted: 0,
  appId: 'OPad1234567890WWWW',
  id: '2345678901234567890'
},
{
  name: 'myFourthProject',
  enabled: 1,
  title: 'fourth-project',
  org_id: org.id,
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someUserOrgCode,
  description: 'some project description',
  type: 'jaeger',
  deleted: 1,
  appId: null,
  id: '3456789012345678901'
},
{
  name: 'myFifthProject',
  enabled: 1,
  title: 'fifth-project',
  org_id: org.id,
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someOtherUserOrgCode,
  description: 'some project description',
  type: 'jaeger',
  deleted: 0,
  appId: null,
  id: '4567890123456789012'
}]

const project = projects[1]
const runtimeNamespacePrefix = org.id + '-' + project.name.toLowerCase()

const workspaces = [{
  name: 'Production',
  enabled: 1,
  title: 'ProjectWorkspace',
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someUserOrgCode,
  description: 'ProjectWorkspace description',
  quota_usage: 'Quota usage for workspace',
  runtime_enabled: 1,
  runtime_namespace: runtimeNamespacePrefix,
  id: '1111111111111111111'
},
{
  name: 'Stage',
  enabled: 1,
  title: '',
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someOtherUserOrgCode,
  description: '',
  quota_usage: '',
  runtime_enabled: 1,
  runtime_namespace: runtimeNamespacePrefix + '-stage',
  id: '1111111111111111112'
},
{
  name: 'dev1',
  enabled: 1,
  title: 'some title',
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someOtherUserOrgCode,
  description: 'some description',
  quota_usage: '',
  runtime_enabled: 1,
  runtime_namespace: runtimeNamespacePrefix + '-dev1',
  id: '5678912304567890123'
},
{
  name: 'dev2',
  enabled: 0,
  title: 'some title2',
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someOtherUserOrgCode,
  description: 'some description',
  quota_usage: '',
  runtime_enabled: 1,
  runtime_namespace: runtimeNamespacePrefix + '-dev2',
  id: '1111111111111111113'
},
{
  name: 'dev3',
  enabled: 1,
  title: 'some title3',
  date_created: someDate,
  date_last_modified: someLaterDate,
  who_created: someUserOrgCode,
  who_last_modified: someOtherUserOrgCode,
  description: '',
  quota_usage: '',
  runtime_enabled: 0,
  runtime_namespace: null,
  id: '1111111111111111114'
}]

const workspace = workspaces[2]

// returned from getServicesForORG
const services = [
  {
    name: 'First SDK',
    code: 'firstSDK',
    enabled: true,
    type: 'entp',
    platformList: null,
    docsUrl: null,
    learnMoreUrl: null,
    description: null,
    atlasCollectionCode: null,
    atlasDefaultPlanCode: null,
    properties: {
      roles: [
        { id: 1000, code: 'ent_somerole', name: null },
        { id: 1100, code: 'ent_role_a', name: null }
      ],
      licenseConfigs: [{
        id: '0123456',
        name: 'config',
        productId: 'AAAAACCCCCCVV2EEEEE1E',
        description: null
      },
      {
        id: '0123457',
        name: 'configB',
        productId: 'AAAAACCCCCCVV2EEEEE1E',
        description: null
      }
      ]
    },
    requiresApproval: false
  },
  {
    name: 'Second SDK',
    code: 'secondSDK',
    enabled: true,
    type: 'entp',
    platformList: null,
    docsUrl: null,
    learnMoreUrl: null,
    description: null,
    atlasCollectionCode: null,
    atlasDefaultPlanCode: null,
    properties: {
      roles: [
        { id: 1001, code: 'ent_someotherrole', name: null },
        { id: 1002, code: 'ent_someotherrole', name: null }
      ],
      licenseConfigs: [
        {
          id: '1234567',
          name: 'some configuration',
          productId: 'AAAAABBBBBVV2VVEEE1E',
          description: null
        },
        {
          id: '7654321',
          name: 'some other configuration',
          productId: 'AAAAABBBBBVV2VVEEE1E',
          description: null
        }
      ]
    },
    requiresApproval: false
  },
  {
    name: 'Third SDK',
    code: 'thirdSDK',
    enabled: true,
    type: 'entp',
    platformList: null,
    docsUrl: null,
    learnMoreUrl: null,
    description: null,
    atlasCollectionCode: null,
    atlasDefaultPlanCode: null,
    properties: null,
    requiresApproval: false
  },
  {
    name: 'Fourth SDK',
    code: 'fourthSDK',
    enabled: true,
    type: 'entp',
    platformList: null,
    docsUrl: null,
    learnMoreUrl: null,
    description: null,
    atlasCollectionCode: null,
    atlasDefaultPlanCode: null,
    properties: null,
    requiresApproval: false
  },
  {
    name: 'Fifth SDK',
    code: 'fifthSDK',
    enabled: false,
    type: 'entp',
    platformList: null,
    docsUrl: null,
    learnMoreUrl: null,
    description: null,
    atlasCollectionCode: null,
    atlasDefaultPlanCode: null,
    properties: null,
    requiresApproval: false
  },
  {
    name: 'Sixth SDK',
    code: 'sixthSDK',
    enabled: true,
    type: 'adobeid',
    platformList: null,
    docsUrl: null,
    learnMoreUrl: null,
    description: null,
    atlasCollectionCode: null,
    atlasDefaultPlanCode: null,
    properties: null,
    requiresApproval: false
  }
]

const enabledServices = [
  services[0],
  services[1],
  services[2],
  services[3],
  services[5]
]

// response from getCredentials
const integrations = [
  {
    id: '111111',
    id_workspace: workspace.id,
    integration_type: 'other',
    flow_type: 'entp'
  },
  {
    id: '111112',
    id_workspace: workspace.id,
    integration_type: 'service',
    flow_type: 'other'
  },
  {
    id: '222222',
    id_workspace: workspace.id,
    integration_type: 'service',
    flow_type: 'entp'
  },
  {
    id: '33333',
    id_workspace: workspace.id,
    integration_type: 'service',
    flow_type: 'entp'
  }
]

// as returned by getIntegration
const integration = {
  id: '222222',
  orgId: org.id,
  apiKey: '1111111111111111111abcde',
  name: 'aio-' + workspace.name,
  description: 'Auto generated enterprise credentials from aio CLI',
  status: 'ENABLED',
  type: 'entp',
  production: true,
  createdDate: 1222111600000,
  lastModifiedDate: 1222111777000,
  namespaceEnabled: false,
  technicalAccountId: 'some@techacct.adobe.com',
  technicalAccountEmail: 'some222222@techacct.adobe.com',
  serviceProperties: [
    {
      sdkCode: services[0].code,
      name: services[0].name,
      roles: [
        services[0].properties.roles[0]
      ],
      licenseConfigs: [
        services[0].properties.licenseConfigs[1]
      ]
    },
    {
      sdkCode: services[1].code,
      name: services[1].name,
      roles: [
        services[1].properties.roles[0],
        services[1].properties.roles[1]
      ],
      licenseConfigs: [
        services[1].properties.licenseConfigs[0],
        services[1].properties.licenseConfigs[1]
      ]
    },
    { sdkCode: services[2].code, name: services[2].name, roles: null, licenseConfigs: null }
  ],
  readOnly: false,
  technicalAcctId: 'some@techacct.adobe.com',
  sdkList: [services[0].code, services[1].code, services[2].code]
}

const workspaceJson = {
  // incomplete
  project: {
    org: {
      id: org.id
    }
  }
}

module.exports = {
  organizations,
  projects,
  workspaces,
  org,
  project,
  workspace,
  integrations,
  integration,
  services,
  workspaceJson,
  enabledServices
}
