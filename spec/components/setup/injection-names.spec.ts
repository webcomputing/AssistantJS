import { injectionNames } from "../../../src/injection-names";
import { createRequestScope } from "../../support/util/setup";

describe("injectionNames", function() {
  const currentScopeKeys = Object.keys(injectionNames.current);
  const rootScopeKeys = Object.keys(injectionNames).filter(k => k !== "current");

  describe("in root scope", function() {
    rootScopeKeys.forEach(injection => {
      describe(injection, function() {
        it("is injectable", function() {
          expect(() => {
            this.container.inversifyInstance.get(injectionNames[injection]);
          }).not.toThrow();
        });
      });
    });
  });

  describe("in current scope", function() {
    beforeEach(function() {
      createRequestScope(this.specHelper);
    });

    currentScopeKeys.forEach(injection => {
      describe(injection, function() {
        it("is injectable", function() {
          expect(() => {
            this.container.inversifyInstance.get(injectionNames.current[injection]);
          }).not.toThrow();
        });
      });
    });
  });
});
