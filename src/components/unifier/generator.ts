import * as fs from "fs";
import * as combinatorics from "js-combinatorics";
import { inject, injectable, multiInject, optional } from "inversify";
import { Component } from "inversify-components";
import { CLIGeneratorExtension } from "../root/public-interfaces";
import { componentInterfaces, Configuration } from "./private-interfaces";
import { GenericIntent, intent, PlatformGenerator, CustomEntity } from "./public-interfaces";

@injectable()
export class Generator implements CLIGeneratorExtension {
  private platformGenerators: PlatformGenerator.Extension[] = [];
  private entityMappings: PlatformGenerator.EntityMapping[] = [];
  private additionalUtteranceTemplatesServices: PlatformGenerator.UtteranceTemplateService[] = [];
  private intents: intent[] = [];
  private configuration: Configuration.Runtime;

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
    entityMappings: PlatformGenerator.EntityMapping[]
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
  }

  public async execute(buildDir: string): Promise<void> {
    // Combine all registered parameter mappings to single object
    const parameterMapping = this.entityMappings.reduce((prev, curr) => ({ ...prev, ...curr }), {});
    // The users custom entities
    const customEntities = this.configuration.customEntities;
    // Get the main utterance templates for each defined language
    const utteranceTemplates = this.getUtteranceTemplates();

    // Iterate through each found language and build the utterance corresponding to the users entities
    const generatorPromises = Object.keys(utteranceTemplates)
      .map(language => {
        // Language specific build directory
        const localeBuildDirectory = buildDir + "/" + language;
        // Mapping of intent, utterances and entities
        const buildIntentConfigs: PlatformGenerator.IntentConfiguration[] = [];
        // Contains the utterances generated from the utterance templates
        const utterances: { [intent: string]: string[] } = {};
        // A hash of custom entity values
        const dictionary: { [name: string]: string[] } = {};

        // Create build dir
        fs.mkdirSync(localeBuildDirectory);

        // Add utterances from extensions to current template
        utteranceTemplates[language] = this.additionalUtteranceTemplatesServices.reduce((target, curr) => {
          const source = curr.getUtterancesFor(language);
          Object.keys(source).forEach(currIntent => {
            // Merge arrays of utterances or add intent to target
            target[currIntent] = target.hasOwnProperty(currIntent) ? target[currIntent].concat(source[currIntent]) : source[currIntent];
          });
          return target;
        }, utteranceTemplates[language]); // Initial value

        // Build utterances from templates
        Object.keys(utteranceTemplates[language]).forEach(currIntent => {
          utterances[currIntent] = this.generateUtterances(utteranceTemplates[language][currIntent]);
        });

        // Fill dictionary with synonyms and entity value name
        Object.keys(customEntities).forEach(entityName => {
          // Values can either be given as string array or as object with property 'synonyms'
          const synonyms: string[] = [];
          customEntities[entityName].values[language].forEach(entity => {
            if (typeof entity === "string") {
              synonyms.push(entity);
            } else {
              synonyms.push(entity.value);
              synonyms.push(...entity.synonyms);
            }
          });
          dictionary[entityName] = synonyms;
        });

        // Build GenerateIntentConfiguration[] array based on these utterances and the found intents
        this.intents.forEach(currIntent => {
          let intentUtterances: string[] = [];

          // Associate utterances to intent
          if (typeof currIntent === "string") {
            intentUtterances = utterances[currIntent + "Intent"];
          } else {
            const baseName = GenericIntent[currIntent] + "GenericIntent";
            intentUtterances = utterances[baseName.charAt(0).toLowerCase() + baseName.slice(1)];
          }
          // If intentUtterances is "undefined", assign empty array
          if (typeof intentUtterances === "undefined") intentUtterances = [];

          // Associate parameters
          let entities =
            intentUtterances
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

          // Remove duplicates from array
          entities = [...new Set(entities)];

          // Check for entities in utterances which have no mapping
          const unmatchedEntity = entities.find(name => typeof parameterMapping[name] === "undefined");
          if (typeof unmatchedEntity === "string") {
            throw Error(
              "Unknown entity '" +
                unmatchedEntity +
                "' found in utterances of intent '" +
                currIntent +
                "'. \n" +
                "Either you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. " +
                "Your configured entity mappings are: " +
                JSON.stringify(this.entityMappings)
            );
          }

          buildIntentConfigs.push({
            customEntities,
            utterances: intentUtterances,
            entities,
            intent: currIntent,
          });
        });

        console.log("BuildIntentConfigs: ", buildIntentConfigs);

        // Call all platform generators
        return this.platformGenerators.map(generator =>
          Promise.resolve(
            generator.execute(
              language,
              localeBuildDirectory,
              buildIntentConfigs.map(config => JSON.parse(JSON.stringify(config))),
              JSON.parse(JSON.stringify(parameterMapping))
            )
          )
        );
      })
      .reduce((prev, curr) => prev.concat(curr));

    // Wait for all platform generators to finish
    await Promise.all(generatorPromises);
  }

  /**
   * Generate an array of utterances, based on the users utterance templates
   * @param templates
   */
  public generateUtterances(templates: string[]): string[] {
    let utterances: string[] = [];
    templates.map(template => {
      const slotValues: string[] = [];

      // Extract all slot values and substitute them with a placeholder
      template = template.replace(/\{([A-Za-z0-9_äÄöÖüÜß,;'"\|\s]+)\}(?!\})/g, (match, param) => {
        slotValues.push(param.split("|"));
        return `{${slotValues.length - 1}}`;
      });

      // Generate all possible combinations with cartesian product
      if (slotValues.length > 0) {
        const combinations = combinatorics.cartesianProduct.apply(combinatorics, slotValues).toArray();
        // Substitute placeholders with combinations
        combinations.forEach(combi => {
          utterances.push(
            template.replace(/\{(\d+)\}/g, (match, param) => {
              return combi[param];
            })
          );
        });
      } else {
        utterances.push(template);
      }
    });
    return utterances;
  }

  /**
   * Return the user defined utterance templates for each language found in locales folder
   */
  private getUtteranceTemplates(): { [language: string]: { [intent: string]: string[] } } {
    const utterances = {};
    const utterancesDir = this.configuration.utterancePath;
    const languages = fs.readdirSync(utterancesDir);
    languages.forEach(language => {
      const utterancePath = utterancesDir + "/" + language + "/utterances.json";
      if (fs.existsSync(utterancePath)) {
        const current = JSON.parse(fs.readFileSync(utterancePath).toString());
        utterances[language] = current;
      }
    });
    return utterances;
  }

  /**
   * Validates
   * @param utterances
   * @param customEntites
   */
  private validateCustomEntityExamples(utterances: string[], dictionary: { [name: string]: string[] }, customEntites: { [name: string]: CustomEntity }) {
    // Iterate through custom entities
    Object.keys(customEntites).forEach(entity => {
      customEntites[entity].names.forEach(name => {
        utterances.forEach(utterance => {});
      });
    });
  }
}
