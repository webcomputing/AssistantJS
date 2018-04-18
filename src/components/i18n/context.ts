import { injectable } from "inversify";

@injectable()
export class I18nContext {
  public intent!: string;
  public state!: string;
}
