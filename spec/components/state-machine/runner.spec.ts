import { Container } from "inversify-components";
import { componentInterfaces } from "../../../src/components/root/private-interfaces";
import { extraction } from "../../support/mocks/unifier/extraction";
import { createRequestScope } from "../../support/util/setup";

describe("Runner", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);

    this.stateMachine = (this.container as Container).inversifyInstance.get("core:state-machine:current-state-machine");
    spyOn(this.stateMachine, "handleIntent");

    this.runner = (this.container as Container).inversifyInstance.get(componentInterfaces.afterContextExtension);
  });

  describe("when there is an extraction result", function() {
    it("calls state machine", function() {
      this.runner.execute();
      expect(this.stateMachine.handleIntent).toHaveBeenCalled();
    });

    it("calls state machine with intent", function() {
      this.runner.execute();
      expect(this.stateMachine.handleIntent).toHaveBeenCalledWith(extraction.intent);
    });
  });

  describe("when there is no extraction result", function() {
    beforeEach(function() {
      this.runner.extraction = undefined;
    });

    it("does not call state machine", function() {
      this.runner.execute();
      expect(this.stateMachine.handleIntent).not.toHaveBeenCalled();
    });
  });
});
