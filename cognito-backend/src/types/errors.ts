export class WalrusWriteError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'WalrusWriteError';
  }
}

export class SuiTxError extends Error {
  digest?: string;
  constructor(msg: string, digest?: string) {
    super(msg);
    this.name = 'SuiTxError';
    this.digest = digest;
  }
}

export class SuiSQLError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'SuiSQLError';
  }
}

export class ValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'NotFoundError';
  }
}
