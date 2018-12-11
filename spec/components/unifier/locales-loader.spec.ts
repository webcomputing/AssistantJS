import { Component } from "inversify-components";
import { resolve } from "path";
import { LocalesLoader } from "../../../src/assistant-source";
import { Configuration } from "../../../src/components/unifier/private-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { ThisContext } from "../../this-context";

// tslint:disable no-var-requires
const deUtterances = require("../../support/mocks/i18n/locale/de/utterances.json");
const enUtterances = require("../../support/mocks/i18n/locale/en/utterances.json");
const deEntities = require("../../support/mocks/i18n/locale/de/entities.json");
const enEntities = require("../../support/mocks/i18n/locale/en/entities.json");
// tslint:enable no-var-requires

describe("LocalesLoader", function() {
  beforeEach(function(this: ThisContext) {
    // Update `utterancePath` in the default unifier configuration
    const metaData = this.container.inversifyInstance.get<Component<Configuration.Runtime>>("meta:component//core:unifier");
    metaData.configuration.utterancePath = resolve(__dirname, "../../support/mocks/i18n/locale");
    this.container.inversifyInstance.unbind("meta:component//core:unifier");
    this.container.inversifyInstance.bind<Component<Configuration.Runtime>>("meta:component//core:unifier").toConstantValue(metaData);
  });

  describe("getUtteranceTemplates", function() {
    it("loads all utterance templates of all languages from file system", function(this: ThisContext) {
      const localesLoader: LocalesLoader = this.container.inversifyInstance.get(injectionNames.localesLoader);
      const utterances = localesLoader.getUtteranceTemplates();

      expect(Object.keys(utterances)).toContain("de");
      expect(Object.keys(utterances)).toContain("en");

      expect(utterances.de).toEqual(deUtterances);
      expect(utterances.en).toEqual(enUtterances);
    });
  });

  describe("getCustomEntities", function() {
    it("loads all custom entities of all languages from file system", function(this: ThisContext) {
      const localesLoader: LocalesLoader = this.container.inversifyInstance.get(injectionNames.localesLoader);
      const entities = localesLoader.getCustomEntities();

      expect(Object.keys(entities)).toContain("de");
      expect(Object.keys(entities)).toContain("en");

      expect(entities.de).toEqual(deEntities);
      expect(entities.en).toEqual(enEntities);
    });
  });
});
