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
const runtimeNamespace = workspace.runtime_namespace

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
  technicalAccountId: '2CD62F475FD9D69D0A495F8A@techacct.adobe.com',
  technicalAccountEmail: 'd4388783-a161-4292-b46d-b4d57fef75d1@techacct.adobe.com',
  serviceProperties: [
    { sdkCode: 'DvaQueueSDK', name: 'Task Queue Manager', roles: [{ id: 1025, code: 'ent_default', name: null }], licenseConfigs: [] },
    { sdkCode: 'StockSDK', name: 'Adobe Stock', roles: [{ id: 1006, code: 'ent_stocksearch', name: null }], licenseConfigs: [] },
    { sdkCode: 'Sensei Enterprise Beta (MAX 2018)', name: 'Content AI (Beta)', roles: [{ id: 1024, code: 'ent_sensei_image', name: null }], licenseConfigs: [] },
    { sdkCode: 'McGdprSDK', name: 'Privacy Service API', roles: [{ id: 1026, code: 'ent_gdpr', name: null }], licenseConfigs: [] }
  ],
  readOnly: false,
  technicalAcctId: '2CD62F475FD9D69D0A495F8A@techacct.adobe.com',
  sdkList: ['DvaQueueSDK', 'StockSDK', 'Sensei Enterprise Beta (MAX 2018)', 'McGdprSDK']
}

const integrationId = integration.id

module.exports = {
  organizations,
  projects,
  workspaces,
  integration,
  org,
  project,
  workspace,
  integrationId
}
