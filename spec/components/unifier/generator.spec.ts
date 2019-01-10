import * as fs from "fs";
import { GenericIntent, intent, PlatformGenerator } from "../../../src/assistant-source";
import { componentInterfaces as rootCmponentInterfaces } from "../../../src/components/root/private-interfaces";
import { Generator } from "../../../src/components/unifier/generator";
import { LocalesLoader } from "../../../src/components/unifier/locales-loader";
import { componentInterfaces } from "../../../src/components/unifier/private-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  mockReturns: {
    /** Array of intents given to generator class */
    usedIntents: intent[];

    /** List of entitiy mappings used in generator class */
    entityMapping: PlatformGenerator.EntityMapping;

    /** List of utterance templates, returned by localesLoader */
    utteranceTemplates: ReturnType<LocalesLoader["getUtteranceTemplates"]>;

    /** Custom entities returned by locales loader */
    customEntities: ReturnType<LocalesLoader["getCustomEntities"]>;

    /** Additional templates to be returned by additionalUtteranceTemplatesService */
    additionalTemplates: ReturnType<PlatformGenerator.UtteranceTemplateService["getUtterancesFor"]>;
  };

  /** The locales loader given to generator class */
  localesLoader: LocalesLoader;

  /** The platform generators used in generator class */
  platformGenerator: PlatformGenerator.Extension;

  /** List of additional utterance template services used in generator class */
  additionalUtteranceTemplateService: PlatformGenerator.UtteranceTemplateService;

  /** Different parameters */
  params: any;

  /** Reference to generator instance */
  getGenerator: () => Generator;

  /** Creates an intent configuration */
  createIntentConfiguration: (opts: { intent?: intent; utterances?: string[]; entities?: string[] }) => PlatformGenerator.IntentConfiguration;

  /** Returns arguments for execute() method with reasonable defaults */
  createArgumentsForExecute: (
    opts: Partial<{
      language: string;
      buildDir: string;
      intentConfigurations: PlatformGenerator.IntentConfiguration[];
      entityMapping: PlatformGenerator.EntityMapping;
      customEntities: PlatformGenerator.CustomEntityMapping;
    }>
  ) => [string, string, PlatformGenerator.IntentConfiguration[], PlatformGenerator.EntityMapping, PlatformGenerator.CustomEntityMapping];
}

// Orignal functions which are going to be mocked
const { mkdirSync } = fs;

