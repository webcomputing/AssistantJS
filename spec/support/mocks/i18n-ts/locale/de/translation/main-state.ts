export const testIntent = {
  embedded: {
    test: "very-specific-without-extractor",
    platformDependent: {
      ExtractorComponent: "platform-specific-sub-key",
    },
  },
};

export const deviceDependentIntent = {
  embeddedKeyOuter: {
    embeddedKeyInner: {
      ExtractorComponent: {
        device1: "device-specific-sub-key",
      },
    },
  },
};

export const yesGenericIntent = "yes";

export const platformDependent = {
  ExtractorComponent: "platform-specific-embedded-state-only",
};

export const platformIndependent = "platform-independent-main-state";

export const ExtractorComponent = "platform-specific-main-state-only";

export const platformSpecificIntent = {
  ExtractorComponent: "platform-specific-intent",
};
