import * as fs from "fs";
import { inject, injectable } from "inversify";
import { Component, getMetaInjectionName } from "inversify-components";
import * as path from "path";
import * as requireDir from "require-directory";

import { injectionNames } from "../../injection-names";
import { I18nConfiguration } from "../i18n/public-interfaces";
import { Logger } from "../root/public-interfaces";
import { Configuration } from "./private-interfaces";
import { LocalesLoader as ILocalesLoader, PlatformGenerator } from "./public-interfaces";

@injectable()
export class LocalesLoader implements ILocalesLoader {
  private configuration: Configuration.Runtime;

  // For caching values read from file system
  private locales?: PlatformGenerator.Multilingual<{ translation: any; entities: any; utterances: any }>;

  constructor(
    @inject(getMetaInjectionName("core:unifier")) componentMeta: Component<Configuration.Runtime>,
    @inject(getMetaInjectionName("core:i18n")) private i18nComponentMeta: Component<I18nConfiguration>,
    @inject(injectionNames.logger) private logger: Logger
  ) {
    this.configuration = componentMeta.configuration;
  }

  /**
   * Return the user defined utterance templates for each language found in locales folder
   */
  public getUtteranceTemplates(): PlatformGenerator.Multilingual<{ [intent: string]: string[] }> {
    return Object.entries(this.getLocales() || {}).reduce((utterances, [lang, locale]) => ({ ...utterances, [lang]: locale.utterances }), {});
  }

  /**
   * Return the user defined entities for each language found in locales folder
   */
  public getCustomEntities(): PlatformGenerator.Multilingual<PlatformGenerator.CustomEntityMapping> {
    return Object.entries(this.getLocales() || {}).reduce((entities, [lang, locale]) => ({ ...entities, [lang]: locale.entities }), {});
  }

  /**
   * Return the user defined translations for each language found in locales folder
   */
  public getTranslations() {
    return Object.entries(this.getLocales() || {}).reduce((translations, [lang, locale]) => ({ ...translations, [lang]: locale.translation }), {});
  }

  /**
   * Return the user defined locales for each language
   */
  public getLocales(): PlatformGenerator.Multilingual<{ translation: any; entities: any; utterances: any }> | undefined {
    if (this.locales !== undefined) {
      // Use cached data
      return this.locales;
    }

    return (this.locales = LocalesLoader.requireDir(this.configuration.utterancePath || path.join(process.cwd(), "js", "config", "locales")));
  }

  /**
   * Returns camelcase of input string
   */
  private static camelcase(input: string) {
    return input.replace(/[\-]+([a-s])/gi, (m, c) => c.toUpperCase());
  }

  /**
   * Recursively requires locales from a given directory
   */
  private static requireDir(p: string) {
    const absolutePath = path.isAbsolute(p) ? p : path.join(process.cwd(), p);

    if (!fs.existsSync(absolutePath)) {
      return undefined;
    }

    return requireDir(module, path.relative(__dirname, absolutePath), {
      exclude: (absPath, filename) => {
        // Logic to prioritize .ts before .js before .json
        const withoutExtension = absPath.slice(0, -path.extname(filename).length);
        if (path.extname(filename) === ".json") {
          return fs.existsSync(`${withoutExtension}.ts`) || fs.existsSync(`${withoutExtension}.js`);
        }
        if (path.extname(filename) === ".js") {
          return fs.existsSync(`${withoutExtension}.ts`);
        }
      },
      extensions: ["ts", "js", "json"],
      visit: (obj, filepath, fn) => {
        let result = obj.default || obj[LocalesLoader.camelcase(path.basename(fn, path.extname(fn)))];

        // If there's a directory with the same name as the file, it's merged but can be overridden by the current file
        const filenameAsDirname = path.join(path.dirname(filepath), path.basename(filepath, path.extname(__filename)));
        if (fs.existsSync(filenameAsDirname) && fs.statSync(filenameAsDirname).isDirectory()) {
          result = { ...LocalesLoader.requireDir(filenameAsDirname), ...result };
        }

        // Extract only one object from the module: either that one with the camelcase filename as the file or default
        return result;
      },
      rename: fn => {
        return LocalesLoader.camelcase(fn);
      },
    });
  }
}
