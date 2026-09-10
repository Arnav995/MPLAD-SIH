export class EsakshiRequestError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "EsakshiRequestError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}