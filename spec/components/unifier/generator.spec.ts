import * as fs from "fs";
import { Generator } from "../../../src/components/unifier/generator";
import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import { GenericIntent, PlatformGenerator } from "../../../src/components/unifier/public-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { AssistantJSSetup } from "../../../src/setup";
import { deleteFolderRecursive } from "../../support/mocks/util/fs-utils";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  assistantJs: AssistantJSSetup;
  generator: Generator;
  generatorExtension: PlatformGenerator.Extension[];
  buildDir: string;
  rootDir: string;
  language: string[];
  intents: Array<string | GenericIntent.Unanswered>;
  expectedUtteranceMapping: { [language: string]: { [key: string]: string[] } };
  expectedEntities: { [language: string]: { [key: string]: string[] } };
  expectedEntityMapping: { [key: string]: string };
  utterances: { [language: string]: { [key: string]: string[] } };
  entities: { [language: string]: { [key: string]: Array<{ [key: string]: string[] | string | { [key: string]: string[] | string } }> | string[] | string } };
  entityMapping: PlatformGenerator.EntityMapping;
  utteranceTemplateService: { [language: string]: { [intent: string]: string[] } };
}

const setupGenerator = async function(this: CurrentThisContext) {
  // Register utterancePath
  this.assistantJs.configureComponent("core:unifier", {
    utterancePath: `${this.buildDir}/config`,
  });

  // Register mock intents
  this.container.inversifyInstance.unbind("core:state-machine:used-intents");
  this.container.inversifyInstance.bind("core:state-machine:used-intents").toDynamicValue(() => {
    return this.intents;
  });

  // Register mock utterances and entities
  this.container.inversifyInstance.unbind(injectionNames.localesLoader);
  this.container.inversifyInstance
    .bind(injectionNames.localesLoader)
    .toDynamicValue(() => {
      return {
        getUtteranceTemplates: () => {
          return this.utterances;
        },
        getCustomEntities: () => {
          return this.entities;
        },
      };
    })
    .inSingletonScope();

  // Register mock utterance tempate service
  this.container.inversifyInstance
    .bind(componentInterfaces.utteranceTemplateService)
    .toDynamicValue(() => {
      return {
        getUtterancesFor: (language: string) => {
          return this.utteranceTemplateService[language] || {};
        },
      };
    })
    .inSingletonScope();

  // Register PlatformGenerator mock
  this.container.inversifyInstance
    .bind(componentInterfaces.platformGenerator)
    .toDynamicValue(() => {
      return {
        execute: jasmine.createSpy("executePlatformGenerator"),
      };
    })
    .inSingletonScope();

  // Bind Generator as a global service and instantiate service
  if (this.container.inversifyInstance.isBound("generator")) {
    this.container.inversifyInstance.unbind("generator");
  }
  this.container.inversifyInstance.bind<Generator>("generator").to(Generator);
  this.generator = this.container.inversifyInstance.get<Generator>("generator");
  this.generatorExtension = this.container.inversifyInstance.getAll<PlatformGenerator.Extension>(componentInterfaces.platformGenerator);
};

const expectedCallForLanguage = function(this: CurrentThisContext, language: string) {
  const expectedEntities = (intent: string) =>
    this.expectedEntities && this.expectedEntities[language] && this.expectedEntities[language][`${intent}Intent`]
      ? this.expectedEntities[language][`${intent}Intent`]
      : [];

  const expectedUtteranceMapping = (intent: string) =>
    this.expectedUtteranceMapping && this.expectedUtteranceMapping[language] && this.expectedUtteranceMapping[language][`${intent}Intent`]
      ? this.expectedUtteranceMapping[language][`${intent}Intent`]
      : this.utterances && language && this.utterances[language] && this.utterances[language][`${intent}Intent`]
      ? this.utterances[language][`${intent}Intent`]
      : [];

  const expectedIntentMapping = intent => {
    return {
      intent,
      entities: expectedEntities(intent),
      utterances: expectedUtteranceMapping(intent),
    };
  };
  return [language, `${this.buildDir}/${language}`, this.intents.map(expectedIntentMapping), this.expectedEntityMapping || {}, this.entities[language]];
};

const itBehaveLikeAGenerator = (singleLanguage: boolean = true) => {
  describe(`it behave like a Generator`, function() {
    beforeEach(async function(this: CurrentThisContext) {
      await setupGenerator.bind(this)();
      await this.generator.execute(this.buildDir);
    });

    it("has creaded a build directory for each language in the buildDirectory", async function(this: CurrentThisContext) {
      expect(fs.existsSync(`${this.buildDir}/${this.language[0]}`)).toBeTruthy();
      if (this.language.length > 1) {
        expect(fs.existsSync(`${this.buildDir}/${this.language[1]}`)).toBeTruthy();
      }
    });

    it("execute binded PlatformGenerator", async function(this: CurrentThisContext) {
      expect(this.generatorExtension[0].execute).toHaveBeenCalled();
    });

    it("execute binded PlatformGenerator with params", async function(this: CurrentThisContext) {
      if (this.language.length === 1) {
        expect(this.generatorExtension[0].execute).toHaveBeenCalledWith(...expectedCallForLanguage.bind(this)(this.language[0]));
      } else {
        expect(this.generatorExtension[0].execute).toHaveBeenCalledTimes(2);
        expect((this.generatorExtension[0].execute as jasmine.Spy).calls.allArgs()).toContain(expectedCallForLanguage.bind(this)(this.language[0]));
        expect((this.generatorExtension[0].execute as jasmine.Spy).calls.allArgs()).toContain(expectedCallForLanguage.bind(this)(this.language[1]));
      }
    });
  });
};

