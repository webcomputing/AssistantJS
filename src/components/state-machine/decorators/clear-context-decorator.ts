export const clearContextMetadataKey = Symbol("metadata-key: clearContext");

export function clearContext(needsClear?: (...args: any[]) => boolean) {
  const metadata = needsClear ? { clearContext: needsClear } : { clearContext: () => true };

  return function(targetClass: any) {
    Reflect.defineMetadata(clearContextMetadataKey, metadata, targetClass);
  };
}
