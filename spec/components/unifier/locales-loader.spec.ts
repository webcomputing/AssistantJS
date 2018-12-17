import * as fs from "fs";
import { Component } from "inversify-components";
import { resolve } from "path";
import { LocalesLoader } from "../../../src/assistant-source";
import { Configuration } from "../../../src/components/unifier/private-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { ThisContext } from "../../this-context";

// tslint:disable no-var-requires
const deUtterances = require("../../support/mocks/i18n/locale/de/utterances.json");
const enUtterances = require("../../support/mocks/i18n/locale/en/utterances.ts");
const deEntities = require("../../support/mocks/i18n/locale/de/entities.json");
const enEntities = require("../../support/mocks/i18n/locale/en/entities.js");
// tslint:enable no-var-requires

interface LocalThisContext extends ThisContext {
  utterancePath: string;
  fsAccess: {
    [fileName: string]: number;
  };
  localesLoader: LocalesLoader;
}

// Orignal functions which are going to be mocked
const { existsSync } = fs;

describe("LocalesLoader", function() {
  beforeEach(function(this: LocalThisContext) {
    this.localesLoader = this.container.inversifyInstance.get(injectionNames.localesLoader);

    // Update `utterancePath` in the default unifier configuration
    const metaData = this.container.inversifyInstance.get<Component<Configuration.Runtime>>("meta:component//core:unifier");
    this.utterancePath = metaData.configuration.utterancePath = resolve(__dirname, "../../support/mocks/i18n/locale");
    this.container.inversifyInstance.unbind("meta:component//core:unifier");
    this.container.inversifyInstance.bind<Component<Configuration.Runtime>>("meta:component//core:unifier").toConstantValue(metaData);
  });

  describe("Data reading behaviour", function() {
    beforeEach(function(this: LocalThisContext) {
      this.fsAccess = {};

      // Extend `existsSync` to count access checks
      (fs.existsSync as any) = filePath => {
        this.fsAccess[filePath] = this.fsAccess[filePath] === undefined ? 1 : this.fsAccess[filePath] + 1;
        return existsSync(filePath);
      };
    });

    it("Reads utterances from file system only once", function(this: LocalThisContext) {
      expect(this.fsAccess[this.utterancePath]).toBeUndefined();
      this.localesLoader.getUtteranceTemplates();
      expect(this.fsAccess[this.utterancePath]).toBe(1);

      this.localesLoader.getUtteranceTemplates();
      this.localesLoader.getUtteranceTemplates();
      expect(this.fsAccess[this.utterancePath]).toBe(1);
    });

    it("Reads custom entities from file system only once", function(this: LocalThisContext) {
      expect(this.fsAccess[this.utterancePath]).toBeUndefined();
      this.localesLoader.getCustomEntities();
      expect(this.fsAccess[this.utterancePath]).toBe(1);

      this.localesLoader.getCustomEntities();
      this.localesLoader.getCustomEntities();
      expect(this.fsAccess[this.utterancePath]).toBe(1);
    });

    it("prioritizes JS files over JSON files", function(this: LocalThisContext) {
      const entities = this.localesLoader.getCustomEntities();
      const utterances = this.localesLoader.getUtteranceTemplates();

      expect(Object.keys(entities.de)).toContain("color");
      expect(Object.keys(utterances.de)).toContain("testIntent");

      expect(Object.keys(entities.en)).toContain("color");
      expect(Object.keys(entities.en)).not.toContain("this should be shadowed by entities.js");

      expect(Object.keys(utterances.en)).toContain("testIntent");
      expect(Object.keys(utterances.en)).not.toContain("this should be shadowed by utterances.ts");
    });

    afterEach(function() {
      (fs.existsSync as any) = existsSync;
    });
  });

  describe("getUtteranceTemplates", function() {
    it("loads all utterance templates of all languages from file system", function(this: LocalThisContext) {
      const utterances = this.localesLoader.getUtteranceTemplates();

      expect(Object.keys(utterances)).toContain("de");
      expect(Object.keys(utterances)).toContain("en");

      expect(utterances.de).toEqual(deUtterances);
      expect(utterances.en).toEqual(enUtterances);
    });
  });

  describe("getCustomEntities", function() {
    it("loads all custom entities of all languages from file system", function(this: LocalThisContext) {
      const entities = this.localesLoader.getCustomEntities();

      expect(Object.keys(entities)).toContain("de");
      expect(Object.keys(entities)).toContain("en");

      expect(entities.de).toEqual(deEntities);
      expect(entities.en).toEqual(enEntities);
    });
  });
});
