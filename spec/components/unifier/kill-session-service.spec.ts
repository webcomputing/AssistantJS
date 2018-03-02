import { createRequestScope } from "../../support/util/setup";
import { Session } from "../../../src/components/services/public-interfaces";
import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import { KillSessionService } from "../../../src/components/unifier/kill-session-service";
import { Hooks } from "inversify-components";

describe("KillSessionService", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);

    this.killSession = this.container.inversifyInstance.get("core:unifier:current-kill-session-promise");

    /** Sets some example session data */
    this.setSessionData = () => {
      this.currentSessionFactory = this.container.inversifyInstance.get("core:unifier:current-session-factory");
      let currentSession: Session = this.currentSessionFactory();

      return currentSession.set("testField", "testValue");
    };

    /** Gets the mock session data */
    this.getSessionData = () => {
      let currentSession: Session = this.currentSessionFactory();
      return currentSession.get("testField"); 
    }
  });

  it("is returnable from di container", function() {
    expect(typeof this.killSession).toBe("function");
  });

  it("evaluates to a promise", function() {
    expect(typeof this.killSession()["then"]).toBe("function");
  });

  it("has a preparable test", async function(done) {
    await this.setSessionData();
    let result = await this.getSessionData();
    expect(result).toEqual("testValue");
    done();
  });

  describe("with session data defined", function() {
    beforeEach(async function(done) {
      await this.setSessionData();
      done();
    });

    describe("without hooks", function() {

      it("deletes session data", async function(done) {
        await this.killSession();
        let result = await this.getSessionData();
        expect(result).toBeNull();
        done();
      });

    });

    describe("with a successful beforeKillSession hook", function() {
      beforeEach(function() {
        this.calledHooks = [];

        this.addHook = (componentInterface: symbol, hook: Hooks.Hook) => {
          this.container.inversifyInstance.bind(componentInterface).toFunction(hook);
        }

        this.checkIfHookCalled = (hook: symbol) => {
          return this.calledHooks.indexOf(hook) === -1;
        }
      });

      beforeEach(function() {
        this.successfulHookSymbol = Symbol();
        let successfulHook: Hooks.Hook = () => { 
          this.calledHooks.push(this.successfulHookSymbol);
          return true;
        };
        this.addHook(componentInterfaces.beforeKillSession, successfulHook)
      });

      describe("with a failing beforeKillSession hook", function() {

        beforeEach(function() {
          this.failingHookSymbol = Symbol();
          let failHooks: Hooks.Hook = () => { 
            this.calledHooks.push(this.failingHookSymbol);
            return false;
          };
          this.addHook(componentInterfaces.beforeKillSession, failHooks)
        });

        it("executes all beforeKillSession hooks", function() {
          expect(this.checkIfHookCalled(this.failingHookSymbol)).toBeTruthy();
          expect(this.checkIfHookCalled(this.successfulHookSymbol)).toBeTruthy();
        });

        it("deletes session data", async function(done) {
          await this.killSession();
          let result = await this.getSessionData();
          expect(result).toBe("testValue");
          done();
        });

        describe("with an afterKillSession hook", function() {
          beforeEach(function() {
            this.afterHookSymbol = Symbol();
            let afterHook: Hooks.Hook = () => { 
              this.calledHooks.push(this.afterHookSymbol);
              return true;
            };
            this.addHook(componentInterfaces.afterKillSession, afterHook)
          });

          it("is called", function() {
            expect(this.checkIfHookCalled(this.afterHookSymbol)).toBeTruthy();
          });
        });

      })

      it("deletes session data", async function(done) {
        await this.killSession();
        let result = await this.getSessionData();
        expect(result).toBeNull();
        done();
      });
    });
  });
});