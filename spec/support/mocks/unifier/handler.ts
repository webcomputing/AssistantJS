import { MinimalResponseHandler } from "../../../../src/components/unifier/interfaces";

export class ResponseHandler implements MinimalResponseHandler {
  endSession: boolean = false;
  voiceMessage: string = "";
  sendResponse() {}
}