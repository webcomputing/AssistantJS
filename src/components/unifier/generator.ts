import * as fs from "fs";
import { inject, injectable, multiInject, optional } from "inversify";
import * as combinatorics from "js-combinatorics";
import { injectionNames } from "../../injection-names";
import { CLIGeneratorExtension } from "../root/public-interfaces";
import { componentInterfaces } from "./private-interfaces";
import { GenericIntent, intent, LocalesLoader, PlatformGenerator } from "./public-interfaces";

type DEFAULT_REFERENCES = "intents" | "platformGenerators" | "additionalUtteranceTemplatesServices" | "entityMappings";

@injectable()
export class Generator implements CLIGeneratorExtension {
  constructor(
    @inject(injectionNames.localesLoader) private localesLoader: LocalesLoader,
    @inject(injectionNames.usedIntents) @optional() private intents: intent[],
    @multiInject(componentInterfaces.platformGenerator) @optional() private platformGenerators: PlatformGenerator.Extension[],
    @multiInject(componentInterfaces.utteranceTemplateService)
    @optional()
    private additionalUtteranceTemplatesServices: PlatformGenerator.UtteranceTemplateService[],
    @multiInject(componentInterfaces.entityMapping) @optional() private entityMappings: PlatformGenerator.EntityMapping[]
  ) {
    // Set default values. Setting them in the constructor leads to not calling the injections
    const defaultReferences: DEFAULT_REFERENCES[] = ["intents", "platformGenerators", "additionalUtteranceTemplatesServices", "entityMappings"];
    defaultReferences.forEach((value: DEFAULT_REFERENCES) => this.setDefaultValuesFor(value));
  }
  public async execute(buildDir: string): Promise<void> {
    // Get the main utterance templates from locales folder
    const utteranceTemplates = this.localesLoader.getUtteranceTemplates();

    // Get the entities from locales folder
    const customEntities = this.localesLoader.getCustomEntities();

    // Get all configured language keys from utterance templates
    const configuredLanguages = Object.keys(utteranceTemplates);

    // Throws an missing utterances exception because no utterances will be configured.
    if (configuredLanguages.length === 0) throw new Error("Currently no utterances are configured.");

    // Mappings of the registered entities
    const entityMappings = this.entityMappings.reduce((prev, curr) => ({ ...prev, ...curr }), {});

    /** Utterances for each language  */
    const utterances: PlatformGenerator.Multilingual<{ [intent: string]: string[] }> = {};

    // Configuration for PlatformGenerator
    const buildIntentConfigs: PlatformGenerator.Multilingual<PlatformGenerator.IntentConfiguration[]> = {};

    // Prepare language specific configuration
    configuredLanguages.forEach(language => {
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
        if (!utterances[language]) utterances[language] = {};
        utterances[language][currIntent] = this.generateUtterances(utteranceTemplates[language][currIntent], customEntities[language], entityMappings);
      });

      // Build GenerateIntentConfiguration[] array based on these utterances and the found intents
      this.intents.forEach(currIntent => {
        let intentUtterances: string[] = [];

        // If no utterance for the current language will be given we have to set a default value.
        if (!utterances[language]) utterances[language] = {};

        // Associate utterances to intent
        if (typeof currIntent === "string") {
          intentUtterances = utterances[language][currIntent + "Intent"];
        } else {
          const baseName = GenericIntent[currIntent] + "GenericIntent";
          intentUtterances = utterances[language][baseName.charAt(0).toLowerCase() + baseName.slice(1)];
        }

        // When utterances are "undefined", assign empty array
        if (typeof intentUtterances === "undefined") intentUtterances = [];
        // Extract entities from utterances
        const entities: string[] = [
          ...new Set(
            intentUtterances
              // Match all entities
              .map(utterance => utterance.match(/(?<=\{\{.*)(\w)+(?=\}\})/g))
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
            `Unknown entity '${unmatchedEntity}' found in utterances of intent '${currIntent}'.\nEither you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. Your configured entity mappings are: ${JSON.stringify(
              Object.keys(entityMappings).map(name => {
                return name;
              })
            )}`
          );
        }

        if (!buildIntentConfigs[language]) buildIntentConfigs[language] = [];
        buildIntentConfigs[language].push({
          entities,
          intent: currIntent,
          utterances: intentUtterances,
        });
      });
    });

    // Iterate through each found language and build the utterance corresponding to the users entities
    // Call all platform generators
    const generatorPromises = this.platformGenerators.map(generator =>
      Promise.resolve(
        generator.execute(
          configuredLanguages,
          buildDir,
          buildIntentConfigs,
          JSON.parse(JSON.stringify(entityMappings)),
          JSON.parse(JSON.stringify(customEntities))
        )
      )
    );

    // Wait for all platform generators to finish
    await Promise.all(generatorPromises);
  }

  /**
   * Set an empty array as default value if the reference variable is undefined.
   * @param reference: "intents" | "platformGenerators" | "additionalUtteranceTemplatesServices" | "entityMappings"
   */
  private setDefaultValuesFor(reference: DEFAULT_REFERENCES) {
    if (typeof this[reference] === "undefined") {
      this[reference] = [];
    }
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
      const repTemplate = template.replace(/\{([^}]+)\}(?!\})/g, (match: string, param: string) => {
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

      const repUtterance = utterance.replace(/(?<=\{\{)(.+)\|?(\w+)*(?=\}\})/g, (match: string, entityValue: string) => {
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
    if (slots.length > 0 && slots[0].length > 0) {
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
}
