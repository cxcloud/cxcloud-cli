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

const deploymentSchema = Joi.object().keys({
  name: Joi.string().required(),
  image: imageSchema.required(),
  containerPort: Joi.number().required(),
  replicas: Joi.number().default(2),
  env: Joi.array().items(
    Joi.object().keys({
      name: Joi.string().required(),
      value: Joi.string().required()
    })
  ),
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
  deployment: deploymentSchema,
  routing: rootRoutingSchema
});