describe("Generator", function() {
  beforeAll(function() {
    // Create a mock root folder.
    this.rootDir = __dirname.replace("spec/components/unifier", `tmp`);
    deleteFolderRecursive(this.rootDir);
    fs.mkdirSync(this.rootDir);
  });

  afterAll(function() {
    // Clean all files which will be created within the current spec file
    deleteFolderRecursive(this.rootDir);
  });

  beforeEach(function(this: CurrentThisContext) {
    // Set default values
    this.language = ["en"];
    this.utterances = { [this.language[0]]: {} };
    this.entities = { [this.language[0]]: {} };
    this.expectedEntities = { [this.language[0]]: {} };
    this.utteranceTemplateService = {};
    this.assistantJs.configureComponent("core:unifier", {
      entities: {},
    });

    // Create a single folder for each executed spec
    this.buildDir = `${this.rootDir}/${new Date().getTime()}`;
    deleteFolderRecursive(this.buildDir);
    fs.mkdirSync(this.buildDir);
    fs.mkdirSync(`${this.buildDir}/config`);
    this.language.forEach(language => {
      fs.mkdirSync(`${this.buildDir}/config/${language}`);
    });
  });

  describe(`#execute`, function() {
    [["en"], ["en", "de"]].forEach(function(language) {
      describe(`with language ${language.join("and ")}`, function() {
        beforeEach(function(this: CurrentThisContext) {
          this.language = language;
        });
        describe("when single intent and an utterance without entity is registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.intents = ["okay"];
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that correct?"],
            };
            if (language.length > 1) {
              this.utterances[this.language[1]] = { okayIntent: ["Ist das richtig"] };
              this.entities[this.language[1]] = {};
            }
          });

          itBehaveLikeAGenerator.bind(this)();
        });

        describe("when multiple intents and utterances without entity are registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.intents = ["okay"];
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that correct?"],
              wellDoneIntent: ["Cool", "Well Done"],
            };

            if (language.length > 1) {
              this.utterances[this.language[1]] = { okayIntent: ["Ist das richtig"], wellDoneIntent: ["Cool", "Gut gemacht"] };
              this.entities[this.language[1]] = {};
            }
          });

          itBehaveLikeAGenerator.bind(this)();
        });

        describe("when a single intent and a single utterance with a template literal that contains two options is registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.intents = ["okay"];
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that {correct|right}?"],
            };
            this.expectedUtteranceMapping = { [this.language[0]]: { okayIntent: ["Is that correct?", "Is that right?"] } };

            if (language.length > 1) {
              this.utterances[this.language[1]] = { okayIntent: ["Ist das so {korrekt|richtig}?"] };
              this.entities[this.language[1]] = {};
              this.expectedUtteranceMapping[this.language[1]] = { okayIntent: ["Ist das so korrekt?", "Ist das so richtig?"] };
            }
          });

          itBehaveLikeAGenerator.bind(this)();
        });

        describe("when a single intent without utterances is registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.intents = ["okay"];
            this.utterances[this.language[0]] = {
              okayIntent: [],
            };

            this.expectedUtteranceMapping = { [this.language[0]]: { okayIntent: [] } };

            if (language.length > 1) {
              this.utterances[this.language[1]] = { okayIntent: [] };
              this.entities[this.language[1]] = {};
              this.expectedUtteranceMapping[this.language[1]] = { okayIntent: [] };
            }
          });

          itBehaveLikeAGenerator.bind(this)();
        });

        describe("when a single intent and a single utterance, which contains a listed entity value, is registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.assistantJs.configureComponent("core:unifier", {
              entities: {
                ENTITIES_TYPE: ["correct"],
              },
            });

            this.intents = ["okay"];
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that {{correct}}"],
            };

            this.entities[this.language[0]] = {
              ENTITIES_TYPE: [{ value: "correct" }],
            };

            this.expectedEntities[this.language[0]] = { okayIntent: ["correct"] };
            this.expectedEntityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
            this.expectedUtteranceMapping = { [this.language[0]]: { okayIntent: ["Is that {{correct|correct}}"] } };

            if (language.length > 1) {
              this.utterances[this.language[1]] = { okayIntent: ["Ist das so {{correct}}"] };
              this.entities[this.language[1]] = {
                ENTITIES_TYPE: [{ value: "correct" }],
              };
              this.expectedEntities[this.language[1]] = { okayIntent: ["correct"] };
              this.expectedUtteranceMapping[this.language[1]] = { okayIntent: ["Ist das so {{correct|correct}}"] };
            }
          });

          itBehaveLikeAGenerator.bind(this)();
        });

        describe("when a single intent and a single utterance, which contains a listed entity synonym, is registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.assistantJs.configureComponent("core:unifier", {
              entities: {
                ENTITIES_TYPE: ["correct"],
              },
            });

            this.intents = ["okay"];
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that {{correct}}"],
            };

            this.entities[this.language[0]] = {
              ENTITIES_TYPE: [{ value: "correct", synonyms: ["right"] }],
            };

            this.expectedEntities = { [this.language[0]]: { okayIntent: ["correct"] } };
            this.expectedEntityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
            this.expectedUtteranceMapping = { [this.language[0]]: { okayIntent: ["Is that {{right|correct}}", "Is that {{correct|correct}}"] } };

            if (language.length > 1) {
              this.assistantJs.configureComponent("core:unifier", {
                entities: {
                  ENTITIES_TYPE: ["correct", "korrekt"],
                },
              });
              this.expectedEntityMapping = { correct: "ENTITIES_TYPE", korrekt: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
              this.utterances[this.language[1]] = { okayIntent: ["Ist das so {{korrekt}}"] };
              this.expectedEntities[this.language[1]] = { okayIntent: ["korrekt"] };
              this.entities[this.language[1]] = {
                ENTITIES_TYPE: [{ value: "korrekt", synonyms: ["richtig"] }],
              };
              this.expectedUtteranceMapping[this.language[1]] = { okayIntent: ["Ist das so {{richtig|korrekt}}", "Ist das so {{korrekt|korrekt}}"] };
            }
          });

          itBehaveLikeAGenerator.bind(this)();
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
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that {{type1}}", "Is that {{type2}}"],
            };

            this.expectedEntities[this.language[0]] = { okayIntent: ["type1", "type2"] };
            this.expectedEntityMapping = {
              type1: "ENTITIES_TYPE1",
              ENTITIES_TYPE1: "ENTITIES_TYPE1",
              type2: "ENTITIES_TYPE2",
              ENTITIES_TYPE2: "ENTITIES_TYPE2",
            };
            this.expectedUtteranceMapping = { [this.language[0]]: { okayIntent: ["Is that {{type1}}", "Is that {{type2}}"] } };
            if (language.length > 1) {
              this.utterances[this.language[1]] = { okayIntent: ["Ist das so {{type1}}", "Ist das so {{type2}}"] };
              this.expectedEntities[this.language[1]] = { okayIntent: ["type1", "type2"] };
              this.entities[this.language[1]] = {};
              this.expectedUtteranceMapping[this.language[1]] = { okayIntent: ["Ist das so {{type1}}", "Ist das so {{type2}}"] };
            }
          });

          itBehaveLikeAGenerator.bind(this)();
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
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that {{type1}}", "Is that {{type2}}"],
            };

            this.utteranceTemplateService[this.language[0]] = { okayIntent: ["Is that really {{type1}}"] };

            this.expectedEntities[this.language[0]] = { okayIntent: ["type1", "type2"] };
            this.expectedEntityMapping = {
              type1: "ENTITIES_TYPE1",
              ENTITIES_TYPE1: "ENTITIES_TYPE1",
              type2: "ENTITIES_TYPE2",
              ENTITIES_TYPE2: "ENTITIES_TYPE2",
            };

            this.expectedUtteranceMapping = {
              [this.language[0]]: {
                okayIntent: [...this.utterances[this.language[0]].okayIntent, ...this.utteranceTemplateService[this.language[0]].okayIntent],
              },
            };

            if (language.length > 1) {
              const currentLanguage = this.language[1];
              this.utterances[currentLanguage] = { okayIntent: ["Ist das so {{type1}}", "Ist das so {{type2}}"] };
              this.entities[currentLanguage] = {};
              this.expectedEntities[currentLanguage] = { okayIntent: ["type1", "type2"] };
              this.utteranceTemplateService[currentLanguage] = { okayIntent: ["Ist das wirklich {{type1}}"] };
              this.expectedUtteranceMapping[currentLanguage] = {
                okayIntent: [...this.utterances[currentLanguage].okayIntent, ...this.utteranceTemplateService[this.language[1]].okayIntent],
              };
            }
          });

          itBehaveLikeAGenerator.bind(this)();
        });

        describe("when a single intent and a single utterances, which contains an unlisted entity, are registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.assistantJs.configureComponent("core:unifier", {
              entities: {
                ENTITIES_TYPE: ["ENTITIES_TYPE"],
              },
            });

            this.intents = ["okay"];
            this.utterances[this.language[0]] = {
              okayIntent: ["Is that {{correct}}"],
            };

            if (language.length > 1) {
              this.utterances[this.language[1]] = { okayIntent: ["Ist das so {{korrekt}}"] };
              this.entities[this.language[1]] = {};
            }

            await setupGenerator.bind(this)();
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
        });

        itBehaveLikeAGenerator.bind(this)();
      });
    });
  });
});
