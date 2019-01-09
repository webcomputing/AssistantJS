import { Container } from "inversify-components";
import { AfterContextExtension, AfterStateMachine, BeforeStateMachine, injectionNames } from "../../../src/assistant-source";
import { componentInterfaces as rootInterfaces } from "../../../src/components/root/private-interfaces";
import { componentInterfaces as stateMachineInterfaces } from "../../../src/components/state-machine/private-interfaces";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { extraction } from "../../support/mocks/unifier/extraction";
import { createRequestScope } from "../../support/util/setup";

interface CurrentThisContext {
  container: Container;
  specHelper: any;
  stateMachine: StateMachine;
  beforeStateMachineImpl: BeforeStateMachine;
  afterStateMachineImpl: AfterStateMachine;
  runner: AfterContextExtension;
}

describe("Runner", function() {
  beforeEach(function(this: CurrentThisContext) {
    createRequestScope(this.specHelper);

    this.beforeStateMachineImpl = {
      execute: () => {
        return;
      },
    };
    spyOn(this.beforeStateMachineImpl, "execute");
    this.container.inversifyInstance.bind(stateMachineInterfaces.beforeStateMachine).toConstantValue(this.beforeStateMachineImpl);

    this.afterStateMachineImpl = {
      execute: () => {
        return;
      },
    };
    spyOn(this.afterStateMachineImpl, "execute");
    this.container.inversifyInstance.bind(stateMachineInterfaces.afterStateMachine).toConstantValue(this.afterStateMachineImpl);

    this.stateMachine = this.container.inversifyInstance.get(injectionNames.current.stateMachine);
    spyOn(this.stateMachine, "handleIntent");

    this.runner = this.container.inversifyInstance.get(rootInterfaces.afterContextExtension);
  });

  describe("when there is an extraction result", function() {
    it("calls state machine", async function() {
      await this.runner.execute();
      expect(this.stateMachine.handleIntent).toHaveBeenCalled();
    });

    it("calls state machine with intent", async function() {
      await this.runner.execute();
      expect(this.stateMachine.handleIntent).toHaveBeenCalledWith(extraction.intent);
    });

    describe("with BeforeStateMachine", function() {
      it("does call BeforeStateMachine", async function(this: CurrentThisContext) {
        await this.runner.execute();
        expect(this.beforeStateMachineImpl.execute).toHaveBeenCalled();
      });
    });

    describe("with AfterStateMachine", function() {
      it("does call AfterStateMachine", async function(this: CurrentThisContext) {
        await this.runner.execute();
        expect(this.afterStateMachineImpl.execute).toHaveBeenCalled();
      });
    });
  });

  describe("when there is no extraction result", function() {
    beforeEach(function() {
      this.runner.extraction = undefined;
    });

    it("does not call state machine", async function() {
      await this.runner.execute();
      expect(this.stateMachine.handleIntent).not.toHaveBeenCalled();
    });

    describe("with BeforeStateMachine", function() {
      it("does not call BeforeStateMachine", async function(this: CurrentThisContext) {
        await this.runner.execute();
        expect(this.beforeStateMachineImpl.execute).not.toHaveBeenCalled();
      });
    });

    describe("with AfterStateMachine", function() {
      it("does not call AfterStateMachine", async function(this: CurrentThisContext) {
        await this.runner.execute();
        expect(this.afterStateMachineImpl.execute).not.toHaveBeenCalled();
      });
    });
  });
});
