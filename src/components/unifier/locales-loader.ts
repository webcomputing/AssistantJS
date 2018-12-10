import * as fs from "fs";
import { inject, injectable } from "inversify";
import { Component } from "inversify-components";
import * as path from "path";
import { Configuration, LocalesLoader as ILocalesLoader } from "./private-interfaces";
import { PlatformGenerator } from "./public-interfaces";

@injectable()
export class LocalesLoader implements ILocalesLoader {
  private configuration: Configuration.Runtime;

  constructor(@inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>) {
    this.configuration = componentMeta.configuration;
  }

  /**
   * Return the user defined utterance templates for each language found in locales folder
   */
  public getUtteranceTemplates(): { [language: string]: { [intent: string]: string[] } } {
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
  public getCustomEntities(): { [language: string]: PlatformGenerator.CustomEntityMapping } {
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
