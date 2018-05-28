import { RequestExtractionModifier, MinimalRequestExtraction } from "../../../../src/assistant-source";
import { injectable } from "inversify";

@injectable()
export class MockRequestExtractionModifier implements RequestExtractionModifier {
  async modify(extraction: MinimalRequestExtraction): Promise<MinimalRequestExtraction> {
    extraction.sessionID = "my-second-session-id";
    extraction.intent = "my-new-intent";

    return extraction;
  }
}
