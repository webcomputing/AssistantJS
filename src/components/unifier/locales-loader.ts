import merge = require("lodash/merge");

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
  private static loadableExtensions = Object.keys(require.extensions).map(ext => ext.replace(/\.([a-z]+)$/i, "$1"));

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
    return this.extractNamespace("utterances");
  }

  /**
   * Return the user defined entities for each language found in locales folder
   */
  public getCustomEntities(): PlatformGenerator.Multilingual<PlatformGenerator.CustomEntityMapping> {
    return this.extractNamespace("entities");
  }

  /**
   * Return the user defined translations for each language found in locales folder
   */
  public getTranslations() {
    return this.extractNamespace("translation");
  }

  /**
   * Return the user defined locales for each language
   */
  public getLocales(): PlatformGenerator.Multilingual<{ translation: any; entities: any; utterances: any }> | undefined {
    if (this.locales !== undefined) {
      // Use cached data
      return this.locales;
    }

    // Part `rootPath` and the relative path to locales
    const utterancePath = path.relative(process.cwd(), this.configuration.utterancePath);
    const rootPath = process.cwd();

    // Load built locales such as TypeScript files in build folder
    const builtLocales = fs.existsSync(path.join(rootPath, "js", utterancePath))
      ? LocalesLoader.requireDir(path.join(rootPath, "js", utterancePath))
      : undefined;

    // Load unbuilt files such as JSON
    const unbuiltLocales = LocalesLoader.requireDir(path.join(rootPath, utterancePath));

    // Merge both while prioritizing unbuilt, so when testing the lastest TypeScript file outdoes built JavaScript files
    this.locales = unbuiltLocales === undefined && builtLocales === undefined ? undefined : merge(builtLocales, unbuiltLocales);

    return this.locales;
  }

  /**
   * Extract namespace from result of `getLocales`.
   * @param {string} ns Namespace to be extracted from locales
   */
  private extractNamespace(ns: string): PlatformGenerator.Multilingual<any> {
    return Object.entries(this.getLocales() || {}).reduce((namespace, [lang, locale]) => ({ ...namespace, [lang]: locale[ns] }), {});
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
      extensions: LocalesLoader.loadableExtensions,
      exclude: absPath => LocalesLoader.hasShadowingFile(absPath),
      visit: (obj, filepath) => LocalesLoader.mergeDirectories(obj, filepath),
      rename: fn => LocalesLoader.camelcase(fn),
    });
  }

  private static mergeDirectories(obj, absPath) {
    const fn = path.basename(absPath);

    // Extract only `default` or, if not available, object with camelcased name of file
    let result = obj.default || obj[LocalesLoader.camelcase(path.basename(fn, path.extname(fn)))];

    // If there's a directory with the same name as the file, it's merged but can be overridden by the current file
    const filenameAsDirname = path.join(path.dirname(absPath), path.basename(absPath, path.extname(__filename)));
    if (fs.existsSync(filenameAsDirname) && fs.statSync(filenameAsDirname).isDirectory()) {
      result = { ...LocalesLoader.requireDir(filenameAsDirname), ...result };
    }

    // Extract only one object from the module: either that one with the camelcase filename as the file or default
    return result;
  }

  private static hasShadowingFile(absPath: string) {
    const filename = path.basename(absPath);

    // Logic to prioritize .ts before .js before .json
    const withoutExtension = absPath.slice(0, -path.extname(filename).length);
    if (path.extname(filename) === ".json") {
      return fs.existsSync(`${withoutExtension}.ts`) || fs.existsSync(`${withoutExtension}.js`);
    }
    if (path.extname(filename) === ".js") {
      return fs.existsSync(`${withoutExtension}.ts`);
    }
  }
}
