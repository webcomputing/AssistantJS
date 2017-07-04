import { createRequestScope } from "../../support/util/setup";

describe("EntityDictionary", function() {
  describe("injection in request scope", function() {
    beforeEach(function() {
      createRequestScope(this.specHelper);
    });

    it("lives as singleton", function() {
      // This is important: That way, states (including promptstates) can add entities, which are readable in follow-up-states
      let instance1 = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
      instance1.set("myEntity123", "321");

      let instance2 = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
      expect(instance2.get("myEntity123")).toEqual("321");
    })
  })
});