describe("Generator", function() {
  beforeEach(async function(this: CurrentThisContext) {
    // Never create any directories
    // tslint:disable-next-line:no-empty
    (fs as any).mkdirSync = jasmine.createSpy("mkdirSync").and.callFake(() => {});
  });

  afterEach(async function(this: CurrentThisContext) {
    // Never create any directories
    (fs as any).mkdirSync = mkdirSync;
  });

  beforeEach(async function(this: CurrentThisContext) {
    this.mockReturns = {} as any;
    this.params = {};

    /** Preparing mocks */

    // Get locales loader and switch real instance with fixed object
    this.localesLoader = this.container.inversifyInstance.get<LocalesLoader>(injectionNames.localesLoader);
    this.container.inversifyInstance.rebind(injectionNames.localesLoader).toDynamicValue(() => this.localesLoader);

    // Register spies on localesloader
    this.mockReturns.utteranceTemplates = {};
    this.mockReturns.customEntities = {};
    spyOn(this.localesLoader, "getUtteranceTemplates").and.callFake(() => this.mockReturns.utteranceTemplates);
    spyOn(this.localesLoader, "getCustomEntities").and.callFake(() => this.mockReturns.customEntities);

    // Always use mocked usedIntents
    this.mockReturns.usedIntents = ["helloWorld"];
    this.container.inversifyInstance.rebind("core:state-machine:used-intents").toDynamicValue(() => this.mockReturns.usedIntents);

    // tslint:disable-next-line:no-empty
    this.platformGenerator = { execute: () => {} };
    this.container.inversifyInstance.bind(componentInterfaces.platformGenerator).toDynamicValue(() => this.platformGenerator);
    spyOn(this.platformGenerator, "execute").and.callThrough();

    // Re-register additional utterance templates
    this.mockReturns.additionalTemplates = {};
    this.additionalUtteranceTemplateService = { getUtterancesFor: () => this.mockReturns.additionalTemplates };
    this.container.inversifyInstance.bind(componentInterfaces.utteranceTemplateService).toDynamicValue(() => this.additionalUtteranceTemplateService);

    // Always use mocked entityMappings
    this.mockReturns.entityMapping = {};
    this.container.inversifyInstance.rebind(componentInterfaces.entityMapping).toDynamicValue(() => this.mockReturns.entityMapping);

    this.getGenerator = () => this.container.inversifyInstance.get(rootCmponentInterfaces.generator);
    this.createIntentConfiguration = opts => ({ intent: opts.intent || "helloWorld", entities: opts.entities || [], utterances: opts.utterances || [] });
    this.createArgumentsForExecute = opts =>
      [
        opts.language || jasmine.any(String),
        opts.buildDir || jasmine.any(String),
        opts.intentConfigurations || jasmine.any(Object),
        opts.entityMapping || jasmine.any(Object),
        opts.customEntities || jasmine.any(Object),
      ] as any;
  });

  fdescribe("#execute", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.params.buildDirectory = "tmp";
      this.mockReturns.customEntities = { de: {}, en: {} };
    });

    describe("regarding utterance permutations", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.params.utterancesFromTemplates = {
          de: { helloWorldIntent: ["without permutation", "{this|that} is {permutated|one of many words i know"] },
        };

        await this.getGenerator().execute(this.params.buildDirectory);
      });

      xit("copies utterances without template syntax", async function(this: CurrentThisContext) {});

      it("correctly permutates utterances using template syntax", async function(this: CurrentThisContext) {});
    });

    describe("with > 0 different languages in locales folder", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.mockReturns.utteranceTemplates = { de: { helloWorldIntent: ["hallo", "welt"] }, en: { helloWorldIntent: ["hello", "world"] } };
        this.params.utterancesFromTemplates = {
          de: this.mockReturns.utteranceTemplates.de.helloWorldIntent,
          en: this.mockReturns.utteranceTemplates.en.helloWorldIntent,
        };
      });

      it("passes utteranceTemplates from localesLoader", async function(this: CurrentThisContext) {
        await this.getGenerator().execute(this.params.buildDirectory);

        expect(this.platformGenerator.execute).toHaveBeenCalledWith(
          ...this.createArgumentsForExecute({
            intentConfigurations: [this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.en })],
          })
        );
        expect(this.platformGenerator.execute).toHaveBeenCalledWith(
          ...this.createArgumentsForExecute({
            intentConfigurations: [this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de })],
          })
        );
      });

      it("passes used language to platform generator", async function(this: CurrentThisContext) {
        await this.getGenerator().execute(this.params.buildDirectory);

        expect(this.platformGenerator.execute).toHaveBeenCalledWith(...this.createArgumentsForExecute({ language: "de" }));
        expect(this.platformGenerator.execute).toHaveBeenCalledWith(...this.createArgumentsForExecute({ language: "en" }));
      });

      describe("regarding generation of build directory", function() {
        beforeEach(async function(this: CurrentThisContext) {
          await this.getGenerator().execute(this.params.buildDirectory);
        });

        it("generates one for each language", async function(this: CurrentThisContext) {
          expect(fs.mkdirSync).toHaveBeenCalledTimes(Object.keys(this.mockReturns.utteranceTemplates).length);
        });

        it("names directory based on language and given build directory", async function(this: CurrentThisContext) {
          expect(fs.mkdirSync).toHaveBeenCalledWith(`${this.params.buildDirectory}/de`);
          expect(fs.mkdirSync).toHaveBeenCalledWith(`${this.params.buildDirectory}/en`);
        });

        it("passes generated build directory path to platform generators", async function(this: CurrentThisContext) {
          expect(this.platformGenerator.execute).toHaveBeenCalledWith(...this.createArgumentsForExecute({ buildDir: `${this.params.buildDirectory}/de` }));
          expect(this.platformGenerator.execute).toHaveBeenCalledWith(...this.createArgumentsForExecute({ buildDir: `${this.params.buildDirectory}/en` }));
        });
      });

      describe("with generic intents used", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mockReturns.usedIntents.push(GenericIntent.Help);
          this.mockReturns.additionalTemplates = { helpGenericIntent: ["help"] };

          await this.getGenerator().execute(this.params.buildDirectory);
        });

        it("finds utterance by renaming generic intent input", async function(this: CurrentThisContext) {
          expect(this.platformGenerator.execute).toHaveBeenCalledWith(
            ...this.createArgumentsForExecute({
              intentConfigurations: [
                this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de }),
                this.createIntentConfiguration({ intent: GenericIntent.Help, utterances: ["help"] }),
              ],
            })
          );
        });
      });

      describe("if intent contains no utterances", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mockReturns.usedIntents.push("withoutUtterances");

          await this.getGenerator().execute(this.params.buildDirectory);
        });

        it("does not pass any utterances for this intent", async function(this: CurrentThisContext) {
          expect(this.platformGenerator.execute).toHaveBeenCalledWith(
            ...this.createArgumentsForExecute({
              intentConfigurations: [
                this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de }),
                this.createIntentConfiguration({ intent: "withoutUtterances" }),
              ],
            })
          );
        });
      });

      describe("with additionalUtteranceTemplatesServices given", function() {
        describe("with new intents in additional templates", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.usedIntents.push("info");
            this.mockReturns.additionalTemplates = { infoIntent: ["info"] };

            await this.getGenerator().execute(this.params.buildDirectory);
          });

          it("adds new intent to templates", async function(this: CurrentThisContext) {
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                intentConfigurations: [
                  this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de }),
                  this.createIntentConfiguration({ intent: "info", utterances: ["info"] }),
                ],
              })
            );
          });
        });

        describe("with new utterances for the same intent", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.additionalTemplates = { helloWorldIntent: ["neue utterance"] };

            await this.getGenerator().execute(this.params.buildDirectory);
          });

          it("merges both declarations", async function(this: CurrentThisContext) {
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                intentConfigurations: [this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de.concat(["neue utterance"]) })],
              })
            );
          });
        });
      });
    });

    describe("with no languages via utterance templates given", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.mockReturns.utteranceTemplates = {};
      });
    });
  });
});
