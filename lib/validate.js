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
function validateName (input) {
  const valid = /^[a-zA-Z0-9]{1,20}$/
  return valid.test(input) || `'${input}' is not a valid name for creation, the name must match /^[a-zA-Z0-9]{1,20}$/`
}

/** @private */
function validateTitle (input) {
  const valid = /^[\sA-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff]{1,45}$/
  return valid.test(input) || `'${input}' is not a valid title for creation, the name must match /^[\\sA-Za-z0-9\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff]{1,45}$/`
}

module.exports = {
  validateName,
  validateTitle
}
