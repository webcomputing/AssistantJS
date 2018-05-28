import { RequestExtractionModifier, MinimalRequestExtraction } from "../../../../src/assistant-source";
import { injectable } from "inversify";

@injectable()
export class MockRequestExtractionSessionModifier implements RequestExtractionModifier {
  async modify(extraction: MinimalRequestExtraction): Promise<MinimalRequestExtraction> {
    extraction.sessionID = "my-new-session-id";

    return extraction;
  }
}
