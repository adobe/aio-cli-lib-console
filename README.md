# Adobe I/O Lib CLI Console

[![Version](https://img.shields.io/npm/v/@adobe/aio-lib-cli-console.svg)](https://npmjs.org/package/@adobe/aio-lib-cli-console)
[![Downloads/week](https://img.shields.io/npm/dw/@adobe/aio-lib-cli-console.svg)](https://npmjs.org/package/@adobe/aio-lib-cli-console)
![Node.js CI](https://github.com/adobe/aio-lib-cli-console/workflows/Node.js%20CI/badge.svg)[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Codecov Coverage](https://img.shields.io/codecov/c/github/adobe/aio-lib-cli-console/master.svg?style=flat-square)](https://codecov.io/gh/adobe/aio-lib-cli-console/)

A library providing command line primitives to interract with the Adobe Developer Console.

## Install & Usage

**Note**: This module is not intented for usage on its own, it should be used **only** by Adobe I/O CLI plugins.

- `npm install @adobe/aio-lib-cli-console`

```javascript
const LibConsoleCLI = require('@adobe/aio-lib-cli-console')
const consoleCLI = await LibConsoleCLI.init({ accessToken, env, apiKey: CONSOLE_API_KEYS[env] })

// select a Console Organization
const organizations = await consoleCLI.getOrganizations()
const org = await consoleCLI.promptForSelectOrganization(organizations)

// create a Console Firefly Project
const projectDetails = await consoleCLI.promptForCreateProjectDetails()
const project = await consoleCLI.createProject(org.id, projectDetails)

// add services to a selected Workspace, will create a new entp integration if there is none
const workspaces = await consoleCLI.getWorkspaces(org.id, project.id)
const workspace = await consoleCLI.promptForSelectWorkspace(workspaces)
const services = await consoleCLI.promptForSelectServiceProperties(workspace.name)
await consoleCLI.subscribeToServices(
  org.id,
  project,
  workspace,
  'folder/to/store/certificate',
  newServiceProperties
)
```

## Contributing

Contributions are welcomed! Read the [Contributing Guide](./.github/CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
