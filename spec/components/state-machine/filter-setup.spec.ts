import { createRequestScope } from "../../helpers/scope";

import { AssistantJSSetup, FilterSetup, SpecHelper } from "../../../src/assistant-source";
import { TestFilterA } from "../../support/mocks/filters/test-filter-a";
import { ThisContext } from "../../this-context";

describe("FilterSetup", function() {
  const explicitName = "MySecondFilter";

  beforeEach(function(this: ThisContext) {
    this.assistantJs = new AssistantJSSetup();
    this.filterSetup = new FilterSetup(this.assistantJs);
    this.specHelper = new SpecHelper(this.assistantJs, this.stateMachineSetup);
  });

  describe("addFilter", function() {
    beforeEach(function(this: ThisContext) {
      // Add and register filters
      this.filterSetup.addFilter(TestFilterA);
      this.filterSetup.registerFilters();

      // Register internal components
      this.assistantJs.registerInternalComponents();

      this.specHelper.prepareSpec(this.defaultSpecOptions);
      createRequestScope(this.specHelper);
    });

    it("adds filter to internal filterClasses", function() {
      expect(Object.keys(this.filterSetup.classes).length).toBe(1);
    });

    it("adds filter to filterClasses by name of constructor", function() {
      expect(this.filterSetup.classes.TestFilterA).toEqual(TestFilterA);
    });
  });
});
