import { BaseState } from "../../../src/components/state-machine/base-state";
import { State } from "../../../src/components/state-machine/public-interfaces";
import { BasicHandable } from "../../../src/components/unifier/public-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { SpecHelper } from "../../../src/spec-helper";
import { PLATFORM } from "../../support/mocks/unifier/extraction";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  state: BaseState;
  specHelper: SpecHelper;
  handler: BasicHandable<any>;
}

describe("BaseState", function() {
  beforeEach(function(this: CurrentThisContext) {
    configureI18nLocale((this as any).container, false);
    createRequestScope(this.specHelper);

    this.handler = this.container.inversifyInstance.get(PLATFORM + ":current-response-handler");
    // Singleton voice response
    spyOn(this.handler, "prompt").and.callThrough();
    spyOn(this.handler, "endSessionWith").and.callThrough();
    this.container.inversifyInstance.unbind(PLATFORM + ":current-response-handler");
    this.container.inversifyInstance.bind(PLATFORM + ":current-response-handler").toDynamicValue(context => this.handler);

    this.state = this.specHelper.setup.container.inversifyInstance.get<State.Factory>(injectionNames.stateFactory)<BaseState>("PlainState");
  });

  describe("responseHandler synonyms", function() {
    describe("prompt", function() {
      it("calls responseFactory.prompt", function(this: CurrentThisContext) {
        const message = "Voice message";
        const reprompts = ["First reprompt", "Second reprompt", "Third reprompt", "Fourth reprompt"];

        this.state.prompt(message, ...reprompts);
        expect(this.handler.prompt).toHaveBeenCalledWith(message, ...reprompts);
      });
    });

    describe("endSessionWith", function() {
      it("calls responseFactory.endSessionWith", function(this: CurrentThisContext) {
        const message = "Voice message";

        this.state.endSessionWith(message);
        expect(this.handler.endSessionWith).toHaveBeenCalledWith(message);
      });
    });
  });

  describe("translateHelper synonyms", function() {
    describe("t", function() {
      beforeEach(function(this: CurrentThisContext) {
        spyOn(this.state.translateHelper, "t");
      });

      it("redirects to translateHelper.t", function() {
        const params = ["mySpecificKeys.keyOne", { localOne: "valueOne" }];
        this.state.t(...params);
        expect(this.state.translateHelper.t).toHaveBeenCalledWith(...params);
      });
    });
  });

  describe("getPlatform", function() {
    it("returns current platform string", function() {
      expect(this.state.getPlatform()).toEqual("ExtractorComponent");
    });
  });

  describe("getDeviceOrPlatform", function() {
    describe("with no device set", function() {
      it("returns current platform string", function() {
        expect(this.state.getDeviceOrPlatform()).toEqual("ExtractorComponent");
      });
    });

    describe("with device present in extraction result", function() {
      beforeEach(function() {
        Object.assign(this.state.extraction, { device: "device1" });
      });

      it("returns current device string", function() {
        expect(this.state.getDeviceOrPlatform()).toEqual("device1");
      });
    });
  });
});
