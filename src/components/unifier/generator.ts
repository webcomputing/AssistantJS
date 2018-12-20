import * as generateUtterances from "alexa-utterances"; // We are only using alexa-independet stuff here
import * as fs from "fs";
import { inject, injectable, multiInject, optional } from "inversify";
import { Component } from "inversify-components";
import { injectionNames } from "../../injection-names";
import { I18nextWrapper } from "../i18n/wrapper";
import { CLIGeneratorExtension } from "../root/public-interfaces";
import { componentInterfaces, Configuration } from "./private-interfaces";
import { GenericIntent, intent, PlatformGenerator } from "./public-interfaces";

@injectable()
export class Generator implements CLIGeneratorExtension {
  private platformGenerators: PlatformGenerator.Extension[] = [];
  private entityMappings: PlatformGenerator.EntityMapping[] = [];
  private additionalUtteranceTemplatesServices: PlatformGenerator.UtteranceTemplateService[] = [];
  private intents: intent[] = [];
  private configuration: Configuration.Runtime;
  private translations: { [lang: string]: { translation: any; utterances: { [intent: string]: string[] }; entities?: any } };

  constructor(
    @inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>,
    @inject("core:state-machine:used-intents")
    @optional()
    intents: intent[],
    @multiInject(componentInterfaces.platformGenerator)
    @optional()
    generators: PlatformGenerator.Extension[],
    @multiInject(componentInterfaces.utteranceTemplateService)
    @optional()
    utteranceServices: PlatformGenerator.UtteranceTemplateService[],
    @multiInject(componentInterfaces.entityMapping)
    @optional()
    entityMappings: PlatformGenerator.EntityMapping[],
    @inject(injectionNames.i18nWrapper)
    i18nWrapper: I18nextWrapper
  ) {
    // Set default values. Setting them in the constructor leads to not calling the injections
    [intents, generators, utteranceServices, entityMappings].forEach(v => {
      // tslint:disable-next-line:no-parameter-reassignment
      if (typeof v === "undefined") v = [];
    });

    this.configuration = componentMeta.configuration;
    this.intents = intents;
    this.platformGenerators = generators;
    this.additionalUtteranceTemplatesServices = utteranceServices;
    this.entityMappings = entityMappings;
    this.translations = i18nWrapper.instance.store.data;
  }

  public async execute(buildDir: string): Promise<void> {
    // Combine all registered parameter mappings to single object
    const parameterMapping = this.entityMappings.reduce((prev, curr) => ({ ...prev, ...curr }), {});

    const entitySets = this.configuration.entitySets;

    // Get utterance templates per language
    const templatesPerLanguage = this.getUtteranceTemplatesPerLanguage();

    // For each found language...
    const promises = Object.keys(templatesPerLanguage)
      .map(language => {
        const buildIntentConfigs: PlatformGenerator.IntentConfiguration[] = [];

        // Build Slots and Dictionary for possible entitySets
        const slots = {};
        const dictionary = {};
        Object.keys(entitySets).forEach(key => {
          // Values can either be given as string array or as object with property 'synonyms'
          const synonyms: string[] = [];
          entitySets[key].values[language].forEach(cValue => {
            if (typeof cValue === "string") {
              synonyms.push(cValue);
            } else {
              synonyms.push(...cValue.synonyms);
            }
          });
          slots[entitySets[key].mapsTo] = "LITERAL";
          dictionary[key] = synonyms;
        });

        // Create language specific build dir
        const languageSpecificBuildDir = buildDir + "/" + language;
        fs.mkdirSync(languageSpecificBuildDir);

        // Add additional utterances from extensions to current templates
        const currentTemplates = this.additionalUtteranceTemplatesServices.reduce(
          (prev, curr) => this.mergeUtterances(prev, curr.getUtterancesFor(language)),
          templatesPerLanguage[language]
        );

        // ... convert templates into built utterances
        Object.keys(currentTemplates).forEach(currIntent => {
          currentTemplates[currIntent] = this.buildUtterances(currentTemplates[currIntent], parameterMapping, slots, dictionary);
        });

        // ... build the GenerateIntentConfiguration[] array based on these utterances and the found intents
        this.intents.forEach(currIntent => {
          let utterances: string[] = [];

          // Associate utterances to intent
          if (typeof currIntent === "string") {
            utterances = currentTemplates[currIntent + "Intent"];
          } else {
            const baseName = GenericIntent[currIntent] + "GenericIntent";
            utterances = currentTemplates[baseName.charAt(0).toLowerCase() + baseName.slice(1)];
          }
          if (typeof utterances === "undefined") utterances = [];

          // Associate parameters
          let parameters =
            utterances
              // Match all {parameters}
              .map(utterance => utterance.match(/\{(\w+)?\}/g))

              // Create one array with all matches
              .reduce((prev, curr) => {
                if (curr !== null) {
                  // Remove "{", "}"
                  curr.forEach(parameter => (prev as string[]).push(parameter.replace(/\{|\}/g, "")));
                }
                return prev;
              }, []) || [];

          // Remove duplicates from this one array
          parameters = [...new Set(parameters)];

          // Check for parameters in utterances which have no mapping
          const unmatchedParameter = parameters.find(
            name => typeof parameterMapping[name as string] === "undefined" && typeof entitySets[name as string] === "undefined"
          );
          if (typeof unmatchedParameter === "string") {
            throw Error(
              "Unknown entity '" +
                unmatchedParameter +
                "' found in utterances of intent '" +
                currIntent +
                "'. \n" +
                "Either you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. " +
                "Your configured entity mappings are: " +
                JSON.stringify(this.entityMappings)
            );
          }

          buildIntentConfigs.push({
            entitySets,
            utterances,
            entities: parameters,
            intent: currIntent,
          });
        });

        // Call all platform generators
        return this.platformGenerators.map(generator =>
          Promise.resolve(
            generator.execute(
              language,
              languageSpecificBuildDir,
              buildIntentConfigs.map(config => JSON.parse(JSON.stringify(config))),
              JSON.parse(JSON.stringify(parameterMapping))
            )
          )
        );
      })
      .reduce((prev, curr) => prev.concat(curr));

    // Wait for all platform generators to finish
    await Promise.all(promises);
  }

