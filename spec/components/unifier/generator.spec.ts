import { doesNotReject } from "assert";
import * as fs from "fs";
import { injectable } from "inversify";
import { Generator } from "../../../src/components/unifier/generator";
import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import { GenericIntent, PlatformGenerator } from "../../../src/components/unifier/public-interfaces";
import { AssistantJSSetup } from "../../../src/setup";
import { deleteFolderRecursive } from "../../support/mocks/util/fs-utils";
import { ThisContext } from "../../this-context";
interface CurrentThisContext extends ThisContext {
  assistantJs: AssistantJSSetup;
  generator: Generator;
  generatorExtension: PlatformGenerator.Extension[];
  buildDir: string;
  rootDir: string;
  language: string;
  intents: Array<string | GenericIntent.Unanswered>;
  expectedUtteranceMapping: { [key: string]: string[] };
  expectedEntities: {}; // { [key: string]: string[] };
  expectedEntityMapping: { [key: string]: string };
  utterances: { [key: string]: string[] };
  entities: { [key: string]: Array<{ [key: string]: string[] | string | { [key: string]: string[] | string } }> | string[] | string };
  entityMapping: PlatformGenerator.EntityMapping;
  utteranceTemplateService: { [intent: string]: string[] };
}
const cwd = process.cwd();

const setupGenerator = async function(this: CurrentThisContext, fileType: "js" | "json", isCompiled: boolean) {
  await this.specHelper.internalSpecHelpers.generator.setup.bind(this)(fileType, isCompiled);

  // Bind EntityMapping mock
  this.container.inversifyInstance
    .bind(componentInterfaces.utteranceTemplateService)
    .toDynamicValue(() => {
      return {
        getUtterancesFor: (language: string) => {
          return this.utteranceTemplateService;
        },
      };
    })
    .inSingletonScope();

  // Bind PlatformGenerator mock
  this.container.inversifyInstance
    .bind(componentInterfaces.platformGenerator)
    .toDynamicValue(() => {
      return {
        execute: jasmine.createSpy("executePlatformGenerator").and.returnValue(Promise.resolve()),
      };
    })
    .inSingletonScope();

  // Bind Generator as a global service
  if (this.container.inversifyInstance.isBound("generator")) {
    this.container.inversifyInstance.unbind("generator");
  }
  this.container.inversifyInstance.bind<Generator>("generator").to(Generator);
  this.generator = this.container.inversifyInstance.get<Generator>("generator");
  this.generatorExtension = this.container.inversifyInstance.getAll<PlatformGenerator.Extension>(componentInterfaces.platformGenerator);
};

const isBehaveLikeAGenerator = (fileType: "js" | "json", isCompiled: boolean = true) => {
  describe(`isBehaveLikeAGenerator`, function() {
    beforeEach(async function(this: CurrentThisContext) {
      await setupGenerator.bind(this)(fileType, isCompiled);
      await this.generator.execute(this.buildDir);
    });

    it("has creaded a build directory for each language in the buildDirectory", async function(this: CurrentThisContext) {
      expect(fs.existsSync(`${this.buildDir}/${this.language}`)).toBeTruthy();
    });

    it("execute binded PlatformGenerator", async function(this: CurrentThisContext) {
      expect(this.generatorExtension[0].execute).toHaveBeenCalled();
    });

    it("execute binded PlatformGenerator with params", async function(this: CurrentThisContext) {
      expect(this.generatorExtension[0].execute).toHaveBeenCalledWith(
        this.language,
        `${this.buildDir}/${this.language}`,
        this.intents.map(intent => {
          return {
            intent,
            entities: this.expectedEntities && this.expectedEntities[`${intent}Intent`] ? this.expectedEntities[`${intent}Intent`] : [],
            utterances:
              this.expectedUtteranceMapping && this.expectedUtteranceMapping[`${intent}Intent`]
                ? this.expectedUtteranceMapping[`${intent}Intent`]
                : this.utterances && this.utterances[`${intent}Intent`]
                ? this.utterances[`${intent}Intent`]
                : [],
          };
        }),
        this.expectedEntityMapping || {},
        this.entities
      );
    });
  });
};

