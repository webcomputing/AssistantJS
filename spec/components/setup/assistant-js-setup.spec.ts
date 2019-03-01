import { ThisContext } from "../../this-context";

describe("AssistantJSSetup", function() {
  describe("allInternalComponentsAreRegistered", function() {
    describe("when all internal components are registered", function() {
      it("returns true", function() {
        expect(this.assistantJs.allInternalComponentsAreRegistered()).toBeTruthy();
      });
    });

    describe("when there are missing internal components", function() {
      beforeEach(function(this: ThisContext) {
        delete this.assistantJs.container.componentRegistry.registeredComponents["core:root"];
      });

      it("returns false", function() {
        expect(this.assistantJs.allInternalComponentsAreRegistered()).toBeFalsy();
      });
    });
  });
});
