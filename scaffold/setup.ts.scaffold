//tslint:disable-next-line
require("reflect-metadata");

import { SpecHelper } from "assistant-source";
import { ThisContext } from "../support/this-context";
import { ApplicationInitializer } from "../../application-initializer";

beforeEach(function(this: ThisContext) {
  // Get application initializer and initializer main variables
  this.applicationInitializer = new ApplicationInitializer();
  this.setups = this.applicationInitializer.createAndPrepareSetups();
  this.specHelper = new SpecHelper(this.setups.assistantJs, this.setups.stateMachine);
  this.inversify = this.specHelper.assistantJs.container.inversifyInstance;

  // Register all platforms. For every platform you install, you want to add an entry here.
  this.platforms = {};

  // Your default spec options which are passed into this.specHelper.prepareSpec()
  this.defaultSpecOptions = {};
});