  /**
   * Builds utterances for the given templateStrings
   * @param {string[]} templateStrings that are the specified utterance-strings per intent from translation.json
   * @param {PlatformGenerator.EntityMapping} parameterMapping that mapps all registered entities in an single object
   * @param { [name: string]: string } [slots] to give to alexa-utterances
   * @param { [name: string]: string[] } [dictionary] to give to alexa-utterances
   */
  public buildUtterances(
    templateStrings: string[],
    parameterMapping: PlatformGenerator.EntityMapping,
    slots?: { [name: string]: string },
    dictionary?: { [name: string]: string[] }
  ): string[] {
    return (
      templateStrings
        // convert {{param}} into alexa-utterances-specific format
        .map(templateString => templateString.replace(/\{\{(\w+)\}\}/g, (match, param) => this.getEntity(param, parameterMapping)))
        .map(templateString => generateUtterances(templateString, slots, dictionary))
        .reduce((prev, curr) => prev.concat(curr), [])
    );
  }

  public getUtteranceTemplatesPerLanguage(): { [language: string]: { [intent: string]: string[] } } {
    return Object.keys(this.translations).reduce((utterances, lang) => ({ ...utterances, [lang]: this.translations[lang].utterances }), {});
  }

  /**
   * Creates an alexa-utterances-specific format of an entity declaration,
   * {-|param} for existing entities and {param|MAPPED_ENTITY} for entitySets
   * @param {string} param that is either an existing entity name or an entitySet name
   * @param {PlatformGenerator.EntityMapping} parameterMapping that mapps all registered entities in an single object
   */
  private getEntity(param: string, parameterMapping: PlatformGenerator.EntityMapping): string {
    if (typeof parameterMapping[param] === "undefined" && typeof this.configuration.entitySets[param] !== "undefined") {
      // param is part of an entitySet
      return `{${param}|${this.configuration.entitySets[param].mapsTo}}`;
    }
    return "{-|" + param + "}";
  }

  private mergeUtterances(target: { [intent: string]: string[] }, source: { [intent: string]: string[] }) {
    Object.keys(source).forEach(currIntent => {
      // Merge arrays of utterances or add intent to target
      target[currIntent] = target.hasOwnProperty(currIntent) ? target[currIntent].concat(source[currIntent]) : source[currIntent];
    });

    return target;
  }
}
