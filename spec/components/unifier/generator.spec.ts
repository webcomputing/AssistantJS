import { doesNotReject } from "assert";
import * as fs from "fs";
import { injectable } from "inversify";
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
          return { [this.language]: this.utterances };
        },
        getCustomEntities: () => {
          return { [this.language]: this.entities };
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
          return this.utteranceTemplateService;
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

const itBehaveLikeAGenerator = () => {
  describe(`it behave like a Generator`, function() {
    beforeEach(async function(this: CurrentThisContext) {
      await setupGenerator.bind(this)();
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
  beforeAll(async function() {
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
    this.language = "en";
    this.entities = {};
    this.utterances = {};
    this.utteranceTemplateService = {};
    this.assistantJs.configureComponent("core:unifier", {
      entities: this.entities,
    });

    // Create a single folder for each executed spec
    this.buildDir = `${this.rootDir}/${new Date().getTime()}`;
    deleteFolderRecursive(this.buildDir);
    fs.mkdirSync(this.buildDir);
    fs.mkdirSync(`${this.buildDir}/config`);
    fs.mkdirSync(`${this.buildDir}/config/${this.language}`);
  });

  describe(`#execute`, function() {
    describe("when single intent and an utterance without entity is registered", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.intents = ["okay"];
        this.utterances = {
          okayIntent: ["Is that correct?"],
        };
      });

      itBehaveLikeAGenerator.bind(this)();
    });

    describe("when multiple intents and utterances without entity are registered", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.intents = ["okay"];
        this.utterances = {
          okayIntent: ["Is that correct?"],
          wellDoneIntent: ["Cool", "Well Done"],
        };
      });

      itBehaveLikeAGenerator.bind(this)();
    });

    describe("when a single intent and a single utterance with a template literal that contains two options is registered", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.intents = ["okay"];
        this.utterances = {
          okayIntent: ["Is that {correct|right}?"],
        };

        this.expectedUtteranceMapping = { okayIntent: ["Is that correct?", "Is that right?"] };
      });

      itBehaveLikeAGenerator.bind(this)();
    });

    describe("when a single intent without utterances is registered", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.intents = ["okay"];
        this.utterances = {
          okayIntent: [],
        } as any;

        this.expectedUtteranceMapping = { okayIntent: [] };
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
        this.utterances = {
          okayIntent: ["Is that {{correct}}"],
        };

        this.entities = {
          ENTITIES_TYPE: [{ value: "correct" }],
        };

        this.expectedEntities = { okayIntent: ["correct"] };
        this.expectedEntityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
        this.expectedUtteranceMapping = { okayIntent: ["Is that {{correct|correct}}"] };
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
        this.utterances = {
          okayIntent: ["Is that {{correct}}"],
        };

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
      this.utterances = {};
    });

    itBehaveLikeAGenerator.bind(this)();
  });
});
