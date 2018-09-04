import { Entity, DeveloperEntity, PlatformGenerator } from "./public-interfaces";
import { injectable } from "inversify";

@injectable()
export class EntityMapper implements PlatformGenerator.EntityMapper {
  public store: { [name: string]: any } = {};

  constructor() {}

  public contains(name: string) {
    return typeof this.get(name) !== "undefined";
  }

  public get(name: string): PlatformGenerator.EntityMap {
    // Return undefined instead of null. Uniforms all "missing" results to undefined.
    return this.store[name] === null ? undefined : this.store[name];
  }

  public set(name: string, entity: PlatformGenerator.EntityMap) {
    // Set value to undefined if passed value is null.
    const valueToSet = entity === null ? undefined : entity;
    this.store[name] = valueToSet;
  }
}

/**
 * Maps the entitý name to their specific types
 * @param entity
 */
export function mapEntity(entity: { [type: string]: string[] | Entity | DeveloperEntity }) {
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
