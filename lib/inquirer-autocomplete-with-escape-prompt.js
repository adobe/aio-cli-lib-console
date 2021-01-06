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

const AutocompletePrompt = require('inquirer-autocomplete-prompt')
const { EOL } = require('os')

/**
 * This is an inquirer plugin extending inquirer-autocomplete-prompt with an escape symbol.
 *
 * @class AutocompleteWithEscapePrompt
 * @augments {AutocompletePrompt}
 */
class AutocompleteWithEscapePrompt extends AutocompletePrompt {
  onKeypress (e) {
    // if the escape symbol is pressed, exit the prompt and return the symbol
    if (this.opt.escapeSymbol && e.value === this.opt.escapeSymbol) {
      this.answer = this.opt.escapeSymbol
      this.status = 'answered'
      this.rl.line = EOL
      this.render()
      this.screen.done()
      this.done(this.answer)
    }
    // otherwise continue as always
    super.onKeypress(e)
  }
}

module.exports = AutocompleteWithEscapePrompt
