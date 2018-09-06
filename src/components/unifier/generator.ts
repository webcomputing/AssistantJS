import * as fs from "fs";
import * as combinatorics from "js-combinatorics";
import { inject, injectable, multiInject, optional } from "inversify";
import { Component } from "inversify-components";
import { CLIGeneratorExtension } from "../root/public-interfaces";
import { componentInterfaces, Configuration } from "./private-interfaces";
import { GenericIntent, intent, PlatformGenerator, CustomEntity } from "./public-interfaces";
import { EntityMapper } from "./entity-mapper";

@injectable()
export class Generator implements CLIGeneratorExtension {
  private platformGenerators: PlatformGenerator.Extension[] = [];
  private additionalUtteranceTemplatesServices: PlatformGenerator.UtteranceTemplateService[] = [];
  private intents: intent[] = [];
  private configuration: Configuration.Runtime;
  private entityMapper: EntityMapper;

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
    @inject("core:unifier:entity-mapper")
    @optional()
    entityMapper: EntityMapper
  ) {
    // Set default values. Setting them in the constructor leads to not calling the injections
    [intents, generators, utteranceServices, entityMapper].forEach(v => {
      // tslint:disable-next-line:no-parameter-reassignment
      if (typeof v === "undefined") v = [];
    });

    this.configuration = componentMeta.configuration;
    this.intents = intents;
    this.platformGenerators = generators;
    this.additionalUtteranceTemplatesServices = utteranceServices;
    this.entityMapper = entityMapper;
  }

  public async execute(buildDir: string): Promise<void> {
    // Get the main utterance templates for each defined language
    const utteranceTemplates = this.getUtteranceTemplates();

    // Iterate through each found language and build the utterance corresponding to the users entities
    const generatorPromises = Object.keys(utteranceTemplates)
      .map(language => {
        // Language specific build directory
        const localeBuildDirectory = buildDir + "/" + language;
        // Configuration for PlatformGenerator
        const buildIntentConfigs: PlatformGenerator.IntentConfiguration[] = [];
        // Contains the utterances generated from the utterance templates
        const utterances: { [intent: string]: string[] } = {};

        // Create build dir
        fs.mkdirSync(localeBuildDirectory);

        console.log("EntityMapper: ", JSON.stringify(this.entityMapper));

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
          utterances[currIntent] = this.generateUtterances(utteranceTemplates[language][currIntent], language);
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

          // Extract entities from utterances
          const entities: string[] = [
            ...new Set(
              intentUtterances
                // Match all entities
                .map(utterance => utterance.match(/(?<=\{\{[A-Za-z0-9_äÄöÖüÜß,;'"\|-\s]*)(\w)+(?=\}\})/g))
                // Flatten array
                .reduce((prev, curr) => {
                  if (curr !== null) {
                    curr.forEach(parameter => (prev as string[]).push(parameter));
                  }
                  return prev;
                }, []) || []
            ),
          ];

          // Check for unmapped entities
          const unmatchedEntity = entities.find(name => typeof this.entityMapper.get(name) === "undefined");
          if (typeof unmatchedEntity === "string") {
            throw Error(
              "Unknown entity '" +
                unmatchedEntity +
                "' found in utterances of intent '" +
                currIntent +
                "'. \n" +
                "Either you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. " +
                "Your configured entity mappings are: " +
                JSON.stringify(this.entityMapper.getNames())
            );
          }

          buildIntentConfigs.push({
            utterances: intentUtterances,
            entities,
            intent: currIntent,
          });
        });

        console.log("Intentconfigs: ", buildIntentConfigs);

        // Call all platform generators
        return this.platformGenerators.map(generator =>
          Promise.resolve(generator.execute(language, localeBuildDirectory, buildIntentConfigs.map(config => JSON.parse(JSON.stringify(config)))))
        );
      })
      .reduce((prev, curr) => prev.concat(curr));

    // Wait for all platform generators to finish
    await Promise.all(generatorPromises);
  }

  /**
   * Generate an array of utterances, based on the utterance templates and entities
   * @param templates
   */
  private generateUtterances(templates: string[], language: string): string[] {
    const utterances: string[] = [];
    const preUtterances: string[] = [];

    // Extract all slots and substitute them with a placeholder
    templates.map(template => {
      const slots: string[][] = [];

      // Set placeholder
      template = template.replace(/\{([A-Za-z0-9_äÄöÖüÜß,;'"\|\s]+)\}(?!\})/g, (match: string, param: string) => {
        slots.push(param.split("|"));
        return `{${slots.length - 1}}`;
      });

      // Build all possible combinations
      const result = this.buildCartesianProduct(template, slots, /\{(\d+)\}/g);
      if (result.length > 0) {
        preUtterances.push(...result);
      } else {
        preUtterances.push(template);
      }
    });

    // Extend utterances with entity combinations
    preUtterances.map(utterance => {
      const slots: string[][] = [];

      // Set placeholder
      utterance = utterance.replace(/(?<=\{\{)([[A-Za-z0-9_äÄöÖüÜß-]+)\|(\w+)*(?=\}\})/g, (match: string, value: string, name: string) => {
        const entityMap = this.entityMapper.get(name);

        if (typeof entityMap !== "undefined" && typeof entityMap.values !== "undefined") {
          if (value === "-") {
            entityMap.values[language].forEach(param => {
              slots.push([...param.synonyms, param.value]);
            });
            return `${slots.length - 1}|${name}`;
          }
        }
        return `${value}|${name}`;
      });

      /// Build all possible entity combinations
      const result = this.buildCartesianProduct(utterance, slots, /(?<=[\{]+)(\d+)(?=\|)/g);
      if (result.length > 0) {
        utterances.push(...result);
      } else {
        utterances.push(utterance);
      }
    });

    return utterances;
  }

  /**
   * Return the set of all ordered pair of elements
   * @param template
   * @param slots
   * @param repRegExp
   */
  private buildCartesianProduct(template: string, slots: string[][], placeholderExp: RegExp): string[] {
    const result: string[] = [];
    if (slots.length > 0) {
      const combinations = combinatorics.cartesianProduct.apply(combinatorics, slots).toArray();
      // Substitute placeholders with combinations
      combinations.forEach(combi => {
        result.push(
          template.replace(placeholderExp, (match, param) => {
            return combi[param];
          })
        );
      });
    }
    return result;
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
}
