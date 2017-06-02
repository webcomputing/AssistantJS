require("reflect-metadata");
let spawnContainer = require("../support/util/spawn-container");

beforeEach(function() {
  this.container = spawnContainer.spawnContainer();
});