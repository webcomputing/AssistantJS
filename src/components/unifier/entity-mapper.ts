import { CustomEntity, PlatformGenerator } from "./public-interfaces";
import { injectable, inject } from "inversify";
import { Component } from "inversify-components";
import { Configuration } from "./private-interfaces";

@injectable()
export class EntityMapper implements PlatformGenerator.EntityMapper {
  public store: { [name: string]: any } = {};

  constructor(@inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>) {
    this.fillStore(componentMeta.configuration.entities);
  }

  public contains(name: string) {
    return typeof this.get(name) !== "undefined";
  }

  public get(name: string): PlatformGenerator.EntityMap | undefined {
    // Return undefined instead of null. Uniforms all "missing" results to undefined.
    return this.store[name] === null ? undefined : this.store[name];
  }

  public getEntityNames(): string[] {
    const names: string[] = [];
    Object.keys(this.store).forEach(name => {
      names.push(name);
    });
    return names;
  }

  private set(name: string, entity: PlatformGenerator.EntityMap) {
    // Set value to undefined if passed value is null.
    const valueToSet = entity === null ? undefined : entity;
    this.store[name] = valueToSet;
  }

  /** Fills the entity mapper store */
  private fillStore(entities: { [type: string]: string[] | CustomEntity }) {
    Object.keys(entities).forEach(type => {
      // Get current entity
      const entity = entities[type];
      // Iterate through custom entities
      if (this.isCustomEntity(entity)) {
        entity.names.forEach(name => {
          Object.keys(entity.values).forEach(lang => {
            entity.values[lang].forEach(param => {
              if (typeof param === "string") {
                this.set(name, { type: type, values: { [lang]: { value: param } } });
              } else {
                const mergedParam = [...param.synonyms, param.value];
                this.set(name, { type: type, values: { [lang]: { value: param.value, synonyms: mergedParam } } });
              }
            });
          });
        });
      } else {
        // Iterate through string array
        entity.forEach(name => {
          this.set(name, { type: type });
        });
      }
      // Add type as possible parameter, for answer prompt
      this.set(type, { type: type });
    });
  }

  /** Type Guard to check whether an enity is a custom entity */
  private isCustomEntity(entity: string[] | CustomEntity): entity is CustomEntity {
    return (<CustomEntity>entity).names !== undefined;
  }
}
