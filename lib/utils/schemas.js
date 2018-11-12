const Joi = require('joi');

const imageSchema = Joi.object().keys({
  repository: Joi.string().required(),
  version: Joi.string().required(),
  name: Joi.string().required()
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
  )
});

exports.deploymentManifestSchema = Joi.object().keys({
  deployment: deploymentSchema.required()
});
