import { Container } from "inversify-components";
import { GenericIntent, injectionNames, SpecSetup, State } from "../../../src/assistant-source";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { createRequestScope } from "../../support/util/setup";

interface CurrentThisContext {
  specHelper: SpecSetup;
  stateMachine: StateMachine;
  container: Container;
  getContextStates: () => Promise<Array<{ instance: State.Required; name: string }>>;
  doStateTransitions: (states: string[]) => Promise<void>;
}

describe("state context decorators", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.doStateTransitions = async (states: string[]) => {
      for (const state of states) {
        await this.stateMachine.transitionTo(state);
      }
    };

    configureI18nLocale(this.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get<StateMachine>("core:state-machine:current-state-machine");
    this.getContextStates = this.container.inversifyInstance.get<() => Promise<Array<{ instance: State.Required; name: string }>>>(
      injectionNames.current.contextStatesProvider
    );
  });

  describe("stayInContext decorator", function() {
    beforeEach(async function(this: CurrentThisContext) {
      spyOn(this.stateMachine, "handleIntent").and.callThrough();
    });

    describe("with transitioning from state A to B", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.doStateTransitions(["ContextAState", "ContextBState"]);
      });

      it("uses exampleAIntent of ContextAState passing all args", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("exampleAIntent", "testArgs");
        expect(this.stateMachine.handleIntent).toHaveBeenCalledTimes(2);
        expect(this.stateMachine.handleIntent).not.toHaveBeenCalledWith("exampleAIntent");
        expect(this.stateMachine.handleIntent).toHaveBeenCalledWith("exampleAIntent", "testArgs");
        expect(this.stateMachine.handleIntent).not.toHaveBeenCalledWith(GenericIntent.Unhandled, "exampleAIntent");
      });
    });

    describe("with transitioning from A to B to A", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.doStateTransitions(["ContextAState", "ContextBState", "ContextAState"]);
      });

      it("does not add states which stayInContext decorator callback returns false to context", async function(this: CurrentThisContext) {
        const contextStates = await this.getContextStates();
        expect(contextStates.map(state => state.name)).not.toContain("ContextBState");
      });

      it("uses undhandledGenericIntent of ContextAState", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("exampleBIntent");
        expect(this.stateMachine.handleIntent).toHaveBeenCalledWith(GenericIntent.Unhandled, "exampleBIntent");
      });

      it("just adds states to context at leaving state by transition", async function(this: CurrentThisContext) {
        const contextStates = await this.getContextStates();
        expect(contextStates.length).toBe(1);
      });
    });

    describe("with transitioning from A to B to A to B", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.doStateTransitions(["ContextAState", "ContextBState", "ContextAState", "ContextBState"]);
      });

      it("just adds a certain class of state to context once", async function(this: CurrentThisContext) {
        const contextStates = await this.getContextStates();
        const contextStatesNames = contextStates.map(state => state.name);
        expect(contextStates.length).toBe(1);
        expect(contextStatesNames.indexOf("ContextAState")).toBe(contextStatesNames.lastIndexOf("ContextAState"));
      });
    });

    describe("callback", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.doStateTransitions(["ContextAState", "ContextBState"]);
      });

      it("gets called with the correct parameters", async function(this: CurrentThisContext) {
        expect(current).toEqual("ContextAState");
        expect(next).toEqual("ContextBState");
        expect(context).toEqual(["ContextAState"]);
        expect(history).toEqual([]);
      });
    });
  });

  describe("clearContext decorator", function() {
    describe("with transitioning from A to C", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.doStateTransitions(["ContextAState", "ContextCState"]);
      });

      it("removes ContextAState from context", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("exampleCIntent");
        const contextStates = await this.getContextStates();
        expect(contextStates.length).toBe(0);
      });
    });

    describe("with transitioning from A to D", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.doStateTransitions(["ContextAState", "ContextDState"]);
      });

      it("keeps ContextAState in context", async function(this: CurrentThisContext) {
        await this.stateMachine.handleIntent("exampleDIntent");
        const contextStates = await this.getContextStates();
        expect(contextStates.length).toBe(1);
        expect(contextStates.map(state => state.name)).toContain("ContextAState");
      });
    });

    describe("callback", function() {
      beforeEach(async function(this: CurrentThisContext) {
        await this.doStateTransitions(["ContextCState"]);
        await this.stateMachine.handleIntent("exampleCIntent");
      });

      it("gets called with the correct parameters", async function(this: CurrentThisContext) {
        expect(current).toEqual("ContextCState");
        expect(context).toEqual([]);
        expect(history).toEqual([{ stateName: "ContextCState", intentMethodName: "exampleCIntent" }]);
      });
    });
  });
});

let current;
let next;
let context;
let history;

export function testCallback(currentParam, contextParam, historyParam, nextParam) {
  current = currentParam;
  next = nextParam;
  context = contextParam;
  history = historyParam;
  return true;
}
