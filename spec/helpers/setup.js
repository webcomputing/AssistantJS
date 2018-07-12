require("reflect-metadata");
let setup = require("../support/util/setup");

beforeEach(function() {
  this.specHelper = setup.createSpecHelper();
  this.assistantJs = this.specHelper.setup;
  this.container = this.assistantJs.container;
});
