export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`)
    this.name = 'NotFoundError'
  }
}

export class UniqueConstraintError extends Error {
  constructor(field: string, value: string) {
    super(`${field} already exists: ${value}`)
    this.name = 'UniqueConstraintError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
