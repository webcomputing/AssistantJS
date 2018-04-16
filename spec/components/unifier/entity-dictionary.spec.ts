import { createRequestScope } from "../../support/util/setup";

describe("EntityDictionary", function() {
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
});
