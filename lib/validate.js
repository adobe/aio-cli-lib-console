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

/** @private */
function createValidator (name, regex, regexForHumans) {
  return function (input) {
    return regex.test(input) || `'${input}' is not a valid ${name}, ${name} should ${regexForHumans}`
  }
}

/** @private */
function atLeastOne (input) {
  if (input.length === 0) {
    return 'please choose at least one option'
  }
  return true
}

module.exports = {
  // project input validators
  validateProjectName: createValidator(
    'Project name',
    // non empty && no spaces
    /^[A-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff]{1,20}$/,
    'only contain up to 20 English alphanumeric or Latin alphabet characters'
  ),
  validateProjectTitle: createValidator(
    'Project title',
    // non empty && spaces allowed && contains at least one non-space char
    /^(?=.*\S)[A-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]{1,45}$/,
    'only contain up to 45 English alphanumeric or Latin alphabet characters and spaces'
  ),
  validateProjectDescription: createValidator(
    'Project description',
    // empty || (string with spaces && contains at least one non-space char)
    /^$|^(?=.*\S)[-+!'"/\n\r#$%&*.,:;()=?\u0040-\uD800 0-9]{1,1000}$/,
    'contain up to 1000 English alphanumeric or Latin alphabet characters, spaces and common special characters'
  ),

  // workspace input validators
  validateWorkspaceName: createValidator(
    'Workspace name',
    // non empty && no spaces
    /^[A-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff]{1,20}$/,
    'only contain up to 20 English alphanumeric or Latin alphabet characters'
  ),
  validateWorkspaceTitle: createValidator(
    'Workspace title',
    // empty || (spaces allowed && contains at least one non-space char)
    /^$|^(?=.*\S)[A-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]{1,45}$/,
    'only contain up to 45 English alphanumeric or Latin alphabet characters and spaces'
  ),

  // other
  atLeastOne
}
