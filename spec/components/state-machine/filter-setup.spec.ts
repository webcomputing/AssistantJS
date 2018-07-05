import { createRequestScope, createSpecHelper } from "../../support/util/setup";

import { FilterSetup } from "../../../src/assistant-source";
import { TestFilterA } from "../../support/mocks/filters/test-filter-a";
import { TestFilterB } from "../../support/mocks/filters/test-filter-b";

describe("FilterSetup", function() {
  const explicitName = "MySecondFilter";

  beforeEach(function() {
    this.specHelper = createSpecHelper(false);
    this.assistantJs = this.specHelper.setup;
    this.container = this.assistantJs.container;

    createRequestScope(this.specHelper);
    this.setup = new FilterSetup(this.assistantJs);
  });

  describe("addFilter", function() {
    beforeEach(function() {
      this.setup.addClass(TestFilterA);
      this.setup.addClass(TestFilterB, explicitName);
    });

    it("adds filter to internal filterClasses", function() {
      expect(Object.keys(this.setup.filterClasses).length).toBe(2);
    });

    describe("without explicit name", function() {
      it("adds filter to filterClasses by name of constructor", function() {
        expect(this.setup.filterClasses.TestFilterA).toEqual(TestFilterA);
      });
    });

    describe("with explicit name given", function() {
      it("adds filter to filterClasses by given name", function() {
        expect(this.setup.filterClasses[explicitName]).toEqual(TestFilterB);
      });
    });
  });
});
