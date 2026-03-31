type MongoLikeError = {
  code?: number;
  codeName?: string;
  message?: string;
};

export function isMongoAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const mongoError = error as MongoLikeError;
  const message = mongoError.message?.toLowerCase() ?? '';

  return (
    mongoError.code === 8000 ||
    mongoError.codeName === 'AtlasError' ||
    message.includes('bad auth') ||
    message.includes('authentication failed')
  );
}

export function getMongoUserFacingError(error: unknown): string {
  if (isMongoAuthError(error)) {
    return 'Falha na conexão com o banco de dados. Verifique o MONGODB_URI nas variáveis de ambiente.';
  }

  return 'Erro ao processar solicitação';
}
