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

    /** List of entity mappings used in generator class */
    entityMapping: PlatformGenerator.EntityMapping;

    /** List of utterance templates, returned by localesLoader */
    utteranceTemplates: ReturnType<LocalesLoader["getUtteranceTemplates"]>;

    /** Custom entities returned by locales loader */
    customEntities: ReturnType<LocalesLoader["getCustomEntities"]>;

    /** Additional templates to be returned by additionalUtteranceTemplatesService */
    additionalTemplates: PlatformGenerator.Multilingual<ReturnType<PlatformGenerator.UtteranceTemplateService["getUtterancesFor"]>>;
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

  /** Instance of the current generator class used to check constructor manipulations. You should prefer the use of getGenerator function. */
  generator: any;

  /** Creates an intent configuration */
  createIntentConfiguration: (opts: { intent?: intent; utterances?: string[]; entities?: string[] }) => PlatformGenerator.IntentConfiguration;

  /** Returns arguments for execute() method with reasonable defaults */
  createArgumentsForExecute: (
    opts: Partial<{
      languages: string[];
      buildDir: string;
      intentConfigurations: PlatformGenerator.Multilingual<PlatformGenerator.IntentConfiguration[]>;
      entityMapping: PlatformGenerator.EntityMapping;
      customEntities: PlatformGenerator.Multilingual<PlatformGenerator.CustomEntityMapping>;
    }>
  ) => [
    string[],
    string,
    PlatformGenerator.Multilingual<PlatformGenerator.IntentConfiguration[]>,
    PlatformGenerator.EntityMapping,
    PlatformGenerator.Multilingual<PlatformGenerator.CustomEntityMapping>
  ];
}

