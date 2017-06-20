import { createRequestScope } from "../../support/util/setup";
import { DestroyableSession } from "../../../src/components/services/interfaces";
import { componentInterfaces } from "../../../src/components/unifier/interfaces";
import { SessionEndedCallback } from "../../../src/components/unifier/session-ended-callback";

describe("SessionEndedCallback", function() {
  beforeEach(function() {
    createRequestScope(this.specHelper);

    this.callback = this.container.inversifyInstance.get(componentInterfaces.sessionEndedCallback);
  });

  it("is returnable from di container", function() {
    expect(this.callback.constructor).toEqual(SessionEndedCallback);
  });

  describe("with session data defined", function() {
    beforeEach(async function(done) {
      this.currentSessionFactory = this.container.inversifyInstance.get("core:unifier:current-session-factory");
      let currentSession: DestroyableSession = this.currentSessionFactory();

      await currentSession.set("testField", "testValue");
      done();
    });

    describe("exeucte", function() {
      it("deletes session data", async function(done) {
        let currentSession: DestroyableSession = this.currentSessionFactory();
        let result = await currentSession.get("testField"); 
        expect(result).toEqual("testValue");

        await this.callback.execute();
        
        result = await currentSession.get("testField");
        expect(result).toBeNull();
        done();
      });
    });
  });
});