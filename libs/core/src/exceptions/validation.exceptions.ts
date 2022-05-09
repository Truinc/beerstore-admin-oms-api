import { BadRequestException, ValidationError } from '@nestjs/common';

type typeValidationError = {
  [key: string]: string[];
};

function transform(errors: ValidationError[]) {
  return errors.reduce(function reducers(
    acc: typeValidationError[],
    error: ValidationError,
  ) {
    if (Array.isArray(error.children) && error.children.length) {
      return error.children.reduce(reducers, acc);
    }
    if (error.constraints) {
      return { ...acc, [error.property]: Object.values(error.constraints) };
    }
    return acc;
  },
  []);
}

export default class ValidationExceptions extends BadRequestException {
  constructor(public validationErrors: ValidationError[]) {
    super({ error: 'ValidationError', message: transform(validationErrors) });
  }
}
