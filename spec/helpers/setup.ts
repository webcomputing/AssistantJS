require("reflect-metadata");
import { createSpecHelper } from "../support/util/setup";
import { ThisContext } from "../this-context";

beforeEach(function(this: ThisContext) {
  this.specHelper = createSpecHelper();
  this.assistantJs = this.specHelper.assistantJs;
  this.container = this.specHelper.assistantJs.container;
});
