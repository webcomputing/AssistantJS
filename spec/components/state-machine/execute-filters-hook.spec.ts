import { Container } from "inversify-components";
import { injectionNames, SpecHelper, TranslateHelper } from "../../../src/assistant-source";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { createRequestScope } from "../../helpers/scope";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  specHelper: SpecHelper;
  stateMachine: StateMachine;
  container: Container;
  translateHelper: TranslateHelper;
  callSpyResults: any[][];
}

describe("ExecuteFiltersHook", function() {
  beforeEach(async function(this: CurrentThisContext) {
    // Bind call filter spy -> adds sth to callSpyResults if called from filters
    this.callSpyResults = [];
    this.inversify.bind("mocks:filters:call-spy").toFunction((...args: any[]) => {
      this.callSpyResults.push(args);
    });

    configureI18nLocale(this.assistantJs.container, false);
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    createRequestScope(this.specHelper);

    this.stateMachine = this.inversify.get<StateMachine>(injectionNames.current.stateMachine);
    this.translateHelper = this.inversify.get(injectionNames.current.translateHelper);

    await this.stateMachine.transitionTo("FilterAState");
  });

  describe("calling an intent without any filter decorators", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.stateMachine.transitionTo("FilterAState");
    });

    it("uses no filter", async function(this: CurrentThisContext) {
      await this.stateMachine.handleIntent("filterTestBIntent");
      expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateA.intentB"));
    });
  });

  describe("calling an intent with an intent filter decorator", function() {
    describe("without a state filter decorator", function() {
      it("uses intent filter", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestAIntent");
        expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });

      it("uses handling of filter class instead of the original intent", async function(this: CurrentThisContext) {
        await this.stateMachine.transitionTo("FilterCState");
        await this.stateMachine.handleIntent("filterTestAIntent");
        expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateC.intentB"));
      });

      it("passes arguments from handleIntent as executionContext to execute method of filter", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestAIntent", "arg1", "arg2");

        expect(this.callSpyResults[0][0]).toEqual("TestFilterA");
        expect(this.callSpyResults[0][1].state.constructor.name).toEqual("FilterAState");
        expect(this.callSpyResults[0][1].stateName).toEqual("FilterAState");
        expect(this.callSpyResults[0][1].intentMethod).toEqual("filterTestAIntent");
        expect(this.callSpyResults[0][1].additionalIntentArguments).toEqual(["arg1", "arg2"]);
      });

      describe("with filter annotation using parameters", function() {
        it("executes filter", async function(this: CurrentThisContext) {
          await this.stateMachine.handleIntent("filterTestEIntent");
          expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateA.intentB"));
        });

        it("passes params from annotation to execute method of filter", async function(this: CurrentThisContext) {
          await this.stateMachine.handleIntent("filterTestEIntent");
          expect(this.callSpyResults[0][2]).toEqual({ exampleParam: "example" });
        });
      });

      describe("with a filter annotation not using parameters", function() {
        it("passes undefined to execute method of filter", async function(this: CurrentThisContext) {
          await this.stateMachine.handleIntent("filterTestAIntent");
          expect(this.callSpyResults[0][2]).toBeUndefined();
        });
      });

      describe("with a filter returning arguments", function() {
        it("passes args from filter to redirectTo-method of state-machine", async function(this: CurrentThisContext) {
          spyOn(this.stateMachine, "redirectTo").and.callThrough();
          await this.stateMachine.handleIntent("filterTestAIntent");
          expect(this.stateMachine.redirectTo).toHaveBeenCalledWith("FilterAState", "filterTestBIntent", "testArgs1", "testArgs2");
        });
      });

      describe("with a filter not returning arguments", function() {
        it("does not change arguments of original handleIntent call", async function(this: CurrentThisContext) {
          spyOn(this.stateMachine, "redirectTo").and.callThrough();
          await this.stateMachine.transitionTo("FilterCState");
          await this.stateMachine.handleIntent("filterTestArgumentsPassingIntent", "argument1", "argument2");
          expect(this.stateMachine.redirectTo).toHaveBeenCalledWith("FilterBState", "filterTestBIntent", "argument1", "argument2");
        });
      });
    });

    describe("with a state filter decorator", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.stateMachine.transitionTo("FilterBState");
      });

      it("uses state filter", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestAIntent");
        expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateA.intentB"));
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
        expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });
    });
  });

  describe("calling an intent with two intent filters", function() {
    describe("with the first one redirecting", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestDIntent");
      });

      it("properly redirects", async function(this: CurrentThisContext) {
        expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });

      it("does not call the second one", async function(this: CurrentThisContext) {
        expect(this.callSpyResults.length).toEqual(1);
        expect(this.callSpyResults[0][0]).toEqual("TestFilterA");
      });
    });

    describe("with the second one redirecting", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("filterTestCIntent");
      });

      it("properly redirects", async function(this: CurrentThisContext) {
        expect(this.specHelper.getResponseResults().voiceMessage!.text).toBe(await this.translateHelper.t("filter.stateA.intentB"));
      });

      it("has already called the first one", async function(this: CurrentThisContext) {
        expect(this.callSpyResults.length).toEqual(2);
        expect(this.callSpyResults[0][0]).toEqual("TestFilterD");
        expect(this.callSpyResults[1][0]).toEqual("TestFilterA");
      });
    });
  });
});
