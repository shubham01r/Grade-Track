export class AppError extends Error {
  status: number;
  code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export function errorResponse(code: string, message: string) {
  return { error: { code, message } };
}
