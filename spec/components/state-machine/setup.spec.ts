import { GenericIntent } from "../../../src/components/unifier/public-interfaces";

import { StateMachineSetup } from "../../../src/components/state-machine/setup";
import { createRequestScope, createSpecHelper } from "../../support/util/setup";

import { MainState } from "../../support/mocks/states/main";
import { SecondState } from "../../support/mocks/states/second";
import { SubState } from "../../support/mocks/states/sub";

describe("StateMachineSetup", function() {
  const explicitIntents = ["test", GenericIntent.Yes, GenericIntent.No];
  const explicitName = "MySecondState";
  const implicitMainStateIntents = ["test", "answer", "other", GenericIntent.Yes, "error"];

  beforeEach(function() {
    this.specHelper = createSpecHelper(false);
    this.assistantJs = this.specHelper.setup;
    this.container = this.assistantJs.container;

    createRequestScope(this.specHelper);
    this.setup = new StateMachineSetup(this.assistantJs);
  });

  describe("addState", function() {
    beforeEach(function() {
      this.setup.addState(MainState);
      this.setup.addState(SecondState, explicitName, explicitIntents);
    });

    it("adds state to internal stateClasses", function() {
      expect(Object.keys(this.setup.stateClasses).length).toBe(2);
    });

    it("adds state to internal metaStates", function() {
      expect(this.setup.metaStates.length).toBe(2);
    });

    describe("without explicit name", function() {
      it("adds state to stateClases by name of constructor", function() {
        expect(this.setup.stateClasses.MainState).toEqual(MainState);
      });

      it("adds state to metaStates with constructor name", function() {
        expect(this.setup.metaStates[0].name).toEqual("MainState");
      });
    });

    describe("with explicit name given", function() {
      it("adds state to stateClasses by given name", function() {
        expect(this.setup.stateClasses[explicitName]).toEqual(SecondState);
      });

      it("adds state to metaStates with given name", function() {
        expect(this.setup.metaStates[1].name).toEqual(explicitName);
      });
    });

    describe("with explicit intents", function() {
      it("adds given intents to meta state", function() {
        expect(this.setup.metaStates[1].intents).toEqual(explicitIntents);
      });
    });

    describe("without explicit intents", function() {
      it("derives intents from object methods correctly", function() {
        expect(this.setup.metaStates[0].intents).toEqual(implicitMainStateIntents);
      });
    });
  });

  describe(".deriveStateIntents", function() {
    it("derives child intents corectly", function() {
      const expectation = implicitMainStateIntents.concat([GenericIntent.Help]) as string[];
      expect(StateMachineSetup.deriveStateIntents(SubState)).toEqual(expectation);
    });

    it("returns [] if given class prototype is undefined", function() {
      expect(StateMachineSetup.deriveStateIntents(MainState.prototype as any)).toEqual([]);
    });
  });
});
