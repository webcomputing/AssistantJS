import { EntityDictionary } from "../../../src/components/unifier/public-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { createRequestScope } from "../../helpers/scope";
import { LocalesLoaderMock } from "../../support/mocks/unifier/mock-locale-loader";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  createExtraction(entities: { [name: string]: any });
  getEntityDictionary(): EntityDictionary;
}

describe("EntityDictionary", function() {
  beforeAll(function(this: CurrentThisContext) {
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

  beforeEach(async function(this: CurrentThisContext) {
    this.getEntityDictionary = () => this.inversify.get(injectionNames.current.entityDictionary);
  });

  describe("injection in request scope", function() {
    beforeEach(function(this: CurrentThisContext) {
      this.specHelper.prepareSpec(this.defaultSpecOptions);
      createRequestScope(this.specHelper);
    });

    it("lives as singleton", function() {
      // This is important: That way, states (including promptstates) can add entities, which are readable in follow-up-states
      const instance1 = this.inversify.get(injectionNames.current.entityDictionary);
      instance1.set("myEntity123", "321");

      const instance2 = this.inversify.get(injectionNames.current.entityDictionary);
      expect(instance2.get("myEntity123")).toEqual("321");
    });

    describe("levenshtein", function() {
      beforeEach(function() {
        this.distanceSet = ["yourEntity", "hisEntity"];
        this.upperCaseDistanceSet = ["MyEntity", "YourEntity", "HisEntity"];
        this.entities = this.inversify.get(injectionNames.current.entityDictionary);
        this.entities.set("myEntity", "myEntity");
      });

      describe("#getDistanceSet", function() {
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

      describe("#getClosest", function() {
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

  describe("#getRaw", function() {
    describe("for numbers in store", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.specHelper.prepareSpec(this.defaultSpecOptions);
        createRequestScope(
          this.specHelper,
          this.createExtraction({
            numberKey: 1234,
          })
        );
      });

      it("casts value to string", async function(this: CurrentThisContext) {
        expect(this.getEntityDictionary().getRaw("numberKey")).toEqual("1234");
      });
    });

    describe("for null values in store", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.specHelper.prepareSpec(this.defaultSpecOptions);
        createRequestScope(
          this.specHelper,
          this.createExtraction({
            nullValue: null,
          })
        );
      });

      it("casts them to undefined", async function(this: CurrentThisContext) {
        expect(this.getEntityDictionary().getRaw("nullValue")).toBeUndefined();
      });
    });

    describe("for everything else", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.specHelper.prepareSpec(this.defaultSpecOptions);
        createRequestScope(
          this.specHelper,
          this.createExtraction({
            complexObject: ["a", "b"],
          })
        );
      });

      it("returns raw store value", async function(this: CurrentThisContext) {
        expect(this.getEntityDictionary().getRaw("complexObject")).toEqual(["a", "b"] as any);
      });
    });
  });

  describe("#get", function() {
    describe("regarding custom entities", function() {
      beforeEach(function(this: CurrentThisContext) {
        this.specHelper.prepareSpec(this.defaultSpecOptions);
        this.inversify.unbind(injectionNames.localesLoader);
        this.inversify.bind(injectionNames.localesLoader).to(LocalesLoaderMock);
      });

      describe("if custom entity is not present", function() {
        beforeEach(function(this: CurrentThisContext) {
          createRequestScope(this.specHelper);
        });

        it("returns undefined", function(this: CurrentThisContext) {
          expect(this.getEntityDictionary().get("color")).toBeUndefined();
        });
      });

      describe("extraction contains exact reference value", function() {
        beforeEach(function(this: CurrentThisContext) {
          createRequestScope(
            this.specHelper,
            this.createExtraction({
              color: "red",
            })
          );
        });

        it("returns the correct reference value", function(this: CurrentThisContext) {
          expect(this.getEntityDictionary().get("color")).toBe("red");
        });
      });

      describe("extraction contains exact synonym", function() {
        beforeEach(function(this: CurrentThisContext) {
          createRequestScope(
            this.specHelper,
            this.createExtraction({
              color: "corn",
            })
          );
        });

        it("returns the correct reference value", function(this: CurrentThisContext) {
          expect(this.getEntityDictionary().get("color")).toBe("yellow");
        });
      });

      describe("extraction contains similar synonym", function() {
        beforeEach(function(this: CurrentThisContext) {
          createRequestScope(
            this.specHelper,
            this.createExtraction({
              color: "scarlet",
            })
          );
        });

        it("returns the correct reference value", function(this: CurrentThisContext) {
          expect(this.getEntityDictionary().get("color")).toBe("red");
        });
      });

      describe("extraction contains unsupported synonym or entity variation", function() {
        beforeEach(function(this: CurrentThisContext) {
          createRequestScope(
            this.specHelper,
            this.createExtraction({
              color: "ferrari",
            })
          );
        });

        it("returns an unexpected value", function(this: CurrentThisContext) {
          expect(this.getEntityDictionary().get("color")).toBe("green");
        });

        it("also gives access to raw entity value", function(this: CurrentThisContext) {
          expect(this.getEntityDictionary().getRaw("color")).toBe("ferrari");
        });
      });
    });
  });
});
