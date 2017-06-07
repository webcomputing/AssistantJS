require("reflect-metadata");
let setup = require("../support/util/setup");

beforeEach(function() {
  this.assistantJs = setup.createTestAssistantJsSetup();
  this.container = this.assistantJs.container;
});