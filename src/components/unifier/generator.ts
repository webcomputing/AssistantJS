import * as fs from "fs";
import * as combinatorics from "js-combinatorics";
import { inject, injectable, multiInject, optional } from "inversify";
import { Component } from "inversify-components";
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
        // A hash of entity values
        const dictionary = {};
        // Language specific build directory
        const localeBuildDirectory = buildDir + "/" + language;
        // Mapping of intent, utterances and entities
        const buildIntentConfigs: PlatformGenerator.IntentConfiguration[] = [];
        // Contains the utterances generated from the utterance templates
        const utterances: { [intent: string]: string[] } = {};

        // Create build dir
        fs.mkdirSync(localeBuildDirectory);

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

        // Build GenerateIntentConfiguration[] array based on these utterances and the found intents
        this.intents.forEach(currIntent => {
          let phrases: string[] = [];

          // Associate utterances to intent
          if (typeof currIntent === "string") {
            phrases = utterances[currIntent + "Intent"];
          } else {
            const baseName = GenericIntent[currIntent] + "GenericIntent";
            phrases = utterances[baseName.charAt(0).toLowerCase() + baseName.slice(1)];
          }
          if (typeof phrases === "undefined") phrases = [];

          // Associate parameters
          let parameters =
            phrases
              // Match all {parameters}
              .map(phrase => phrase.match(/\{(\w+)?\}/g))

              // Create one array with all matches
              .reduce((prev, curr) => {
                if (curr !== null) {
                  // Remove "{", "}"
                  curr.forEach(parameter => (prev as string[]).push(parameter.replace(/\{|\}/g, "")));
                }
                return prev;
              }, []) || [];

          // Remove duplicates from array
          parameters = [...new Set(parameters)];

          // Check for parameters in utterances which have no mapping
          const unmatchedParameter = parameters.find(
            name => typeof parameterMapping[name as string] === "undefined" && typeof customEntities[name as string] === "undefined"
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
            customEntities,
            utterances: phrases,
            entities: parameters,
            intent: currIntent,
          });
        });

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
      const values: string[] = [];
      template = template
        // Convert entities in custom entity syntax
        .replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return "{{-|" + param + "}}";
        })
        // Extract all possible values and substitute them with a placeholder
        .replace(/\{([A-Za-z0-9_äÄöÖüÜß,;'"\|\s]+)\}(?!\})/g, (match, param) => {
          values.push(param.split("|"));
          return `{${values.length - 1}}`;
        });

      // Generate all possible combinations with cartesian product
      if (values.length > 0) {
        const combinations = combinatorics.cartesianProduct.apply(combinatorics, values).toArray();
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
   * Return the user defined utterance templates for each language in locales folder
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
}