describe("Generator", function() {
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
    this.mockReturns.additionalTemplates = { de: {}, en: {} };
    this.additionalUtteranceTemplateService = { getUtterancesFor: locale => this.mockReturns.additionalTemplates[locale] };
    this.container.inversifyInstance.bind(componentInterfaces.utteranceTemplateService).toDynamicValue(() => this.additionalUtteranceTemplateService);

    // Always use mocked entityMappings
    this.mockReturns.entityMapping = {};
    this.container.inversifyInstance.rebind(componentInterfaces.entityMapping).toDynamicValue(() => this.mockReturns.entityMapping);

    this.getGenerator = () => this.container.inversifyInstance.get(rootCmponentInterfaces.generator);
    this.createIntentConfiguration = opts => ({ intent: opts.intent || "helloWorld", entities: opts.entities || [], utterances: opts.utterances || [] });
    this.createArgumentsForExecute = opts =>
      [
        opts.languages || jasmine.any(Array),
        opts.buildDir || jasmine.any(String),
        opts.intentConfigurations || jasmine.any(Object),
        opts.entityMapping || jasmine.any(Object),
        opts.customEntities || jasmine.any(Object),
      ] as any;
  });

  describe("#constructor", function() {
    describe("without optional injections", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.container.inversifyInstance.unbind(componentInterfaces.utteranceTemplateService);
        this.container.inversifyInstance.unbind(componentInterfaces.entityMapping);
        this.container.inversifyInstance.unbind(componentInterfaces.platformGenerator);
        this.container.inversifyInstance.unbind("core:state-machine:used-intents");
        this.generator = this.getGenerator();
      });

      it("sets intents default values to an empty array", async function(this: CurrentThisContext) {
        expect(this.generator.intents).toEqual([]);
      });

      it("sets platformGenerators default values to an empty array", async function(this: CurrentThisContext) {
        expect(this.generator.platformGenerators).toEqual([]);
      });
      it("sets additionalUtteranceTemplatesServices default values to an empty array", async function(this: CurrentThisContext) {
        expect(this.generator.additionalUtteranceTemplatesServices).toEqual([]);
      });
      it("sets entityMappings default values to an empty array", async function(this: CurrentThisContext) {
        expect(this.generator.entityMappings).toEqual([]);
      });
    });
  });

  describe("#execute", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.params.buildDirectory = "tmp";
      this.mockReturns.customEntities = { de: {}, en: {} };
    });

    describe("regarding utterance permutations", function() {
      it("copies utterances without template syntax", async function(this: CurrentThisContext) {
        this.mockReturns.utteranceTemplates = { de: { helloWorldIntent: ["hallo"] } };
        await this.getGenerator().execute(this.params.buildDirectory);

        expect(this.platformGenerator.execute as jasmine.Spy).toHaveBeenCalledWith(
          ...this.createArgumentsForExecute({
            intentConfigurations: {
              de: [
                this.createIntentConfiguration({
                  utterances: ["hallo"],
                }),
              ],
            },
          })
        );
      });

      it("correctly permute utterances using template syntax", async function(this: CurrentThisContext) {
        this.mockReturns.utteranceTemplates = { de: { helloWorldIntent: ["{this|that} is {cool|right}"] } };
        this.params.permutedUtterances = ["this is cool", "that is cool", "this is right", "that is right"];

        await this.getGenerator().execute(this.params.buildDirectory);

        expect(this.platformGenerator.execute as jasmine.Spy).toHaveBeenCalledWith(
          ...this.createArgumentsForExecute({
            intentConfigurations: {
              de: [
                this.createIntentConfiguration({
                  utterances: this.params.permutedUtterances,
                }),
              ],
            },
          })
        );
      });

      it("returns an empty array of utterances if the intent could not be found in the utterance templates", async function(this: CurrentThisContext) {
        this.mockReturns.utteranceTemplates = { de: {} };
        await this.getGenerator().execute(this.params.buildDirectory);

        expect(this.platformGenerator.execute as jasmine.Spy).toHaveBeenCalledWith(
          ...this.createArgumentsForExecute({
            intentConfigurations: {
              de: [
                this.createIntentConfiguration({
                  utterances: [],
                }),
              ],
            },
          })
        );
      });
    });

    describe("with custom entities", function() {
      describe("without entityMapping", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mockReturns.utteranceTemplates = { en: { helloWorldIntent: ["hello {{customEntity1}}"] } };
        });

        describe("no entity mappings are registered", function() {
          it("throws an unknown entity exception", async function(this: CurrentThisContext) {
            try {
              await this.getGenerator().execute(this.params.buildDirectory);
              fail("Should throw an unknown entity exception");
            } catch (e) {
              expect(e.message).toEqual(
                `Unknown entity 'customEntity1' found in utterances of intent '${
                  this.mockReturns.usedIntents[0]
                }'.\nEither you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. Your configured entity mappings are: []`
              );
            }
          });
        });

        describe("wrong entity mapping is registered", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.entityMapping = { TYPE_ENTITIES: "customEntity1" };
          });

          it("throws an unknown entity exception", async function(this: CurrentThisContext) {
            try {
              await this.getGenerator().execute(this.params.buildDirectory);
              fail("Should throw an unknown entity exception");
            } catch (e) {
              expect(e.message).toEqual(
                `Unknown entity 'customEntity1' found in utterances of intent '${
                  this.mockReturns.usedIntents[0]
                }'.\nEither you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. Your configured entity mappings are: ["${
                  Object.keys(this.mockReturns.entityMapping)[0]
                }"]`
              );
            }
          });
        });
      });

      describe("with entityMapping", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mockReturns.utteranceTemplates = { en: { helloWorldIntent: ["hello {{customEntity1}}"] } };
          this.mockReturns.entityMapping = { customEntity1: "ENTITIES_TYPE" };
          this.mockReturns.customEntities = {
            en: { ENTITIES_TYPE: [{ value: "customEntity1", synonyms: ["world"] }] },
          };
        });

        describe("with registered custom entities", function() {
          it("loads custom entities from localesLoader", async function(this: CurrentThisContext) {
            await this.getGenerator().execute(this.params.buildDirectory);
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                customEntities: {
                  en: this.mockReturns.customEntities.en,
                },
              })
            );
          });

          it("moves the loaded array of customEntities from localesLoader to an single set of customEntities", async function(this: CurrentThisContext) {
            this.mockReturns.entityMapping = { customEntity1: "ENTITIES_TYPE", customEntity2: "ENTITIES_TYPE" };
            await this.getGenerator().execute(this.params.buildDirectory);

            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                customEntities: {
                  en: this.mockReturns.customEntities.en,
                },
              })
            );
          });
        });

        describe("without registered customEntities", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.customEntities = { en: { ENTITIES_TYPE: [] } };
            await this.getGenerator().execute(this.params.buildDirectory);
          });

          it("transmits single utterance", async function(this: CurrentThisContext) {
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                intentConfigurations: {
                  en: [
                    this.createIntentConfiguration({
                      entities: jasmine.any(Array) as any,
                      utterances: ["hello {{customEntity1}}"],
                    }),
                  ],
                },
              })
            );
          });

          it("transmits entityMapping", async function(this: CurrentThisContext) {
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                entityMapping: this.mockReturns.entityMapping,
              })
            );
          });

          it("transmits extracted entity", async function(this: CurrentThisContext) {
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                intentConfigurations: {
                  en: [
                    this.createIntentConfiguration({
                      entities: ["customEntity1"],
                      utterances: jasmine.any(Array) as any,
                    }),
                  ],
                },
              })
            );
          });
        });

        describe("with multiple entities from the same entity mapping", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.utteranceTemplates = { en: { helloWorldIntent: ["hello {{customEntity1}} {{customEntity2}}"] } };
            this.mockReturns.entityMapping = { customEntity1: "ENTITIES_TYPE", customEntity2: "ENTITIES_TYPE" };
          });
          describe("with synonyms", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.mockReturns.customEntities = {
                en: { ENTITIES_TYPE: [{ value: "customEntity1", synonyms: ["world", "earth"] }, { value: "customEntity2", synonyms: ["hallo"] }] },
              };
              await this.getGenerator().execute(this.params.buildDirectory);
            });

            it("permutes each utterances with each matching synonym", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: jasmine.anything() as any,
                        utterances: [
                          "hello {{world|customEntity1}} {{hallo|customEntity2}}",
                          "hello {{earth|customEntity1}} {{hallo|customEntity2}}",
                          "hello {{customEntity1|customEntity1}} {{hallo|customEntity2}}",
                          "hello {{world|customEntity1}} {{customEntity2|customEntity2}}",
                          "hello {{earth|customEntity1}} {{customEntity2|customEntity2}}",
                          "hello {{customEntity1|customEntity1}} {{customEntity2|customEntity2}}",
                        ],
                      }),
                    ],
                  },
                })
              );
            });
          });

          describe("without synonyms", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.mockReturns.customEntities = {
                en: { ENTITIES_TYPE: [{ value: "customEntity1" }, { value: "customEntity2" }] },
              };
              await this.getGenerator().execute(this.params.buildDirectory);
            });

            it("will not permutes any custom entities", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: jasmine.anything() as any,
                        utterances: ["hello {{customEntity1}} {{customEntity2}}"],
                      }),
                    ],
                  },
                })
              );
            });
          });
        });

        describe("with two custom entities form the same type", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.utteranceTemplates = { en: { helloWorldIntent: ["hello {{customEntity1}} {{customEntity1}}"] } };
            this.mockReturns.entityMapping = { customEntity1: "ENTITIES_TYPE" };
          });

          describe("with synonyms", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.mockReturns.customEntities = {
                en: { ENTITIES_TYPE: [{ value: "customEntity1", synonyms: ["world", "earth"] }] },
              };
              await this.getGenerator().execute(this.params.buildDirectory);
            });

            it("permutes each utterances with each matching synonym", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: jasmine.anything() as any,
                        utterances: [
                          "hello {{world|customEntity1}} {{world|customEntity1}}",
                          "hello {{earth|customEntity1}} {{world|customEntity1}}",
                          "hello {{customEntity1|customEntity1}} {{world|customEntity1}}",
                          "hello {{world|customEntity1}} {{earth|customEntity1}}",
                          "hello {{earth|customEntity1}} {{earth|customEntity1}}",
                          "hello {{customEntity1|customEntity1}} {{earth|customEntity1}}",
                          "hello {{world|customEntity1}} {{customEntity1|customEntity1}}",
                          "hello {{earth|customEntity1}} {{customEntity1|customEntity1}}",
                          "hello {{customEntity1|customEntity1}} {{customEntity1|customEntity1}}",
                        ],
                      }),
                    ],
                  },
                })
              );
            });
          });
        });

        describe("with multiple entities from different entity mappings", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.utteranceTemplates = { en: { helloWorldIntent: ["hello {{customEntity1}} {{customEntity2}}"] } };
            this.mockReturns.entityMapping = { customEntity1: "ENTITIES_TYPE", customEntity2: "ENTITIES_TYPE2" };
          });
          describe("with synonyms", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.mockReturns.customEntities = {
                en: {
                  ENTITIES_TYPE: [{ value: "customEntity1", synonyms: ["world", "earth"] }],
                  ENTITIES_TYPE2: [{ value: "customEntity2", synonyms: ["hallo"] }],
                },
              };
              await this.getGenerator().execute(this.params.buildDirectory);
            });

            it("permutes each utterances with each matching synonym", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: jasmine.anything() as any,
                        utterances: [
                          "hello {{world|customEntity1}} {{hallo|customEntity2}}",
                          "hello {{earth|customEntity1}} {{hallo|customEntity2}}",
                          "hello {{customEntity1|customEntity1}} {{hallo|customEntity2}}",
                          "hello {{world|customEntity1}} {{customEntity2|customEntity2}}",
                          "hello {{earth|customEntity1}} {{customEntity2|customEntity2}}",
                          "hello {{customEntity1|customEntity1}} {{customEntity2|customEntity2}}",
                        ],
                      }),
                    ],
                  },
                })
              );
            });
          });
        });

        describe("without entity example in utteranceTemplate", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.utteranceTemplates = { en: { helloWorldIntent: ["hello {{customEntity1}}"] } };
          });

          describe("with synonyms", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.mockReturns.customEntities = {
                en: { ENTITIES_TYPE: [{ value: "customEntity1", synonyms: ["world", "earth"] }] },
              };
              await this.getGenerator().execute(this.params.buildDirectory);
            });

            it("permutes each utterances with each matching synonym", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: jasmine.anything() as any,
                        utterances: ["hello {{world|customEntity1}}", "hello {{earth|customEntity1}}", "hello {{customEntity1|customEntity1}}"],
                      }),
                    ],
                  },
                })
              );
            });

            it("transmits extracted entities", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: ["customEntity1"],
                        utterances: jasmine.any(Array) as any,
                      }),
                    ],
                  },
                })
              );
            });

            it("transmits entityMapping", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  entityMapping: this.mockReturns.entityMapping,
                })
              );
            });
          });
        });

        describe("with entity example in utteranceTemplate", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.utteranceTemplates = { en: { helloWorldIntent: ["hello {{world|customEntity1}}"] } };
          });

          describe("without synonyms", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.mockReturns.customEntities = {
                en: { ENTITIES_TYPE: [{ value: "customEntity1" }] },
              };
              await this.getGenerator().execute(this.params.buildDirectory);
            });

            it("extracts entity (slot types) from utterance", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: ["customEntity1"],
                        utterances: jasmine.any(Array) as any,
                      }),
                    ],
                  },
                })
              );
            });

            it("transmits the utterances with given entity example", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: jasmine.any(Array) as any,
                        utterances: ["hello {{world|customEntity1}}"],
                      }),
                    ],
                  },
                })
              );
            });
          });

          describe("with synonyms", function() {
            beforeEach(async function(this: CurrentThisContext) {
              this.mockReturns.customEntities = {
                en: { ENTITIES_TYPE: [{ value: "customEntity1", synonyms: ["earth"] }] },
              };
              await this.getGenerator().execute(this.params.buildDirectory);
            });

            it("transmits the utterance from utteranceTemplate without permutation each synonym", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  intentConfigurations: {
                    en: [
                      this.createIntentConfiguration({
                        entities: jasmine.any(Array) as any,
                        utterances: ["hello {{world|customEntity1}}"],
                      }),
                    ],
                  },
                })
              );
            });

            it("transmits synonyms in customEntities", async function(this: CurrentThisContext) {
              expect(this.platformGenerator.execute).toHaveBeenCalledWith(
                ...this.createArgumentsForExecute({
                  customEntities: {
                    en: this.mockReturns.customEntities.en,
                  },
                })
              );
            });
          });
        });
      });
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
            intentConfigurations: {
              en: [this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.en })],
              de: [this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de })],
            },
          })
        );
      });

      it("passes used language to platform generator", async function(this: CurrentThisContext) {
        await this.getGenerator().execute(this.params.buildDirectory);

        expect(this.platformGenerator.execute).toHaveBeenCalledWith(...this.createArgumentsForExecute({ languages: ["de", "en"] }));
      });

      describe("regarding generation of build directory", function() {
        beforeEach(async function(this: CurrentThisContext) {
          await this.getGenerator().execute(this.params.buildDirectory);
        });

        it("passes generated build directory path to platform generators", async function(this: CurrentThisContext) {
          expect(this.platformGenerator.execute).toHaveBeenCalledWith(...this.createArgumentsForExecute({ buildDir: `${this.params.buildDirectory}` }));
        });
      });

      describe("with generic intents used", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.mockReturns.usedIntents.push(GenericIntent.Help);
          this.mockReturns.additionalTemplates = {
            de: { helpGenericIntent: ["hilfe"] },
            en: { helpGenericIntent: ["help"] },
          };

          await this.getGenerator().execute(this.params.buildDirectory);
        });

        it("finds utterance by renaming generic intent input", async function(this: CurrentThisContext) {
          expect(this.platformGenerator.execute).toHaveBeenCalledWith(
            ...this.createArgumentsForExecute({
              intentConfigurations: {
                de: [
                  this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de }),
                  this.createIntentConfiguration({ intent: GenericIntent.Help, utterances: ["hilfe"] }),
                ],
                en: [
                  this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.en }),
                  this.createIntentConfiguration({ intent: GenericIntent.Help, utterances: ["help"] }),
                ],
              },
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
              intentConfigurations: {
                de: [
                  this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de }),
                  this.createIntentConfiguration({ intent: "withoutUtterances" }),
                ],
                en: [
                  this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.en }),
                  this.createIntentConfiguration({ intent: "withoutUtterances" }),
                ],
              },
            })
          );
        });
      });

      describe("with additionalUtteranceTemplatesServices given", function() {
        describe("with new intents in additional templates", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.usedIntents.push("info");
            this.mockReturns.additionalTemplates = {
              de: { infoIntent: ["info"] },
              en: { infoIntent: ["info"] },
            };

            await this.getGenerator().execute(this.params.buildDirectory);
          });

          it("adds new intent to templates", async function(this: CurrentThisContext) {
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                intentConfigurations: {
                  en: [
                    this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.en }),
                    this.createIntentConfiguration({ intent: "info", utterances: ["info"] }),
                  ],
                  de: [
                    this.createIntentConfiguration({ utterances: this.params.utterancesFromTemplates.de }),
                    this.createIntentConfiguration({ intent: "info", utterances: ["info"] }),
                  ],
                },
              })
            );
          });
        });

        describe("with new utterances for the same intent", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.mockReturns.additionalTemplates = {
              de: { helloWorldIntent: ["neue utterance"] },
              en: { helloWorldIntent: ["new utterance"] },
            };

            await this.getGenerator().execute(this.params.buildDirectory);
          });

          it("merges both declarations", async function(this: CurrentThisContext) {
            expect(this.platformGenerator.execute).toHaveBeenCalledWith(
              ...this.createArgumentsForExecute({
                intentConfigurations: {
                  de: [
                    this.createIntentConfiguration({
                      utterances: this.params.utterancesFromTemplates.de.concat(this.mockReturns.additionalTemplates.de.helloWorldIntent),
                    }),
                  ],
                  en: [
                    this.createIntentConfiguration({
                      utterances: this.params.utterancesFromTemplates.en.concat(this.mockReturns.additionalTemplates.en.helloWorldIntent),
                    }),
                  ],
                },
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

      it("throws an missing utterances exception", async function(this: CurrentThisContext) {
        try {
          await this.getGenerator().execute(this.params.buildDirectory);
          fail("Should throw an missing utterances exception");
        } catch (error) {
          expect(error.message).toEqual("Currently no utterances are configured.");
        }
      });
    });
  });
});
