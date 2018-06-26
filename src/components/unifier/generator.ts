import { inject, injectable, multiInject, optional } from "inversify";
import { Component } from "inversify-components";
import * as fs from "fs";
import * as generateUtterances from "alexa-utterances"; // We are only using alexa-independet stuff here
import { GenericIntent, intent } from "./public-interfaces";
import { CLIGeneratorExtension } from "../root/public-interfaces";

import { PlatformGenerator } from "./public-interfaces";
import { componentInterfaces, Configuration } from "./private-interfaces";

@injectable()
export class Generator implements CLIGeneratorExtension {
  private platformGenerators: PlatformGenerator.Extension[] = [];
  private entityMappings: PlatformGenerator.EntityMapping[] = [];
  private additionalUtteranceTemplatesServices: PlatformGenerator.UtteranceTemplateService[] = [];
  private intents: intent[] = [];
  private configuration: Configuration.Runtime;

  constructor(
    @inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>, 
    @inject("core:state-machine:used-intents") @optional() intents: intent[],
    @multiInject(componentInterfaces.platformGenerator) @optional() generators: PlatformGenerator.Extension[],
    @multiInject(componentInterfaces.utteranceTemplateService) @optional() utteranceServices: PlatformGenerator.UtteranceTemplateService[],
    @multiInject(componentInterfaces.entityMapping) @optional() entityMappings: PlatformGenerator.EntityMapping[]
  ) {
    // Set default values. Setting them in the constructor leads to not calling the injections
    [intents, generators, utteranceServices, entityMappings].forEach(v =>  { if (typeof v === "undefined") v = [] } )

    this.configuration = componentMeta.configuration;
    this.intents = intents;
    this.platformGenerators = generators;
    this.additionalUtteranceTemplatesServices = utteranceServices;
    this.entityMappings = entityMappings;
  }

  async execute(buildDir: string): Promise<void> {
    // Combine all registered parameter mappings to single object
    let parameterMapping = this.entityMappings.reduce((prev, curr) => Object.assign(prev, curr), {});

    // Get utterance templates per language
    let templatesPerLanguage = this.getUtteranceTemplatesPerLanguage();

    // For each found language...
    const promises = Object.keys(templatesPerLanguage).map(language => {
      let buildIntentConfigs: PlatformGenerator.IntentConfiguration[] = [];

      // Create language specific build dir
      let languageSpecificBuildDir = buildDir + "/" + language;
      fs.mkdirSync(languageSpecificBuildDir);

      // Add additional utterances from extensions to current templates
      let currentTemplates = this.additionalUtteranceTemplatesServices.reduce((prev, curr) =>
        this.mergeUtterances(prev, curr.getUtterancesFor(language)), templatesPerLanguage[language]);

      // ... convert templates into built utterances
      Object.keys(currentTemplates).forEach(intent => {
        currentTemplates[intent] = this.buildUtterances(currentTemplates[intent]);
      });

      // ... build the GenerateIntentConfiguration[] array based on these utterances and the found intents
      this.intents.forEach(intent => {
        let utterances: string[] = [];

        // Associate utterances to intent
        if (typeof(intent) === "string") {
          utterances = currentTemplates[intent + "Intent"];
        } else {
          let baseName = GenericIntent[intent] + "GenericIntent";
          utterances = currentTemplates[baseName.charAt(0).toLowerCase() + baseName.slice(1)];
        }
        if (typeof(utterances) === "undefined") utterances = [];

        // Associate parameters
        let parameters = (utterances
          // Match all {parameters}
          .map(utterance => utterance.match(/\{(\w+)?\}/g))

          // Create one array with all matches
          .reduce((prev, curr) => {
            if (curr !== null) {
              // Remove "{", "}"
              curr.forEach(parameter => (prev as string[]).push(parameter.replace(/\{|\}/g, "")));
            }
            return prev;
          }, []) || [])

          // Remove duplicates from array
          parameters = [...new Set(parameters)];

        // Check for parameters in utterances which have no mapping
        let unmatchedParameter = parameters.find(name => typeof(parameterMapping[name as string]) === "undefined");
        if (typeof(unmatchedParameter) === "string")
          throw Error("Unknown entity '" + unmatchedParameter + "' found in utterances of intent '" + intent + "'. \n" +
            "Either you misspelled your entity in one of the intents utterances or you did not define a type mapping for it. " + 
            "Your configured entity mappings are: " + JSON.stringify(this.entityMappings));

        buildIntentConfigs.push({
          utterances: utterances,
          intent: intent,
          entities: parameters
        });
      });

      // Call all platform generators
      return this.platformGenerators.map(generator =>
        Promise.resolve(generator.execute(language, languageSpecificBuildDir, buildIntentConfigs.map(config => Object.assign({}, config)), Object.assign({}, parameterMapping))));
    }).reduce((prev, curr) => prev.concat(curr));

    // Wait for all platform generators to finish
    await Promise.all(promises);
  }

  buildUtterances(templateStrings: string[]): string[] {
    return templateStrings
      // conert {{param}} into {-|param} for alexa-utterances
      .map(templateString => templateString.replace(/\{\{(\w+)\}\}/g, (_match, param) => "{-|" + param + "}"))
      .map(templateString => generateUtterances(templateString))
      .reduce((prev, curr) => prev.concat(curr), []);
  }

  getUtteranceTemplatesPerLanguage(): {[language: string]: {[intent: string]: string[]}} {
    let utterances = {};
    let utterancesDir = this.configuration.utterancePath;
    let languages = fs.readdirSync(utterancesDir);
    languages.forEach(language => {
      let utterancePath = utterancesDir + "/" + language + "/utterances.json";
      if (fs.existsSync(utterancePath)) {
        let current = JSON.parse(fs.readFileSync(utterancePath).toString());
        utterances[language] = current;
      }
    });

    return utterances;
  }

  private mergeUtterances(target: {[intent: string]: string[] }, source: {[intent: string]: string[]}) {
    Object.keys(source).forEach(intent => {
      if (target.hasOwnProperty(intent)) {
        // Merge arrays of utterances
        target[intent] = target[intent].concat(source[intent]);
      } else {
        // Add intent to target
        target[intent] = source[intent];
      }
    });

    return target;
  }
}