import { createRequestScope } from "../../support/util/setup";
import { registerHook, createSpyHook } from "../../support/mocks/state-machine/hook";
import { Container } from "ioc-container";

describe("StateMachine", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);
    this.stateMachine = this.container.inversifyInstance.get("core:state-machine:current-state-machine");
  });

  describe("handleIntent", function() {
    beforeEach(function() {
      this.stateSpyResult = [];
      this.stateSpy = (...args: any[]) => this.stateSpyResult = args;
      (this.container as Container).inversifyInstance.bind("mocks:states:call-spy").toFunction(this.stateSpy);
    })

    it("always operates on current intent", async function(done) {
      await this.stateMachine.handleIntent("test");
      expect(this.stateSpyResult[0].constructor.name).toEqual("MainState");

      await this.stateMachine.transitionTo("SecondState");
      await this.stateMachine.handleIntent("test");
      expect(this.stateSpyResult[0].constructor.name).toEqual("SecondState");

      done();
    })

    describe("when given intent exists in state class", function() {
      beforeEach(async function(done) {
        await this.stateMachine.handleIntent("test", "param1");
        done();
      });

      it("calls the given intent", function() {
        expect(this.stateSpyResult[1]).toEqual("test");
      });

      it("gives state machine as parameter", function() {
        expect(this.stateSpyResult[2]).toEqual(this.stateMachine);
      });

      it("gives additional given arguments as parameter", function() {
        expect(this.stateSpyResult[3]).toEqual("param1");
      });
    });

    describe("when given intent does not exist in state class", function() {
      beforeEach(async function(done) {
        await this.stateMachine.handleIntent("notExisting", "param1");
        done();
      });

      it("calls unhandled intent", function() {
        expect(this.stateSpyResult[1]).toEqual("unhandled");
      });

      it("adds original intent as parameter", function() {
        expect(this.stateSpyResult[3]).toEqual("notExistingIntent");
      });

      it("gives state machine as parameter", function() {
        expect(this.stateSpyResult[2]).toEqual(this.stateMachine);
      });

      it("gives additional given arguments as parameter", function() {
        expect(this.stateSpyResult[4]).toEqual("param1");
      });
    });

    describe("with afterIntent hook given", function() {
      beforeEach(function() {
        this.spyResult = [];
        registerHook(this.container, false, createSpyHook(intent => this.spyResult.push(intent)));
      });

      describe("when given intent does not exist on state class", function() {
        beforeEach(async function(done) {
          await this.stateMachine.handleIntent("notExisting");
          done();
        });

        it("calls hook only once", function() {
          expect(this.spyResult.length).toEqual(1);
        });

        it("calls hook after executing unhandledIntent", function() {
          expect(this.spyResult[0]).toEqual("unhandledIntent");
        })
      });

      it("calls hook", async function(done) {
        await this.stateMachine.handleIntent("test");
        expect(this.spyResult[0]).toEqual("testIntent");
        done();
      });
    });

    describe("with beforeIntent hooks given", function() {
      beforeEach(function() {
        this.spyResult = [];
        registerHook(this.container, true, createSpyHook(intent => this.spyResult.push(intent)));

        registerHook(this.container);
      });

      it("calls hook", async function(done) {
        await this.stateMachine.handleIntent("other");
        expect(this.spyResult[0]).toEqual("otherIntent");
        done();
      });

      it("allows hook to intercept execution of intent", async function(done) {
        await this.stateMachine.handleIntent("test");
        expect(this.stateSpyResult).toEqual([]);
        done();
      });

      describe("when given intent does not exist", function() {
        beforeEach(async function(done) {
          await this.stateMachine.handleIntent("notExisting");
          done();
        });

        it("calls hook two times", function() {
          expect(this.spyResult.length).toEqual(2);
        })

        it("calls hook with unhandledIntent", function() {
          expect(this.spyResult[1]).toEqual("unhandledIntent");
        });

        it("calls hook with original intent", function() {
          expect(this.spyResult[0]).toEqual("notExistingIntent");
        });
      });
    });
  });

  describe("transitionTo", function() {
    it("transitions to given state", async function() {
      await this.stateMachine.transitionTo("SecondState");
      let currentState = await this.stateMachine.getCurrentState();
      expect(currentState.name).toEqual("SecondState");
    });

    describe("when given state is not registered in state machine", function() {
      it("throws an exception", function() {
        expect(() => this.currentState.transitionTo("SubState")).toThrowError();
      });
    })
  });

  describe("redirectTo", function() {
    beforeEach(async function(done) {
      spyOn(this.stateMachine, "transitionTo");
      spyOn(this.stateMachine, "handleIntent");

      await this.stateMachine.redirectTo("SecondState", "test", "param1", "param2");
      done();
    });

    it("calls transitionTo with given state", function() {
      expect(this.stateMachine.transitionTo).toHaveBeenCalledWith("SecondState");
    });

    it("calls handleIntent with given intent and args", function() {
      expect(this.stateMachine.handleIntent).toHaveBeenCalledWith("test", "param1", "param2");
    });
  });
});