import { MinimalResponseHandler } from "../../../../src/components/unifier/interfaces";
import { injectable } from "inversify";

@injectable()
export class ResponseHandler implements MinimalResponseHandler {
  endSession: boolean = false;
  voiceMessage: string = "";
  sendResponse() {}
}