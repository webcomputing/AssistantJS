require("reflect-metadata");
let setup = require("../support/util/setup");

beforeEach(function() {
  this.specHelper = setup.createSpecHelper();
  this.assistantJs = this.specHelper.assistantJs;
  this.container = this.assistantJs.container;
});
