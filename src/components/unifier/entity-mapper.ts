import { CustomEntity } from "./public-interfaces";

/**
 * Maps the entitý name to their specific types
 * @param entity
 */
export function mapEntity(entity: { [type: string]: string[] } | { [name: string]: CustomEntity }) {
  const result = {};
  Object.keys(entity).forEach(val => {
    const currEntity = entity[val];
    if (isCustomEntity(currEntity)) {
      currEntity.names.forEach(name => {
        result[name] = val;
      });
    } else {
      currEntity.forEach(parameter => {
        result[parameter] = val;
      });
    }
    // Add type as possible parameter, for answer prompt
    result[val] = val;
  });
  return result;
}

/**
 * Type Guard to check whether an entity is a custom entity
 * @param entity
 */
function isCustomEntity(entity): entity is CustomEntity {
  return typeof (<CustomEntity>entity).names !== "undefined";
}
