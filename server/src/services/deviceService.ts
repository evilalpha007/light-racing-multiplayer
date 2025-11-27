import crypto from 'crypto';

export class DeviceService {
  /**
   * Generate a device fingerprint from IP and User-Agent
   */
  static generateFingerprint(ip: string, userAgent: string): string {
    const data = `${ip}-${userAgent}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Validate device fingerprint format
   */
  static isValidFingerprint(fingerprint: string): boolean {
    return /^[a-f0-9]{64}$/.test(fingerprint);
  }
}
