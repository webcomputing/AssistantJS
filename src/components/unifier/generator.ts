import { inject, injectable, multiInject, optional } from "inversify";
import { cartesianProduct } from "js-combinatorics";
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

    // Throws an missing utterances exception because no utterances are configured.
    if (configuredLanguages.length === 0) throw new Error("Currently no utterances are configured.");

    // Mappings of the registered entities
    const entityMappings = this.entityMappings.reduce((prev, curr) => ({ ...prev, ...curr }), {});

    // Configuration for PlatformGenerator
    const buildIntentConfigs: PlatformGenerator.Multilingual<PlatformGenerator.IntentConfiguration[]> = this.prepareLanguageSpecificConfiguration(
      configuredLanguages,
      utteranceTemplates,
      customEntities,
      entityMappings
    );
    /**
     * Iterate through each found language and build the utterance corresponding to the users entities. (Call all platform generators)
     */
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

  private prepareLanguageSpecificConfiguration(
    configuredLanguages: string[],
    utteranceTemplates: PlatformGenerator.Multilingual<{ [intent: string]: string[] }>,
    customEntities: PlatformGenerator.Multilingual<PlatformGenerator.CustomEntityMapping>,
    entityMappings: PlatformGenerator.EntityMapping
  ) {
    /** Utterances for each language  */
    const utterances: PlatformGenerator.Multilingual<{ [intent: string]: string[] }> = {};

    // Configuration for PlatformGenerator
    const buildIntentConfigs: PlatformGenerator.Multilingual<PlatformGenerator.IntentConfiguration[]> = {};

    // Prepare language specific configuration
    configuredLanguages.forEach((language: string) => {
      // Add utterances from extensions to current template and get the merged instance for the given language
      const mergedAdditionalUtteranceTemplatesServices = this.mergeAdditionalUtteranceTemplatesServices(language, utteranceTemplates);

      // Extract the intent names from the utterance template
      const intentNames = Object.keys(utteranceTemplates[language]);

      // Build utterances from templates
      intentNames.forEach(currIntent => {
        if (!utterances[language]) utterances[language] = {};

        utterances[language][currIntent] = this.generateUtterances(
          mergedAdditionalUtteranceTemplatesServices[currIntent],
          customEntities[language],
          entityMappings
        );
      });

      if (!buildIntentConfigs[language]) buildIntentConfigs[language] = [];
      // Build the intent configuration for each intent
      buildIntentConfigs[language].push(...this.intents.map(currIntent => this.buildIntentConfiguration(entityMappings, utterances, language, currIntent)));
    });

    return buildIntentConfigs;
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
   * Build the current intent configuration
   * @param {PlatformGenerator.EntityMapping} entityMappings The global configured entity mapping
   * @param {PlatformGenerator.Multilingual<{ [intent: string]: string[] }>} utterances All utterances for all intents in each language
   * @param {string} language Name of the current language
   * @param {intent} intent Name of the current intent
   * @returns { Object({ entities: string[], intent: intent, utterances: string[] })>} Intent configuration for the given intent with entities and utterances
   */
  private buildIntentConfiguration(
    entityMappings: PlatformGenerator.EntityMapping,
    utterances: PlatformGenerator.Multilingual<{ [intent: string]: string[] }>,
    language: string,
    intent: intent
  ) {
    /** Extract the utterances from the current intent */
    const intentUtterances: string[] = this.generateIntentUtterances(utterances, language, intent);

    // Extract entities from utterances
    const entities: string[] = this.generateEntities(intentUtterances);

    // Check for unmapped entities
    this.checkUnmatchedEntity(entities, entityMappings, intent);

    return { entities, intent, utterances: intentUtterances };
  }

  /**
   * Add utterances from extensions to current template
   * @param {string} language Current language
   * @param {PlatformGenerator.Multilingual<{ [intent: string]: string[] }>} utteranceTemplates All utterance templates for each intent in each language
   */
  private mergeAdditionalUtteranceTemplatesServices(language: string, utteranceTemplates: PlatformGenerator.Multilingual<{ [intent: string]: string[] }>) {
    return this.additionalUtteranceTemplatesServices.reduce((target, curr) => {
      const source = curr.getUtterancesFor(language);
      Object.keys(source).forEach(currIntent => {
        // Merge arrays of utterances or add intent to target
        target[currIntent] = target.hasOwnProperty(currIntent) ? target[currIntent].concat(source[currIntent]) : source[currIntent];
      });
      return target;
    }, utteranceTemplates[language]); // Initial value
  }

  /**
   * Check all entities for unmatched once and throw an exception if some unmatched entities are found
   * @param {string[]} entities List of all entities
   * @param {PlatformGenerator.EntityMapping} entityMappings List of all entity mappings
   * @param {intent} currentIntent The current intent
   * @throws Unknown entity error if unmatched entities are found
   */
  private checkUnmatchedEntity(entities: string[], entityMappings: PlatformGenerator.EntityMapping, currentIntent: intent) {
    const unmatchedEntity = entities.find(name => typeof entityMappings[name] === "undefined");
    if (typeof unmatchedEntity === "string") {
      throw Error(
        `Unknown entity '${unmatchedEntity}' found in utterances of intent '${currentIntent}'.\nEither you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. Your configured entity mappings are: ${JSON.stringify(
          Object.keys(entityMappings)
        )}`
      );
    }
  }

  /**
   * Generate the utterances for a given intent and language
   * @param utterances List of multilingual utterances for all intents
   * @param language Current language
   * @param currentIntent Current intent
   */
  private generateIntentUtterances(utterances: PlatformGenerator.Multilingual<{ [intent: string]: string[] }>, language: string, currentIntent: intent) {
    let intentUtterances: string[];
    // If no utterance for the current language will be given we have to set a default value.
    if (!utterances[language]) utterances[language] = {};

    // Associate utterances to intent
    if (typeof currentIntent === "string") {
      intentUtterances = utterances[language][`${currentIntent}Intent`];
    } else {
      const baseName = `${GenericIntent[currentIntent]}GenericIntent`;
      intentUtterances = utterances[language][baseName.charAt(0).toLowerCase() + baseName.slice(1)];
    }
    return intentUtterances || [];
  }

  /**
   * Extract the entities from the intent utterances
   * @param intentUtterances List of intent intent utterances
   */
  private generateEntities(intentUtterances: string[]): string[] {
    return [
      ...new Set(
        intentUtterances
          // Match all entities
          .map(utterance => utterance.match(/(?<=\{\{.*)(\w)+(?=\}\})/g))
          .filter(utterance => typeof utterance !== undefined && utterance !== null)
          // Flatting the given array
          .reduce((previousValue, currentValue) => {
            return [...previousValue!, ...currentValue!];
          }, []) || []
      ),
    ];
  }

  /**
   * Extract the entity slots and replace them with in placeholder
   * @param {string} utterance
   */
  private extractSlots(utterance: string) {
    const slots: string[][] = [];
    // Extract all matches from the given string and save these in an own variable.
    const utteranceTemplate = utterance.replace(/\{([^}]+)\}(?!\})/g, (match: string, param: string) => {
      slots.push(param.split("|"));
      // "This is a {test|test}" will be replaced by "This is a {0}"
      return `{${slots.length - 1}}`;
    });
    return { slots, utteranceTemplate };
  }

  /**
   * Generate permutations of utterances, based on the templates and entities
   * @param utteranceTemplates
   */
  private generateUtterances(
    utteranceTemplates: string[],
    entities: PlatformGenerator.CustomEntityMapping,
    entityMappings: PlatformGenerator.EntityMapping
  ): string[] {
    // Extract all slots and replace them with placeholder
    const preparedUtterancesWithPlaceholders: string[] = utteranceTemplates
      .map(template => this.prepareUtterances(template))
      .reduce((previousValue, currentValue) => previousValue.concat(currentValue));

    // Extract entities and extends utterances with each entity combination
    const prepareUtterancesInEachPermutation: string[] = preparedUtterancesWithPlaceholders
      .map(utterance => this.prepareUtterancesWithEntities(utterance, entities, entityMappings))
      .reduce((previousValue, currentValue) => previousValue.concat(currentValue));

    return prepareUtterancesInEachPermutation;
  }

  /**
   * Prepare the utterances. Extract entities and build the utterances for each given synonym.
   * @param utterance
   */
  private prepareUtterancesWithEntities(
    utterance: string,
    customEntityMapping: PlatformGenerator.CustomEntityMapping,
    entityMappings: PlatformGenerator.EntityMapping
  ) {
    const { utteranceTemplate, entitySlots } = this.extractUtteranceTemplateAndEntitySlots(utterance, customEntityMapping, entityMappings);
    // Auto-expand the utterance to build permutations
    const preparedUtterances = this.buildCartesianProduct(utteranceTemplate, entitySlots);

    return preparedUtterances.length > 0 ? preparedUtterances : [utterance];
  }

  /**
   * Extract the utteranceTemplate and entitySlots with all given synonyms
   * @param {string} utterance The original given utterance
   * @param {PlatformGenerator.CustomEntityMapping} customEntityMapping All configured custom entity mappings
   * @param {PlatformGenerator.EntityMapping} entityMappings All configured entity mappings
   */
  private extractUtteranceTemplateAndEntitySlots(
    utterance: string,
    customEntityMapping: PlatformGenerator.CustomEntityMapping,
    entityMappings: PlatformGenerator.EntityMapping
  ) {
    const entitySlots: string[][] = [];

    /**
     * Replace all entity placeholder with an uniq id and store the entity value an an global variable.
     * e.g. "This is {{a}} test" -> "This is {{{0}}} test"
     */
    const utteranceTemplate = utterance.replace(/((?<=\{\{)(\w+)\|?(\w+)*(?=\}\}))/g, (match: string, entityExample: string) => {
      const { slots, template } = this.prepareUtteranceTemplateWithEntities(match, entityExample, customEntityMapping, entityMappings, entitySlots.length);
      if (slots.length > 0) entitySlots.push(slots);
      return template;
    });

    return { utteranceTemplate, entitySlots };
  }

  /**
   * Replace utteranceTemplate entity placeholder with uniq identifier and extract synonyms for all entities without examples
   * @param {string} match current regular expression match
   * @param {string} entityExample first match of the regular expression.
   * @param {PlatformGenerator.CustomEntityMapping} customEntityMapping
   * @param {PlatformGenerator.EntityMapping} entityMappings
   * @param {number} index uniq index
   */
  private prepareUtteranceTemplateWithEntities(
    match: string,
    entityExample: string,
    customEntityMapping: PlatformGenerator.CustomEntityMapping,
    entityMappings: PlatformGenerator.EntityMapping,
    index: number
  ) {
    // Extract the entity name form the given match.
    const entityName = match.split("|").pop();

    /**
     * Check whether the current match is an single entity template like {{entity}}.
     */
    if (entityExample === entityName) {
      const entityValues = customEntityMapping[entityMappings[entityName]];

      const extraction = this.extractingSlotsAndReplaceTemplateByIndex(entityValues, entityName, index);
      if (extraction) {
        return extraction;
      }
    }
    /**
     * Returning the original text if it's not a single entity template
     */
    return { slots: [], template: match };
  }

  /**
   * Check whether the entityValues is not empty has synonyms and match the synonyms to the current index.
   * @param {Array<{ value: string; synonyms?: string[] | undefined }>} entityValues Array of all entities
   * @param {string} entityName Name of the current entity
   * @param {number} index Index for the current entity
   */
  private extractingSlotsAndReplaceTemplateByIndex(entityValues: Array<{ value: string; synonyms?: string[] | undefined }>, entityName: string, index: number) {
    if (this.entityValuesIsNotEmpty(entityValues)) {
      const currentEntityValue = entityValues.find(customEntity => customEntity.value === entityName);

      if (currentEntityValue && currentEntityValue.synonyms) {
        /**
         * We have to replace the current match with an uniq index (placeholder).
         * Its needed because we want to replace this placeholder with each matching synonym.
         */
        return {
          slots: [...currentEntityValue.synonyms, currentEntityValue.value],
          template: `{${index}}|${entityName}`,
        };
      }
    }
  }

  /**
   * Check if the entity values are not undefined and not empty
   * @param entityValues
   */
  private entityValuesIsNotEmpty(entityValues: undefined | Array<{ value: string; synonyms?: string[] }>) {
    return typeof entityValues !== "undefined" && entityValues.length > 0;
  }

  /**
   * Prepare the given utterance template. Replace all template literals and replace them with the correct values
   * @param utterance
   */
  private prepareUtterances(utterance: string) {
    const { slots, utteranceTemplate } = this.extractSlots(utterance);
    // Auto-expand the template to build utterance permutations
    const utterancePermutations = this.buildCartesianProduct(utteranceTemplate, slots);

    /** If the utterance permutations contains any values these once will be used otherwise the original utterance template will be selected */
    return utterancePermutations.length > 0 ? utterancePermutations : [utterance];
  }

  /**
   * Create a cartesian product of all given synonyms for the utterance template
   * @param {string} utteranceTemplate The current prepared utterance template string
   * @param {string[][]} synonyms Array of all synonym prepared for the cartesian product
   * @returns {string[]} List of utterances for each synonym
   */
  private buildCartesianProduct(utteranceTemplate: string, synonyms: string[][]): string[] {
    let utterancesCombinations: string[] = [];

    if (synonyms.length > 0) {
      /**
       * Creates the cartesian product of all given synonyms
       */
      const combinations = cartesianProduct(...synonyms).toArray();

      utterancesCombinations = combinations.map(combination => {
        let currentTemplate = utteranceTemplate;
        // Replace all synonym placeholder with the fitting synonym from the cartesian product
        combination.forEach((synonym, index) => {
          currentTemplate = currentTemplate.replace(`{${index}}`, synonym);
        });
        return currentTemplate;
      });
    }

    return utterancesCombinations;
  }
}