describe("Generator", function() {
  [true, false].forEach(function(isCompiled: boolean) {
    describe(`${isCompiled ? "with" : "without"} compiled template files`, function() {
      beforeAll(function() {
        this.rootDir = __dirname.replace("spec/components/unifier", ``);
        if (isCompiled) {
          this.rootDir += "/js";
          fs.mkdirSync(this.rootDir);
          process.cwd = () => cwd + "/js";
        }
        this.rootDir += "/tmp";
        deleteFolderRecursive(this.rootDir);
        fs.mkdirSync(this.rootDir);
      });

      afterAll(function() {
        deleteFolderRecursive(this.rootDir);
      });

      beforeEach(function(this: CurrentThisContext) {
        this.language = "en";
        this.entities = {};
        this.utteranceTemplateService = {};
        this.assistantJs.configureComponent("core:unifier", {
          entities: {},
        });
      });

      // Execute all specs for generated js and json files
      (["js", "json"] as Array<"js" | "json">).forEach((fileType: "js" | "json") => {
        describe(`#execute with generated enteties and utterances files of type='${fileType}'`, function() {
          describe("when single intent and an utterance without entity is registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that correct?"],
              };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when multiple intents and utterances without entity are registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that correct?"],
                wellDoneIntent: ["Cool", "Well Done"],
              };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when a single intent and a single utterance with a template literal of two options is registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that {correct|right}?"],
              };

              this.expectedUtteranceMapping = { okayIntent: ["Is that correct?", "Is that right?"] };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when a single intent without utterances is registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.intents = ["okay"];
              this.utterances = {
                okayIntent: undefined,
              } as any;

              this.expectedUtteranceMapping = { okayIntent: [] };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when a single intent and a single utterance, which contains a listed entity value, is registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.assistantJs.configureComponent("core:unifier", {
                entities: {
                  ENTITIES_TYPE: ["correct"],
                },
              });

              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that {{correct}}"],
              };

              this.entities = {
                ENTITIES_TYPE: [{ value: "correct" }],
              };

              // this.entityMapping = {
              //   ENTITIES_TYPE: "@ENTITIES_TYPE",
              // };

              this.expectedEntities = { okayIntent: ["correct"] };
              this.expectedEntityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
              this.expectedUtteranceMapping = { okayIntent: ["Is that {{correct|correct}}"] };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when a single intent and a single utterance, which contains a listed entity synonym, is registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.assistantJs.configureComponent("core:unifier", {
                entities: {
                  ENTITIES_TYPE: ["correct"],
                },
              });

              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that {{correct}}"],
              };

              this.entities = {
                ENTITIES_TYPE: [{ value: "correct", synonyms: ["right"] }],
              };

              this.expectedEntities = { okayIntent: ["correct"] };
              this.expectedEntityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
              this.expectedUtteranceMapping = { okayIntent: ["Is that {{right|correct}}", "Is that {{correct|correct}}"] };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when a single intent and multiple utterances, which contains a listed entity, are registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.assistantJs.configureComponent("core:unifier", {
                entities: {
                  ENTITIES_TYPE1: ["type1"],
                  ENTITIES_TYPE2: ["type2"],
                },
              });

              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that {{type1}}", "Is that {{type2}}"],
              };

              this.expectedEntities = { okayIntent: ["type1", "type2"] };
              this.expectedEntityMapping = {
                type1: "ENTITIES_TYPE1",
                ENTITIES_TYPE1: "ENTITIES_TYPE1",
                type2: "ENTITIES_TYPE2",
                ENTITIES_TYPE2: "ENTITIES_TYPE2",
              };
              this.expectedUtteranceMapping = { okayIntent: ["Is that {{type1}}", "Is that {{type2}}"] };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when a single intent and utterances from template service, which contains listed entity, are registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.assistantJs.configureComponent("core:unifier", {
                entities: {
                  ENTITIES_TYPE1: ["type1"],
                  ENTITIES_TYPE2: ["type2"],
                },
              });

              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that {{type1}}", "Is that {{type2}}"],
              };

              this.utteranceTemplateService = { okayIntent: ["Is that realy {{type1}}"] };

              this.expectedEntities = { okayIntent: ["type1", "type2"] };
              this.expectedEntityMapping = {
                type1: "ENTITIES_TYPE1",
                ENTITIES_TYPE1: "ENTITIES_TYPE1",
                type2: "ENTITIES_TYPE2",
                ENTITIES_TYPE2: "ENTITIES_TYPE2",
              };

              this.expectedUtteranceMapping = { okayIntent: [...this.utterances.okayIntent, ...this.utteranceTemplateService.okayIntent] };
            });

            isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
          });

          describe("when a single intent and a single utterances, which contains an unlisted entity, are registered", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.assistantJs.configureComponent("core:unifier", {
                entities: {
                  ENTITIES_TYPE: ["ENTITIES_TYPE"],
                },
              });

              this.intents = ["okay"];
              this.utterances = {
                okayIntent: ["Is that {{correct}}"],
              };

              await setupGenerator.bind(this)(fileType, isCompiled);
            });

            it("throw an 'Unknown entity' error", async function(this: CurrentThisContext) {
              try {
                await this.generator.execute(this.buildDir);
                fail("Missing exeption 'Unknown entity'");
              } catch (e) {
                expect(e.message).toEqual(
                  `Unknown entity 'correct' found in utterances of intent 'okay'. \nEither you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. Your configured entity mappings are: ["ENTITIES_TYPE"]`
                );
              }
            });
          });
        });

        describe("when a single Unanswered GenericIntent is registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.intents = [GenericIntent.Unanswered];
            this.utterances = {};
          });

          isBehaveLikeAGenerator.bind(this)(fileType, isCompiled);
        });
      });
    });
  });
});
