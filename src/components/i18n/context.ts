import { injectable } from "inversify";

@injectable()
export class I18nContext {
  intent: string;
  state: string;
}
