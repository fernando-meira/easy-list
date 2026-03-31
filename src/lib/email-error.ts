type ResendLikeError = {
  name?: string;
  message?: string;
  statusCode?: number;
};

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
  return process.env.EMAIL_FROM || 'Easy List <onboarding@resend.dev>';
}

export function validateEmailConfig() {
  const issues: string[] = [];
  const emailFrom = process.env.EMAIL_FROM;

  if (!process.env.RESEND_API_KEY) {
    issues.push('RESEND_API_KEY não está configurada');
  }

  if (!emailFrom) {
    issues.push('EMAIL_FROM não está configurado');
  } else if (process.env.NODE_ENV === 'production' && emailFrom.includes('onboarding@resend.dev')) {
    issues.push('EMAIL_FROM usa onboarding@resend.dev em produção');
  }

  return {
    isValid: issues.length === 0,
    issues,
    emailFrom: emailFrom || 'Easy List <onboarding@resend.dev>',
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
