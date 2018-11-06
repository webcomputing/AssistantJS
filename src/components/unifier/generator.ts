import * as fs from "fs";
import { inject, injectable, multiInject, optional } from "inversify";
import { Component } from "inversify-components";
import * as combinatorics from "js-combinatorics";
import * as path from "path";
import { CLIGeneratorExtension } from "../root/public-interfaces";
import { componentInterfaces, Configuration } from "./private-interfaces";
import { GenericIntent, intent, PlatformGenerator } from "./public-interfaces";

@injectable()
export class Generator implements CLIGeneratorExtension {
  private intents: intent[] = [];
  private configuration: Configuration.Runtime;
  private entityMappings: PlatformGenerator.EntityMapping[] = [];
  private platformGenerators: PlatformGenerator.Extension[] = [];
  private additionalUtteranceTemplatesServices: PlatformGenerator.UtteranceTemplateService[] = [];

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

    this.intents = intents;
    this.platformGenerators = generators;
    this.entityMappings = entityMappings;
    this.configuration = componentMeta.configuration;
    this.additionalUtteranceTemplatesServices = utteranceServices;
  }

  public async execute(buildDir: string): Promise<void> {
    // Get the main utterance templates from locales folder
    const utteranceTemplates = this.getUtteranceTemplates();
    // Get the entities from locales folder
    const customEntities = this.getEntities();

    // Iterate through each found language and build the utterance corresponding to the users entities
    const generatorPromises = Object.keys(utteranceTemplates)
      .map(language => {
        // Language specific build directory
        const localeBuildDirectory = buildDir + "/" + language;
        // Contains the utterances generated from the utterance templates
        const utterances: { [intent: string]: string[] } = {};
        // Mappings of the registered entities
        const entityMappings = this.entityMappings.reduce((prev, curr) => ({ ...prev, ...curr }), {});
        // Configuration for PlatformGenerator
        const buildIntentConfigs: PlatformGenerator.IntentConfiguration[] = [];

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
          utterances[currIntent] = this.generateUtterances(utteranceTemplates[language][currIntent], customEntities[language], entityMappings);
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

          // When utterances are "undefined", assign empty array
          if (typeof intentUtterances === "undefined") intentUtterances = [];

          // Extract entities from utterances
          const entities: string[] = [
            ...new Set(
              intentUtterances
                // Match all entities
                .map(utterance => utterance.match(/(?<=\{\{[A-Za-z0-9_äÄöÖüÜß,;'"\|\s]*)(\w)+(?=\}\})/g))
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
          const unmatchedEntity = entities.find(name => typeof entityMappings[name] === "undefined");
          if (typeof unmatchedEntity === "string") {
            throw Error(
              "Unknown entity '" +
                unmatchedEntity +
                "' found in utterances of intent '" +
                currIntent +
                "'. \n" +
                "Either you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. " +
                "Your configured entity mappings are: " +
                JSON.stringify(
                  Object.keys(entityMappings).map(name => {
                    return name;
                  })
                )
            );
          }

          buildIntentConfigs.push({
            entities,
            intent: currIntent,
            utterances: intentUtterances,
          });
        });

        // Call all platform generators
        return this.platformGenerators.map(generator =>
          Promise.resolve(
            generator.execute(
              language,
              localeBuildDirectory,
              buildIntentConfigs.map(config => JSON.parse(JSON.stringify(config))),
              JSON.parse(JSON.stringify(entityMappings)),
              JSON.parse(JSON.stringify(customEntities[language]))
            )
          )
        );
      })
      .reduce((prev, curr) => prev.concat(curr));

    // Wait for all platform generators to finish
    await Promise.all(generatorPromises);
  }

  /**
   * Generate permutations of utterances, based on the templates and entities
   * @param templates
   */
  private generateUtterances(templates: string[], entities: PlatformGenerator.CustomEntityMapping, entityMappings: PlatformGenerator.EntityMapping): string[] {
    const utterances: string[] = [];
    const preUtterances: string[] = [];

    // Extract all slots and substitute them with a placeholder
    templates.map(template => {
      const slots: string[][] = [];

      const repTemplate = template.replace(/\{([A-Za-z0-9_äÄöÖüÜß,;'"()-\|\s]+)\}(?!\})/g, (match: string, param: string) => {
        slots.push(param.split("|"));
        return `{${slots.length - 1}}`;
      });

      // Auto-expand the template to build utterance permutations
      const result = this.buildCartesianProduct(repTemplate, slots, /\{(\d+)\}/g);
      if (result.length > 0) {
        preUtterances.push(...result);
      } else {
        preUtterances.push(template);
      }
    });

    // Extract entities and expland utterances with entity combinations
    preUtterances.map(utterance => {
      const slots: string[][] = [];

      const repUtterance = utterance.replace(/(?<=\{\{)([A-Za-z0-9_äÄöÖüÜß,;'"()-\|\s]+)\|?(\w+)*(?=\}\})/g, (match: string, entityValue: string) => {
        const entityName = match.split("|").pop();

        // Iterate through values when no example like {{example|entity}} is given
        if (entityValue === entityName) {
          const entityType = entities[entityMappings[entityName]];
          if (typeof entityType !== "undefined") {
            const tmp: string[] = [];
            entityType.map(param => {
              tmp.push(...(param.synonyms || []), param.value);
            });
            slots.push(tmp);
            return `{${slots.length - 1}}|${entityName}`;
          }
        }
        return match;
      });

      // Auto-expand the utterance to build permutations
      const result = this.buildCartesianProduct(repUtterance, slots, /\{(\d+)\}/g);
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
      const utterancePath = path.join(utterancesDir, language, "/utterances.js");
      utterances[language] = this.loadJsOrJson(utterancePath);
    });
    return utterances;
  }

  /**
   * Return the user defined entities for each language found in locales folder
   */
  private getEntities(): { [language: string]: PlatformGenerator.CustomEntityMapping } {
    const entities = {};
    const localesDir = this.configuration.utterancePath;
    const languages = fs.readdirSync(this.configuration.utterancePath);
    languages.forEach(language => {
      const entitiesPath = path.join(localesDir, language, "entities.js");
      entities[language] = this.loadJsOrJson(entitiesPath);
    });

    return entities;
  }

  /**
   * Loader for JS modules or JSON files. Tries to load a JS module first, then a JSON file.
   */
  private loadJsOrJson(src: string) {
    const cwdRelativePath = path.relative(process.cwd(), src);
    const builtSource = path.join("js", cwdRelativePath);

    const ext = path.extname(cwdRelativePath);
    const jsSrc = cwdRelativePath.replace(new RegExp(`${ext}$`), "").concat(".js");
    const jsonSrc = cwdRelativePath.replace(new RegExp(`${ext}$`), "").concat(".json");

    // Load JS module with priority before JSON, because it could also load a JSON of same name
    try {
      return require(fs.existsSync(path.resolve(jsSrc)) ? path.resolve(jsSrc) : path.resolve(jsonSrc));
    } catch (e) {
      return require(fs.existsSync(path.resolve("js", jsSrc)) ? path.resolve("js", jsSrc) : path.resolve("js", jsonSrc));
    }
  }
}
