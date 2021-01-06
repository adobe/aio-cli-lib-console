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

/**
 * @private
 */
function createValidator (name, regex) {
  return function (input) {
    return regex.test(input) || `'${input}' is not a valid ${name}, it must match ${regex.toString()}`
  }
}

module.exports = {
  // project input validators
  validateProjectName: createValidator('Project name', /^[a-zA-Z0-9]{1,20}$/),
  validateProjectTitle: createValidator('Project title', /^[\sA-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff]{1,45}$/),
  validateProjectDescription: createValidator('Project description', /^.{0,1000}$/), // can be empty
  // workspace input validators
  validateWorkspaceName: createValidator('Workspace name', /^[a-zA-Z0-9]{1,20}$/),
  validateWorkspaceTitle: createValidator('Workspace title', /^[\sA-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff]{0,45}$/) // can be empty
  // validateWorkspaceDescription: createValidator('Workspace description', /^(?=\S).{0,500}(?<=\S)$/)
}
