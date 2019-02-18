import { createRequestScope, createSpecHelper } from "../../support/util/setup";

import { FilterSetup } from "../../../src/assistant-source";
import { TestFilterA } from "../../support/mocks/filters/test-filter-a";
import { TestFilterB } from "../../support/mocks/filters/test-filter-b";

describe("FilterSetup", function() {
  const explicitName = "MySecondFilter";

  beforeEach(function() {
    this.specHelper = createSpecHelper(false);
    this.assistantJs = this.specHelper.assistantJs;
    this.container = this.assistantJs.container;

    createRequestScope(this.specHelper);
    this.setup = new FilterSetup(this.assistantJs);
  });

  describe("addFilter", function() {
    beforeEach(function() {
      this.setup.addFilter(TestFilterA);
    });

    it("adds filter to internal filterClasses", function() {
      expect(Object.keys(this.setup.classes).length).toBe(1);
    });

    it("adds filter to filterClasses by name of constructor", function() {
      expect(this.setup.classes.TestFilterA).toEqual(TestFilterA);
    });
  });
});
