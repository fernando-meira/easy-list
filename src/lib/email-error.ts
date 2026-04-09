type ResendLikeError = {
  name?: string;
  message?: string;
  statusCode?: number;
};

const EMAIL_FROM_FALLBACK = 'noreply@easy-list.site';

function getErrorMessage(error: unknown) {
  if (!error) {
    return '';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return String(error);
}

export function getEmailFromAddress() {
  return process.env.EMAIL_FROM || EMAIL_FROM_FALLBACK;
}

function containsLineBreak(value: string) {
  return /[\r\n]/.test(value);
}

function isValidEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseEmailFrom(value: string) {
  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(.+?)\s*<([^<>]+)>$/);

  if (match?.[2]) {
    return {
      name: match[1].trim(),
      email: match[2].trim(),
    };
  }

  return {
    name: '',
    email: trimmedValue,
  };
}

function isValidAppUrl(value: string) {
  try {
    const parsedUrl = new URL(value);

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLocalhostUrl(value: string) {
  try {
    const parsedUrl = new URL(value);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export function getAppBaseUrl() {
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

interface ValidateEmailConfigOptions {
  requireBaseUrl?: boolean;
}

export function validateEmailConfig(options: ValidateEmailConfigOptions = {}) {
  const issues: string[] = [];
  const emailFrom = process.env.EMAIL_FROM?.trim() || '';
  const baseUrl = process.env.NEXTAUTH_URL?.trim() || '';
  const { requireBaseUrl = false } = options;

  if (!process.env.RESEND_API_KEY) {
    issues.push('RESEND_API_KEY não está configurada');
  }

  if (!emailFrom) {
    issues.push('EMAIL_FROM não está configurado');
  } else {
    if (containsLineBreak(emailFrom)) {
      issues.push('EMAIL_FROM contém quebra de linha');
    }

    const parsedFrom = parseEmailFrom(emailFrom);

    if (!isValidEmailAddress(parsedFrom.email)) {
      issues.push('EMAIL_FROM não contém um endereço de email válido');
    }

    if (process.env.NODE_ENV === 'production' && parsedFrom.email.includes('onboarding@resend.dev')) {
      issues.push('EMAIL_FROM usa onboarding@resend.dev em produção');
    }
  }

  if (requireBaseUrl) {
    if (!baseUrl) {
      issues.push('NEXTAUTH_URL não está configurado');
    } else {
      if (containsLineBreak(baseUrl)) {
        issues.push('NEXTAUTH_URL contém quebra de linha');
      }

      if (!isValidAppUrl(baseUrl)) {
        issues.push('NEXTAUTH_URL não é uma URL válida');
      }

      if (process.env.NODE_ENV === 'production' && isLocalhostUrl(baseUrl)) {
        issues.push('NEXTAUTH_URL aponta para localhost em produção');
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    emailFrom: emailFrom || EMAIL_FROM_FALLBACK,
    baseUrl: baseUrl || 'http://localhost:3000',
  };
}

export function getResendUserFacingError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes('domain is not verified') ||
    message.includes('verify a domain') ||
    message.includes('sender') ||
    message.includes('from address') ||
    message.includes('testing emails') ||
    message.includes('not allowed to send') ||
    message.includes('forbidden')
  ) {
    return 'Serviço de email configurado incorretamente. Verifique o domínio e o remetente EMAIL_FROM no Resend.';
  }

  if (message.includes('api key') || message.includes('unauthorized') || message.includes('invalid api key')) {
    return 'Falha na autenticação do serviço de email. Verifique a RESEND_API_KEY no ambiente.';
  }

  return 'Erro ao enviar email. Por favor, tente novamente.';
}

export function logEmailError(context: string, error: unknown, details?: Record<string, unknown>) {
  const resendError = error as ResendLikeError;

  console.error(`[email] ${context}`, {
    message: getErrorMessage(error),
    name: resendError?.name,
    statusCode: resendError?.statusCode,
    ...details,
  });
}
