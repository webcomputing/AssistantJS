import { inject, injectable, multiInject, optional } from "inversify";
import { Component } from "ioc-container";
import * as fs from "fs";
import * as generateUtterances from "alexa-utterances"; // We are only using alexa-independet stuff here
import { GenericIntent, intent } from "./interfaces";
import { GeneratorExtension } from "../root/interfaces";

import { PlatformGenerator, componentInterfaces, Configuration, GenerateIntentConfiguration, GeneratorEntityMapping, GeneratorUtteranceTemplateService } from "./interfaces";

@injectable()
export class Generator implements GeneratorExtension {
  private platformGenerators: PlatformGenerator[] = [];
  private entitiyMappings: GeneratorEntityMapping[] = [];
  private additionalUtteranceTemplatesServices: GeneratorUtteranceTemplateService[] = [];
  private intents: intent[] = [];
  private configuration: Configuration;

  constructor(
    @inject("meta:component//core:unifier") componentMeta: Component, 
    @inject("core:state-machine:used-intents") intents: intent[] = [],
    @multiInject(componentInterfaces.platformGenerator) @optional() generators: PlatformGenerator[] = [],
    @multiInject(componentInterfaces.utteranceTemplateService) @optional() utteranceServices: GeneratorUtteranceTemplateService[] = [],
    @multiInject(componentInterfaces.entityMapping) @optional() entitiyMappings: GeneratorEntityMapping[] = []
  ) {
    this.configuration = componentMeta.configuration;
    this.intents = intents;
    this.platformGenerators = generators;
    this.additionalUtteranceTemplatesServices = utteranceServices;
    this.entitiyMappings = entitiyMappings;
  }

  execute(buildDir: string) {
    // Combine all registered parameter mappings to single object
    let parameterMapping = this.entitiyMappings.reduce((prev, curr) => Object.assign(prev, curr), {});

    // Get utterance templates per language
    let templatesPerLanguage = this.getUtteranceTemplatesPerLanguage();

    // For each found language...
    Object.keys(templatesPerLanguage).forEach(language => {
      let buildIntentConfigs: GenerateIntentConfiguration[] = [];

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
        let parameters = utterances
          // Match all {parameters}
          .map(utterance => utterance.match(/\{(\w+)?\}/g))

          // Create one array with all matches
          .reduce((prev, curr) => {
            if (curr !== null) {
              // Remove "{", "}"
              curr.forEach(parameter => (prev as string[]).push(parameter.replace(/\{|\}/g, "")));
            }
            return prev;
          }, [])

          // Remove duplicates from this one array
          .filter((element, position, self) => self.indexOf(element) === position);

        // Check for parameters in utterances which have no mapping
        let unmatchedParameter = parameters.find(name => typeof(parameterMapping[name as string]) === "undefined");
        if (typeof(unmatchedParameter) === "string")
          throw Error("Unknown parameter '" + unmatchedParameter + "' found in utterances of intent '" + intent + "'. \n" +
            "Either you misspelled your parameter in one of the intents utterances or you did not define a type mapping for it.");

        buildIntentConfigs.push({
          utterances: utterances,
          intent: intent,
          entities: parameters
        });
      });

      // Call all platform generators
      this.platformGenerators.forEach(generator =>
        generator.execute(language, languageSpecificBuildDir, buildIntentConfigs.map(config => Object.assign({}, config)), Object.assign({}, parameterMapping)));
    });
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
    let utterancesDir = this.configuration.utterancePath as string;
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