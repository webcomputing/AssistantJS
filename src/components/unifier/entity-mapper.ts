import * as fs from "fs";
import { CustomEntity, PlatformGenerator } from "./public-interfaces";
import { injectable, inject } from "inversify";
import { Component } from "inversify-components";
import { Configuration } from "./private-interfaces";

@injectable()
export class EntityMapper implements PlatformGenerator.EntityMapper {
  public store: { [language: string]: { [name: string]: PlatformGenerator.EntityMap } } = {};
  private configuration: Configuration.Runtime;

  constructor(@inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>) {
    this.configuration = componentMeta.configuration;
    this.prepareLocales();
    this.fillStore();
  }

  /** Add an entity to the store */
  private set(name, entity: PlatformGenerator.EntityMap, language?: string) {
    if (!language) {
      Object.keys(this.store).forEach(lang => {
        this.store[lang][name] = entity;
      });
    } else if (typeof this.store[language] !== "undefined") {
      this.store[language][name] = entity;
    } else {
      console.warn("Unknown entity '" + name + "' for locale: '" + language + "'. Please check your utterances and type mappings. Omitting.");
    }
  }

  /** Fills the entity mapper store */
  private fillStore() {
    const entities = this.configuration.entities;
    Object.keys(entities).forEach(type => {
      const entity = entities[type];
      if (this.isCustomEntity(entity)) {
        entity.names.forEach(name => {
          Object.keys(entity.values).forEach(language => {
            const valueMapping: Array<{ value: string; synonyms: string[] }> = [];
            entity.values[language].forEach(param => {
              valueMapping.push(param);
            });
            // Push entity into store
            this.set(name, { type: type, values: valueMapping }, language);
          });
        });
      } else {
        entity.forEach(name => {
          this.set(name, { type: type });
        });
      }
      // Add type as possible parameter, for answer prompt
      this.set(type, { type: type });
    });
  }

  /** Set the store locale for each language found in locales folder */
  private prepareLocales() {
    const utterancesDir = this.configuration.utterancePath;
    const languages = fs.readdirSync(utterancesDir);
    languages.forEach(language => {
      const utterancePath = utterancesDir + "/" + language + "/utterances.json";
      if (fs.existsSync(utterancePath)) {
        this.store[language] = {};
      }
    });
  }

  /** Type Guard to check whether an enity is a custom entity */
  private isCustomEntity(entity: string[] | CustomEntity): entity is CustomEntity {
    return (<CustomEntity>entity).names !== undefined;
  }
}

/**
 * Maps the entitý name to their specific types
 * @param entity
 */
export function mapEntity(entity: { [type: string]: string[] | CustomEntity }) {
  const result = {};
  Object.keys(entity).forEach(type => {
    const currEntity = entity[type];
    if (currEntity instanceof Array) {
      currEntity.forEach(parameter => {
        result[parameter] = type;
      });
    } else {
      currEntity.names.forEach(name => {
        result[name] = type;
      });
    }
    // Add type as possible parameter, for answer prompt
    result[type] = type;
  });
  return result;
}
