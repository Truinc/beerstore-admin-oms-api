import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      description: '200. Success',
      schema: {
        allOf: [
          {
            properties: {
              total: {
                type: 'number',
              },
              take: {
                type: 'number',
              },
              skip: {
                type: 'number',
              },
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
