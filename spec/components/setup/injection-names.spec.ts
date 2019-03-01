import { injectionNames } from "../../../src/injection-names";
import { createRequestScope } from "../../helpers/scope";
import { ThisContext } from "../../this-context";

describe("injectionNames", function() {
  const currentScopeKeys = Object.keys(injectionNames.current);
  const rootScopeKeys = Object.keys(injectionNames).filter(k => k !== "current");

  describe("in root scope", function() {
    beforeEach(function(this: ThisContext) {
      this.specHelper.prepareSpec(this.defaultSpecOptions);
    });
    rootScopeKeys.forEach(injection => {
      describe(injection, function() {
        it("is injectable", function() {
          expect(() => {
            this.inversify.get(injectionNames[injection]);
          }).not.toThrow();
        });
      });
    });
  });

  describe("in current scope", function() {
    beforeEach(function(this: ThisContext) {
      this.specHelper.prepareSpec(this.defaultSpecOptions);
      createRequestScope(this.specHelper);
    });

    currentScopeKeys.forEach(injection => {
      describe(injection, function() {
        it("is injectable", function() {
          expect(() => {
            this.inversify.get(injectionNames.current[injection]);
          }).not.toThrow();
        });
      });
    });
  });
});
