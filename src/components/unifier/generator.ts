import * as generateUtterances from "alexa-utterances"; // We are only using alexa-independet stuff here
import * as fs from "fs";
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

    // Get utterance templates per language
    const templatesPerLanguage = this.getUtteranceTemplatesPerLanguage();

    // For each found language...
    const promises = Object.keys(templatesPerLanguage)
      .map(language => {
        const buildIntentConfigs: PlatformGenerator.IntentConfiguration[] = [];

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
          currentTemplates[currIntent] = this.buildUtterances(currentTemplates[currIntent]);
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
          const parameters =
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
              }, []) ||
            []

              // Remove duplicates from this one array
              .filter((element, position, self) => self.indexOf(element) === position);

          // Check for parameters in utterances which have no mapping
          const unmatchedParameter = parameters.find(name => typeof parameterMapping[name as string] === "undefined");
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
            entities: parameters,
            intent: currIntent,
            utterances,
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

  public buildUtterances(templateStrings: string[]): string[] {
    return (
      templateStrings
        // conert {{param}} into {-|param} for alexa-utterances
        .map(templateString => templateString.replace(/\{\{(\w+)\}\}/g, (match, param) => "{-|" + param + "}"))
        .map(templateString => generateUtterances(templateString))
        .reduce((prev, curr) => prev.concat(curr), [])
    );
  }

  public getUtteranceTemplatesPerLanguage(): { [language: string]: { [intent: string]: string[] } } {
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

  private mergeUtterances(target: { [intent: string]: string[] }, source: { [intent: string]: string[] }) {
    Object.keys(source).forEach(currIntent => {
      // Merge arrays of utterances or add intent to target
      target[currIntent] = target.hasOwnProperty(currIntent) ? target[currIntent].concat(source[currIntent]) : source[currIntent];
    });

    return target;
  }
}
