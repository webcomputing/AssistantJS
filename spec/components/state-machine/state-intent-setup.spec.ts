import { GenericIntent } from "../../../src/components/unifier/public-interfaces";

import { StateMachineSetup } from "../../../src/components/state-machine/state-intent-setup";
import { createRequestScope } from "../../helpers/scope";

import { AssistantJSSetup } from "../../../src/setup";
import { SpecHelper } from "../../../src/spec-helper";
import { MainState } from "../../support/mocks/states/main";
import { SecondState } from "../../support/mocks/states/second";
import { SubState } from "../../support/mocks/states/sub";
import { ThisContext } from "../../this-context";

describe("StateMachineSetup", function() {
  const explicitIntents = ["test", GenericIntent.Yes.toString(), GenericIntent.No.toString()];
  const explicitName = "MySecondState";
  const implicitMainStateIntents = ["test", "answer", "other", GenericIntent.Yes, "error"];

  beforeEach(function(this: ThisContext) {
    this.assistantJs = new AssistantJSSetup();
    this.stateMachineSetup = new StateMachineSetup(this.assistantJs);
    this.specHelper = new SpecHelper(this.assistantJs, this.stateMachineSetup);
  });

  describe("addState", function() {
    beforeEach(function(this: ThisContext) {
      // Register states
      this.stateMachineSetup.addState(MainState);
      this.stateMachineSetup.addState(SecondState, explicitName, explicitIntents);
      this.stateMachineSetup.registerStates();

      // Register internal components
      this.assistantJs.registerInternalComponents();

      // Prepare spec
      this.specHelper.prepareSpec(this.defaultSpecOptions);

      // Create request scope
      createRequestScope(this.specHelper);
    });

    it("adds state to internal stateClasses", function() {
      expect(Object.keys(this.stateMachineSetup.classes).length).toBe(2);
    });

    it("adds state to internal metaStates", function() {
      expect(this.stateMachineSetup.metaStates.length).toBe(2);
    });

    describe("without explicit name", function() {
      it("adds state to stateClases by name of constructor", function() {
        expect(this.stateMachineSetup.classes.MainState).toEqual(MainState);
      });

      it("adds state to metaStates with constructor name", function() {
        expect(this.stateMachineSetup.metaStates[0].name).toEqual("MainState");
      });
    });

    describe("with explicit name given", function() {
      it("adds state to stateClasses by given name", function() {
        expect(this.stateMachineSetup.classes[explicitName]).toEqual(SecondState);
      });

      it("adds state to metaStates with given name", function() {
        expect(this.stateMachineSetup.metaStates[1].name).toEqual(explicitName);
      });
    });

    describe("with explicit intents", function() {
      it("adds given intents to meta state", function() {
        expect(this.stateMachineSetup.metaStates[1].intents).toEqual(explicitIntents);
      });
    });

    describe("without explicit intents", function() {
      it("derives intents from object methods correctly", function() {
        expect(this.stateMachineSetup.metaStates[0].intents).toEqual(implicitMainStateIntents);
      });
    });
  });

  describe("deriveStateIntents", function() {
    it("derives child intents corectly", function() {
      const expectation = implicitMainStateIntents.concat([GenericIntent.Help]) as string[];
      expect(StateMachineSetup.deriveStateIntents(SubState)).toEqual(expectation);
    });

    it("returns [] if given class prototype is undefined", function() {
      expect(StateMachineSetup.deriveStateIntents(MainState.prototype as any)).toEqual([]);
    });
  });
});
