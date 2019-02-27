const Joi = require('joi');

const imageSchema = Joi.object().keys({
  repository: Joi.string().required(),
  version: Joi.string().required(),
  name: Joi.string().required()
});

const deploymentRoutingSchema = Joi.object().keys({
  domain: Joi.string().required(),
  path: Joi.string().required(),
  ssl: Joi.boolean().default(true)
});

const environmentVariableValueRefSchema = Joi.object().keys({
  secretKeyRef: Joi.object().keys({
    name: Joi.string().required(),
    key: Joi.string()
  })
});

const environmentVariableSchema = Joi.object()
  .keys({
    name: Joi.string().required(),
    value: Joi.any(),
    valueFrom: Joi.any()
  })
  .when(Joi.object({ valueFrom: Joi.exist() }).unknown(), {
    then: Joi.object({
      valueFrom: environmentVariableValueRefSchema.required(),
      value: Joi.any().forbidden()
    }),
    otherwise: Joi.object({
      value: Joi.string().required()
    })
  });

const deploymentSchema = Joi.object().keys({
  name: Joi.string().required(),
  image: imageSchema.required(),
  containerPort: Joi.number().required(),
  port: Joi.number(),
  replicas: Joi.number().default(2),
  env: Joi.array().items(environmentVariableSchema),
  routing: deploymentRoutingSchema
});

const rootRoutingSchema = Joi.object().keys({
  domain: Joi.string().required(),
  ssl: Joi.boolean().default(true),
  rules: Joi.array().items(
    Joi.object().keys({
      path: Joi.string().required(),
      serviceName: Joi.string().required(),
      servicePort: Joi.number().required()
    })
  )
});

exports.deploymentManifestSchema = Joi.object().keys({
  namespace: Joi.string().default('applications'),
  deployment: deploymentSchema,
  routing: rootRoutingSchema
});
