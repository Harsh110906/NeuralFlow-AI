export interface IKmsProvider {
  /**
   * Encrypts plaintext data and returns the ciphertext (envelope encrypted)
   */
  encrypt(plaintext: string, context?: Record<string, string>): Promise<string>;

  /**
   * Decrypts ciphertext and returns the original plaintext
   */
  decrypt(
    ciphertext: string,
    context?: Record<string, string>,
  ): Promise<string>;

  /**
   * Identifies the provider name (e.g., 'AWS', 'LOCAL')
   */
  getProviderName(): string;
}
