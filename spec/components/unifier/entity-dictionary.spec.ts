import { EntityDictionary } from "../../../src/components/unifier/public-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { LocalesLoaderMock } from "../../support/mocks/unifier/mock-locale-loader";
import { createRequestScope } from "../../support/util/setup";
import { ThisContext } from "../../this-context";

interface MyThisContext extends ThisContext {
  createExtraction(entities: { [name: string]: any });
}

describe("EntityDictionary", function() {
  beforeAll(function(this: MyThisContext) {
    this.createExtraction = function(entities) {
      return {
        entities,
        intent: "testIntent",
        language: "en",
        platform: "custom",
        sessionID: "any",
      };
    };
  });

  describe("injection in request scope", function() {
    beforeEach(function() {
      createRequestScope(this.specHelper);
    });

    it("lives as singleton", function() {
      // This is important: That way, states (including promptstates) can add entities, which are readable in follow-up-states
      const instance1 = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
      instance1.set("myEntity123", "321");

      const instance2 = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
      expect(instance2.get("myEntity123")).toEqual("321");
    });

    describe("levenshtein", function() {
      beforeEach(function() {
        this.distanceSet = ["yourEntity", "hisEntity"];
        this.upperCaseDistanceSet = ["MyEntity", "YourEntity", "HisEntity"];
        this.entities = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
        this.entities.set("myEntity", "myEntity");
      });

      describe("getDistanceSet", function() {
        describe("if entity is not present", function() {
          it("returns undefined", function() {
            expect(this.entities.getDistanceSet("notExisting", this.distanceSet)).toBeUndefined();
          });
        });

        it("returns set containing all distances from validValues", function() {
          expect(this.entities.getDistanceSet("myEntity", this.distanceSet)).toEqual([
            { value: "yourEntity", distance: 4 },
            { value: "hisEntity", distance: 3 },
          ]);
        });

        it("returns set containing all distances from upperCaseSet", function() {
          expect(this.entities.getDistanceSet("myEntity", this.upperCaseDistanceSet)).toEqual([
            { value: "MyEntity", distance: 0 },
            { value: "YourEntity", distance: 4 },
            { value: "HisEntity", distance: 3 },
          ]);
        });
      });

      describe("getClosest", function() {
        describe("if entity is not present", function() {
          it("returns undefined", function() {
            expect(this.entities.getClosest("notExisting", this.distanceSet)).toBeUndefined();
          });
        });

        describe("with case-insensitivity", function() {
          it("gets exact match", function() {
            expect(this.entities.getClosest("myEntity", this.upperCaseDistanceSet)).toBe("MyEntity");
          });
        });

        describe("with maxDistance undefined", function() {
          it("returns closest match", function() {
            expect(this.entities.getClosest("myEntity", this.distanceSet)).toBe("hisEntity");
          });
        });

        describe("with maxDistance defined", function() {
          describe("with closest entity's distance > maxDistance", function() {
            it("returns undefined", function() {
              expect(this.entities.getClosest("myEntity", this.distanceSet, 2)).toBeUndefined();
            });
          });

          describe("with closest entity's distance === maxDistance", function() {
            it("returns closest match", function() {
              expect(this.entities.getClosest("myEntity", this.distanceSet, 3)).toBe("hisEntity");
            });
          });
        });
      });
    });
  });

  describe("get custom entities", function() {
    beforeEach(function(this: MyThisContext) {
      this.container.inversifyInstance.unbind(injectionNames.localesLoader);
      this.container.inversifyInstance.bind(injectionNames.localesLoader).to(LocalesLoaderMock);
    });

    describe("extraction contains exact reference value", function() {
      beforeEach(function(this: MyThisContext) {
        createRequestScope(
          this.specHelper,
          this.createExtraction({
            color: "red",
          })
        );
      });

      it("returns the correct reference value", function() {
        const entities: EntityDictionary = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
        expect(entities.get("color")).toBe("red");
      });
    });

    describe("extraction contains exact synonym", function() {
      beforeEach(function(this: MyThisContext) {
        createRequestScope(
          this.specHelper,
          this.createExtraction({
            color: "corn",
          })
        );
      });

      it("returns the correct reference value", function() {
        const entities: EntityDictionary = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
        expect(entities.get("color")).toBe("yellow");
      });
    });

    describe("extraction contains similar synonym", function() {
      beforeEach(function(this: MyThisContext) {
        createRequestScope(
          this.specHelper,
          this.createExtraction({
            color: "scarlet",
          })
        );
      });

      it("returns the correct reference value", function() {
        const entities: EntityDictionary = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
        expect(entities.get("color")).toBe("red");
      });
    });

    describe("extraction contains unsupported synonym or entity variation", function() {
      beforeEach(function(this: MyThisContext) {
        createRequestScope(
          this.specHelper,
          this.createExtraction({
            color: "ferrari",
          })
        );
      });

      it("returns an unexpected value", function() {
        const entities: EntityDictionary = this.container.inversifyInstance.get("core:unifier:current-entity-dictionary");
        expect(entities.get("color")).toBe("green");
      });
    });
  });
});
