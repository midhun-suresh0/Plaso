import dns from 'dns';
import logger from './logger';

export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
  normalizedEmail: string;
}

// RFC 5322 compliant regex ensuring proper local part, domain segments, and TLD >= 2 letters
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Popular disposable / temporary / burner email providers
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  '10minutemail.com',
  '10minutemail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'dispostable.com',
  'getairmail.com',
  'throwawaymail.com',
  'fakeinbox.com',
  'burnermail.io',
  'crazymailing.com',
  'nada.ltd',
  'inboxkitten.com',
  'mohmal.com',
  'fakemailgenerator.com',
  'maildrop.cc',
  'mytemp.email',
  'discard.email',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'tinemail.com',
]);

// Common domain typos mapped to real providers
export const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaboo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'iclud.com': 'icloud.com',
  'icoud.com': 'icloud.com',
};

/**
 * Validates an email address comprehensively:
 * 1. Syntax & RFC compliance
 * 2. Consecutive dot rejection
 * 3. Typo detection for popular email providers
 * 4. Disposable/burner email rejection
 * 5. Real-time DNS MX record verification
 */
export async function validateEmail(
  rawEmail: string | undefined | null,
  options: { checkMx?: boolean } = { checkMx: true }
): Promise<EmailValidationResult> {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValid: false,
      message: 'Email address is required.',
      normalizedEmail: '',
    };
  }

  const normalizedEmail = rawEmail.toLowerCase().trim();

  // 1. Length constraints (RFC 5321: min ~5 chars e.g. a@b.co, max 254 chars)
  if (normalizedEmail.length < 5 || normalizedEmail.length > 254) {
    return {
      isValid: false,
      message: 'Email must be between 5 and 254 characters in length.',
      normalizedEmail,
    };
  }

  // 2. Must contain exactly one '@' sign
  const atParts = normalizedEmail.split('@');
  if (atParts.length !== 2) {
    return {
      isValid: false,
      message: 'Please enter a valid email address with a single @ symbol.',
      normalizedEmail,
    };
  }

  const [localPart, domain] = atParts;

  // 3. Local part and domain sanity checks
  if (!localPart || !domain) {
    return {
      isValid: false,
      message: 'Please provide both the email username and domain.',
      normalizedEmail,
    };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return {
      isValid: false,
      message: 'Email username cannot start, end, or contain consecutive dots.',
      normalizedEmail,
    };
  }

  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) {
    return {
      isValid: false,
      message: 'Email domain format is invalid.',
      normalizedEmail,
    };
  }

  // 4. Regex test
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address (e.g. name@example.com).',
      normalizedEmail,
    };
  }

  // 5. Check domain typos
  if (COMMON_DOMAIN_TYPOS[domain]) {
    const suggested = `${localPart}@${COMMON_DOMAIN_TYPOS[domain]}`;
    return {
      isValid: false,
      message: `Did you mean ${suggested}? Please check your email domain.`,
      normalizedEmail,
    };
  }

  // 6. Check disposable email blocklist
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      message: 'Disposable or temporary email addresses are not allowed. Please use a permanent email.',
      normalizedEmail,
    };
  }

  // 7. Check MX records via DNS (if checkMx is enabled)
  if (options.checkMx) {
    // Skip MX resolution for localhost or test domains during test runs
    if (domain === 'localhost' || domain.endsWith('.local') || domain === 'example.com') {
      return { isValid: true, normalizedEmail };
    }

    try {
      // 2.5 second timeout to avoid blocking if network/DNS is slow
      const hasMx = await Promise.race<boolean>([
        dns.promises.resolveMx(domain).then(records => records && records.length > 0),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500)
        ),
      ]);

      if (!hasMx) {
        // Fallback: check if domain has an A record (some servers accept mail without MX)
        try {
          const aRecords = await dns.promises.resolve(domain);
          if (!aRecords || aRecords.length === 0) {
            return {
              isValid: false,
              message: `The email domain '@${domain}' does not appear to exist or cannot receive mail.`,
              normalizedEmail,
            };
          }
        } catch {
          return {
            isValid: false,
            message: `The email domain '@${domain}' does not appear to exist or cannot receive mail.`,
            normalizedEmail,
          };
        }
      }
    } catch (dnsErr: any) {
      if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA' || dnsErr.code === 'NXDOMAIN') {
        return {
          isValid: false,
          message: `The email domain '@${domain}' does not exist. Please check for typos.`,
          normalizedEmail,
        };
      }
      // On timeout or generic network error, don't hard-block valid RFC emails
      if (dnsErr.message === 'DNS_TIMEOUT') {
        logger.warn(`[emailValidator] DNS MX check timed out for ${domain}, permitting email.`);
      } else {
        logger.warn(`[emailValidator] DNS check warning for ${domain}: ${dnsErr.message}`);
      }
    }
  }

  return {
    isValid: true,
    normalizedEmail,
  };
}
