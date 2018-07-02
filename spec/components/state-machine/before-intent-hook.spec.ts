import { Container } from "inversify-components";
import { injectionNames, MinimalResponseHandler, PlatformSpecHelper, SpecSetup, TranslateHelper } from "../../../src/assistant-source";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";

interface CurrentThisContext {
  responseHandler: MinimalResponseHandler;
  specHelper: SpecSetup;
  stateMachine: StateMachine;
  container: Container;
  translateHelper: TranslateHelper;
}

describe("BeforeIntentHook", function() {
  beforeEach(async function(this: CurrentThisContext) {
    configureI18nLocale(this.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get<StateMachine>("core:state-machine:current-state-machine");
    this.translateHelper = this.container.inversifyInstance.get(injectionNames.current.translateHelper);
    this.responseHandler = this.container.inversifyInstance.get<MinimalResponseHandler>("core:unifier:current-response-handler");
    this.container.inversifyInstance.unbind("core:unifier:current-response-handler");
    this.container.inversifyInstance
      .bind("core:unifier:current-response-handler")
      .toDynamicValue(() => this.responseHandler)
      .inSingletonScope();
    await this.stateMachine.transitionTo("FilterAState");
  });

  describe("calling an intent without any filter decorators", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.stateMachine.transitionTo("FilterAState");
    });

    it("uses no filter", async function(this: CurrentThisContext) {
      await this.stateMachine.handleIntent("filterTestBIntent");
      expect(this.responseHandler.voiceMessage).toBe(await this.translateHelper.t("filter.stateA.intentB"));
    });
  });

  describe("calling an intent with an intent filter decorator", function() {
    describe("without a state filter decorator", function() {
      it("uses intent filter", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestAIntent");
        expect(this.responseHandler.voiceMessage).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });

      it("uses handling of filter class instead of the original intent", async function(this: CurrentThisContext) {
        await this.stateMachine.transitionTo("FilterCState");
        await this.stateMachine.handleIntent("filterTestAIntent");
        expect(this.responseHandler.voiceMessage).toBe(await this.translateHelper.t("filter.stateC.intentB"));
      });
    });

    describe("with a state filter decorator", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.stateMachine.transitionTo("FilterBState");
      });

      it("uses state filter", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestAIntent");
        expect(this.responseHandler.voiceMessage).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });
    });
  });

  describe("calling an intent with a state filter decorator", function() {
    describe("without an intent filter decorator", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.stateMachine.transitionTo("FilterBState");
      });

      it("uses state filter", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestBIntent");
        expect(this.responseHandler.voiceMessage).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });
    });
  });

  describe("calling an intent with two intent filters", function() {
    describe("with the first one redirecting", function() {
      it("properly redirects", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestDIntent");
        expect(this.responseHandler.voiceMessage).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });
    });

    describe("with the second one redirecting", function() {
      it("properly redirects", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestCIntent");
        expect(this.responseHandler.voiceMessage).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });
    });
  });
});
