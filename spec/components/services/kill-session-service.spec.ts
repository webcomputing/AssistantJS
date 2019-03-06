import { Hooks } from "inversify-components";
import { KillSessionService } from "../../../src/components/services/kill-session-service";
import { componentInterfaces } from "../../../src/components/services/private-interfaces";
import { Session, SessionFactory } from "../../../src/components/services/public-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { createRequestScope } from "../../helpers/scope";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  setSessionData: () => void;
  getSessionData: () => void;
  currentSessionFactory: () => Session;
  killSession: KillSessionService;
}

describe("KillSessionService", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    createRequestScope(this.specHelper);

    this.killSession = this.inversify.get(injectionNames.current.killSessionService);

    /** Sets some example session data */
    this.setSessionData = () => {
      this.currentSessionFactory = this.inversify.get(injectionNames.current.sessionFactory);
      const currentSession: Session = this.currentSessionFactory();

      return currentSession.set("testField", "testValue");
    };

    /** Gets the mock session data */
    this.getSessionData = () => {
      const currentSession: Session = this.currentSessionFactory();
      return currentSession.get("testField");
    };
  });

  it("is returnable from di container", function() {
    expect(typeof this.killSession).toBe("function");
  });

  it("evaluates to a promise", function() {
    expect(typeof this.killSession().then).toBe("function");
  });

  it("has a preparable test", async function(done) {
    await this.setSessionData();
    const result = await this.getSessionData();
    expect(result).toEqual("testValue");
    done();
  });

  describe("with session data defined", function() {
    beforeEach(async function(this: CurrentThisContext) {
      await this.setSessionData();
    });

    describe("without hooks", function() {
      it("deletes session data", async function() {
        await this.killSession();
        const result = await this.getSessionData();
        expect(result).toBeUndefined();
      });
    });

    describe("with a successful beforeKillSession hook", function() {
      beforeEach(function() {
        this.calledHooks = [];

        this.addHook = (componentInterface: symbol, hook: Hooks.Hook) => {
          this.inversify.bind(componentInterface).toFunction(hook);
        };

        this.checkIfHookCalled = (hook: symbol) => {
          return this.calledHooks.indexOf(hook) === -1;
        };
      });

      beforeEach(function() {
        this.successfulHookSymbol = Symbol();
        const successfulHook: Hooks.Hook = () => {
          this.calledHooks.push(this.successfulHookSymbol);
          return true;
        };
        this.addHook(componentInterfaces.beforeKillSession, successfulHook);
      });

      describe("with a failing beforeKillSession hook", function() {
        beforeEach(function() {
          this.failingHookSymbol = Symbol();
          const failHooks: Hooks.Hook = () => {
            this.calledHooks.push(this.failingHookSymbol);
            return false;
          };
          this.addHook(componentInterfaces.beforeKillSession, failHooks);
        });

        it("executes all beforeKillSession hooks", function() {
          expect(this.checkIfHookCalled(this.failingHookSymbol)).toBeTruthy();
          expect(this.checkIfHookCalled(this.successfulHookSymbol)).toBeTruthy();
        });

        it("deletes session data", async function(done) {
          await this.killSession();
          const result = await this.getSessionData();
          expect(result).toBe("testValue");
          done();
        });

        describe("with an afterKillSession hook", function() {
          beforeEach(function() {
            this.afterHookSymbol = Symbol();
            const afterHook: Hooks.Hook = () => {
              this.calledHooks.push(this.afterHookSymbol);
              return true;
            };
            this.addHook(componentInterfaces.afterKillSession, afterHook);
          });

          it("is called", function() {
            expect(this.checkIfHookCalled(this.afterHookSymbol)).toBeTruthy();
          });
        });
      });

      it("deletes session data", async function(done) {
        await this.killSession();
        const result = await this.getSessionData();
        expect(result).toBeUndefined();
        done();
      });
    });
  });
});
