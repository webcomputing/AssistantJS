import * as crypto from "crypto";
import { OptionalExtractions } from "../../unifier/public-interfaces";
import { BasicSessionHandable } from "../../unifier/response-handler";
import { PlatformSession } from "./platform-session";

/**
 * Same as PlatformSession, but encrypts everything before sending back to platform
 */

export class CryptedPlatformSession extends PlatformSession {
  /** Default encryption key, taken if none was configured. Must be 32 characters long. */
  private static encryptionKey = CryptedPlatformSession.generateRandomString(32);

  /** Currently used encryption key */
  private encryptionKey: string;

  /**
   * Creates a crypted platform session object
   * @param extraction See PlatformSession
   * @param handler See PlatformSession
   * @param configuredEncryptionKey Encryption key to use. If left out, a auto-generated one will be taken, which will live as long as the app runs
   */
  constructor(extraction: OptionalExtractions.SessionData, handler: BasicSessionHandable<any>, configuredEncryptionKey?: string) {
    super(extraction, handler);

    if (typeof configuredEncryptionKey === "string") {
      if (configuredEncryptionKey.length === 32) {
        this.encryptionKey = configuredEncryptionKey;
      } else {
        throw new Error("If you configure crypted platform sessions to use your own encryption key, this key has to be 32 characters long.");
      }
    } else {
      this.encryptionKey = CryptedPlatformSession.encryptionKey;
    }
  }

  /** For encryption and decryption: Thanks to http://vancelucas.com/blog/stronger-encryption-and-decryption-in-node-js/ */

  /** Decrypts sth using key and iv */
  public decrypt(encryptedData: string): string {
    const textParts = encryptedData.split(":");
    const iv = new Buffer(textParts[0], "hex");
    const encryptedText = new Buffer(textParts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", new Buffer(this.encryptionKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  /** Encrypts sth using key and iv */
  public async encrypt(clearTextData: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", new Buffer(this.encryptionKey), iv);
    let encrypted = cipher.update(new Buffer(clearTextData));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }

  /** Override PlatformSession#encode and PlatformSession#decode to integration encryption */

  /** Decodes and decrypts session data */
  protected async decode(cryptedSessionData: string) {
    return super.decode(this.decrypt(cryptedSessionData));
  }

  /** Encodes and encrypts session data */
  protected async encode(decryptedSessionData: object) {
    return this.encrypt(await super.encode(decryptedSessionData));
  }

  /** Generates a random-based string with given amount of characters */
  private static generateRandomString(characters: number) {
    return crypto.randomBytes(characters / 2).toString("hex");
  }
}
