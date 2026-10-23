/**
 * Client-side email validation utility for Plaso
 */

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

export interface ClientEmailValidation {
  isValid: boolean;
  message?: string;
  normalizedEmail: string;
}

export function validateSignupEmail(rawEmail: string | undefined | null): ClientEmailValidation {
  if (!rawEmail || typeof rawEmail !== 'string') {
    return {
      isValid: false,
      message: 'Please enter your email address.',
      normalizedEmail: '',
    };
  }

  const normalizedEmail = rawEmail.toLowerCase().trim();

  // Length check (RFC 5321)
  if (normalizedEmail.length < 5 || normalizedEmail.length > 254) {
    return {
      isValid: false,
      message: 'Email must be between 5 and 254 characters in length.',
      normalizedEmail,
    };
  }

  // Exactly one '@' symbol
  const parts = normalizedEmail.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      message: 'Please enter a valid email address with a single @ symbol.',
      normalizedEmail,
    };
  }

  const [localPart, domain] = parts;

  if (!localPart || !domain) {
    return {
      isValid: false,
      message: 'Please enter both the email username and domain.',
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

  // Regex format
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address (e.g. name@domain.com).',
      normalizedEmail,
    };
  }

  // Domain typo check
  if (COMMON_DOMAIN_TYPOS[domain]) {
    const suggested = `${localPart}@${COMMON_DOMAIN_TYPOS[domain]}`;
    return {
      isValid: false,
      message: `Did you mean ${suggested}? Please verify your email domain.`,
      normalizedEmail,
    };
  }

  // Disposable blocklist
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      isValid: false,
      message: 'Disposable or temporary email addresses are not permitted. Please use a permanent email.',
      normalizedEmail,
    };
  }

  return {
    isValid: true,
    normalizedEmail,
  };
}
