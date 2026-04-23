export class ProtocolError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'invalid-input'
      | 'corrupted-data'
      | 'unsupported'
      | 'runtime-unavailable',
  ) {
    super(message);
    this.name = 'ProtocolError';
  }
}
