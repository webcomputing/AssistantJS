import { Container } from "inversify-components";
import { StateMachine } from "../../../src/components/state-machine/state-machine";
import { injectionNames } from "../../../src/injection-names";
import { createRequestScope } from "../../helpers/scope";
import { createSpyHook, registerHook } from "../../support/mocks/state-machine/hook";
import { configureI18nLocale } from "../../support/util/i18n-configuration";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  stateMachine: StateMachine;
  stateSpyResult: any[];
  stateSpy: (...args: any[]) => void;
}

describe("StateMachine", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    configureI18nLocale(this.assistantJs.container, false);
    createRequestScope(this.specHelper);
    this.stateMachine = this.inversify.get(injectionNames.current.stateMachine);
  });

  describe("handleIntent", function() {
    beforeEach(function(this: CurrentThisContext) {
      this.stateSpyResult = [];
      this.stateSpy = (...args: any[]) => (this.stateSpyResult = args);
      this.inversify.bind("mocks:states:call-spy").toFunction(this.stateSpy);
    });

    it("always operates on current intent", async function() {
      await this.stateMachine.handleIntent("test");
      expect(this.stateSpyResult[0].constructor.name).toEqual("MainState");

      await this.stateMachine.transitionTo("SecondState");
      await this.stateMachine.handleIntent("test");
      expect(this.stateSpyResult[0].constructor.name).toEqual("SecondState");
    });

    it("adds state/intent combination to history", async function() {
      await this.stateMachine.handleIntent("test");
      expect(this.stateMachine.intentHistory).toEqual([{ stateName: "MainState", intentMethodName: "testIntent" }]);
    });

    describe("when given intent exists in state class", function() {
      describe("when given intent does not throw an error", function() {
        beforeEach(async function() {
          await this.stateMachine.handleIntent("test", "param1");
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

      describe("when given intent throws an exception", function() {
        describe("when there is an errorFallback method defined", function() {
          beforeEach(async function() {
            await this.stateMachine.handleIntent("error");
          });

          it("calls the fallback method", function() {
            expect(this.stateSpyResult[1]).toEqual("errorFallback");
          });

          it("passes correct arguments", function() {
            expect(this.stateSpyResult[2].constructor).toEqual(Error);
            expect(this.stateSpyResult[3].constructor.name).toEqual("MainState");
            expect(this.stateSpyResult[4]).toEqual("MainState");
            expect(this.stateSpyResult[5]).toEqual("errorIntent");
            expect(this.stateSpyResult[6]).toBe(this.stateMachine);
          });
        });

        describe("when there is no errorFallback method defined", function() {
          beforeEach(async function() {
            await this.stateMachine.transitionTo("SecondState");
          });

          it("throws an exception", async function() {
            try {
              await this.stateMachine.handleIntent("error");
            } catch (e) {
              expect(e).toBeDefined();
            }
          });
        });
      });
    });

    describe("when given intent does not exist in state class", function() {
      beforeEach(async function() {
        await this.stateMachine.handleIntent("notExisting", "param1");
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

      describe("when unhandledGenericIntent throws an exception", function() {
        describe("when there is an errorFallback method defined", function() {
          beforeEach(async function() {
            await this.stateMachine.transitionTo("UnhandledErrorWithFallbackState");
            await this.stateMachine.handleIntent("notExisting");
          });

          it("calls the fallback method", function() {
            expect(this.stateSpyResult[1]).toEqual("errorFallback");
          });

          it("passes correct arguments", function() {
            expect(this.stateSpyResult[2].constructor).toEqual(Error);
            expect(this.stateSpyResult[3].constructor.name).toEqual("UnhandledErrorWithFallbackState");
            expect(this.stateSpyResult[4]).toEqual("UnhandledErrorWithFallbackState");
            expect(this.stateSpyResult[5]).toEqual("unhandledGenericIntent");
            expect(this.stateSpyResult[6]).toEqual(this.stateMachine);
            expect(this.stateSpyResult[7]).toBe("notExistingIntent");
          });
        });

        describe("when there is no errorFallback method defined", function() {
          beforeEach(async function() {
            await this.stateMachine.transitionTo("UnhandledErrorState");
          });

          it("throws an exception", async function() {
            try {
              await this.stateMachine.handleIntent("notExisting");
            } catch (e) {
              expect(e).toBeDefined();
            }
          });
        });
      });
    });

    describe("with afterIntent hook given", function() {
      beforeEach(function() {
        this.spyResult = [];
        registerHook(this.assistantJs.container, false, createSpyHook(intent => this.spyResult.push(intent)));
      });

      describe("when given intent does not exist on state class", function() {
        beforeEach(async function() {
          await this.stateMachine.handleIntent("notExisting");
        });

        it("calls hook only once", function() {
          expect(this.spyResult.length).toEqual(1);
        });

        it("calls hook after executing unhandledGenericIntent", function() {
          expect(this.spyResult[0]).toEqual("unhandledGenericIntent");
        });
      });

      it("calls hook", async function() {
        await this.stateMachine.handleIntent("test");
        expect(this.spyResult[0]).toEqual("testIntent");
      });

      describe("with additional arguments", function() {
        beforeEach(function() {
          this.argsResult = [];
          registerHook(this.assistantJs.container, false, createSpyHook((intent, stateName, state, mode, machine, ...args) => this.argsResult.push(args)));
        });

        it("passes arguments to hook function", async function() {
          await this.stateMachine.handleIntent("test", "myFirstArgument", "mySecondArgument");
          expect(this.argsResult).toEqual([["myFirstArgument", "mySecondArgument"]]);
        });
      });
    });

    describe("with beforeIntent hooks given", function() {
      beforeEach(function() {
        this.spyResult = [];
        registerHook(this.assistantJs.container, true, createSpyHook(intent => this.spyResult.push(intent)));

        registerHook(this.assistantJs.container);
      });

      it("calls hook", async function() {
        await this.stateMachine.handleIntent("other");
        expect(this.spyResult[0]).toEqual("otherIntent");
      });

      it("allows hook to intercept execution of intent", async function() {
        await this.stateMachine.handleIntent("test");
        expect(this.stateSpyResult).toEqual([]);
      });

      describe("with additional arguments", function() {
        beforeEach(function() {
          this.argsResult = [];
          registerHook(this.assistantJs.container, true, createSpyHook((intent, stateName, state, mode, machine, ...args) => this.argsResult.push(args)));
        });

        it("passes arguments to hook function", async function() {
          await this.stateMachine.handleIntent("other", "myFirstArgument", "mySecondArgument");
          expect(this.argsResult).toEqual([["myFirstArgument", "mySecondArgument"]]);
        });
      });

      describe("when given intent does not exist", function() {
        beforeEach(async function() {
          await this.stateMachine.handleIntent("notExisting");
        });

        it("calls hook two times", function() {
          expect(this.spyResult.length).toEqual(2);
        });

        it("calls hook with unhandledGenericIntent", function() {
          expect(this.spyResult[1]).toEqual("unhandledGenericIntent");
        });

        it("calls hook with original intent", function() {
          expect(this.spyResult[0]).toEqual("notExistingIntent");
        });
      });
    });

    describe("with appending, non-instance-based mock spy", function() {
      beforeEach(function() {
        this.intentSpyResult = [];
        this.intentSpy = (...args: any[]) => this.intentSpyResult.push(args.slice(1));

        this.inversify.unbind("mocks:states:call-spy");
        this.inversify.bind("mocks:states:call-spy").toFunction(this.intentSpy);
      });

      describe("with beforeIntent_ method given", function() {
        beforeEach(async function() {
          await this.stateMachine.transitionTo("IntentCallbackState");
        });

        it("is called with given parameters", async function() {
          await this.stateMachine.handleIntent("okay", "param1");
          expect(this.intentSpyResult[0][0]).toEqual("beforeIntent_");
          expect(this.intentSpyResult[0][1]).toEqual("okayIntent");
          expect(this.intentSpyResult[0][2]).toEqual(this.stateMachine);
          expect(this.intentSpyResult[0][3]).toEqual("param1");
        });

        describe("when beforeIntent method returns false", function() {
          it("does not call intent", async function() {
            await this.stateMachine.handleIntent("notOkay");
            expect(this.intentSpyResult[0][0]).toEqual("beforeIntent_");
            expect(this.intentSpyResult.length).toBe(1);
          });
        });

        describe("when beforeIntent method returns true", function() {
          it("calls intent after beforeIntent_ call", async function() {
            await this.stateMachine.handleIntent("okay");
            expect(this.intentSpyResult[0][0]).toEqual("beforeIntent_");
            expect(this.intentSpyResult[1][0]).toEqual("okayIntent");
          });
        });

        describe("when beforeIntent does not return a boolean", function() {
          it("throws exception", function() {
            return this.stateMachine
              .handleIntent("illegal")
              .then(fail)
              .catch(e => expect(true).toBeTruthy());
          });
        });
      });

      describe("with afterIntent_ method given", function() {
        beforeEach(async function() {
          await this.stateMachine.transitionTo("IntentCallbackState");
          await this.stateMachine.handleIntent("okayIntent", "param1");
        });

        it("is called in a row with all arguments", function() {
          expect(this.intentSpyResult[0][0]).toEqual("beforeIntent_");
          expect(this.intentSpyResult[1][0]).toEqual("okayIntent");
          expect(this.intentSpyResult[2][0]).toEqual("afterIntent_");
          expect(this.intentSpyResult[2][1]).toEqual("okayIntent");
          expect(this.intentSpyResult[2][2]).toEqual(this.stateMachine);
          expect(this.intentSpyResult[2][3]).toEqual("param1");
        });
      });
    });
  });

  describe("transitionTo", function() {
    it("transitions to given state", async function() {
      await this.stateMachine.transitionTo("SecondState");
      const currentState = await this.stateMachine.getCurrentState();
      expect(currentState.name).toEqual("SecondState");
    });

    describe("when given state is not registered in state machine", function() {
      it("throws an exception", function() {
        expect(() => this.currentState.transitionTo("SubState")).toThrowError;
      });
    });
  });

  describe("redirectTo", function() {
    beforeEach(async function() {
      spyOn(this.stateMachine, "transitionTo");
      spyOn(this.stateMachine, "handleIntent");

      await this.stateMachine.redirectTo("SecondState", "test", "param1", "param2");
    });

    it("calls transitionTo with given state", function() {
      expect(this.stateMachine.transitionTo).toHaveBeenCalledWith("SecondState");
    });

    it("calls handleIntent with given intent and args", function() {
      expect(this.stateMachine.handleIntent).toHaveBeenCalledWith("test", "param1", "param2");
    });
  });

  describe("stateExists", function() {
    it("returns true for registered states", function() {
      expect(this.stateMachine.stateExists("MainState")).toBeTruthy;
    });

    it("returns false for not existing states", function() {
      expect(this.stateMachine.stateExists("NotExistingState")).toBeFalsy;
    });
  });
});
