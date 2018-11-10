const YAML = require('js-yaml');

exports.buildDeploymentYaml = config => {
  const data = config.deployment;
  const image = `${data.image.repository}:${data.image.name}-${
    data.image.version
  }`;

  const manifests = [
    {
      apiVersion: 'extensions/v1beta1',
      kind: 'Deployment',
      metadata: {
        labels: { app: data.name, role: 'service' },
        name: data.name,
        namespace: 'applications'
      },
      spec: {
        replicas: Number(data.replicas) || 1,
        selector: { matchLabels: { app: data.name } },
        template: {
          metadata: { labels: { app: data.name } },
          spec: {
            containers: [
              {
                name: data.name,
                image,
                ports: [
                  {
                    containerPort: data.containerPort,
                    name: 'node-port',
                    protocol: 'TCP'
                  }
                ]
              }
            ]
          }
        }
      }
    },
    {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        labels: { app: data.name },
        name: data.name,
        namespace: 'applications'
      },
      spec: {
        ports: [{ name: 'http', port: data.containerPort }],
        selector: { app: data.name }
      }
    }
  ].map(json =>
    YAML.safeDump(json, {
      lineWidth: 200
    })
  );

  return manifests.join('\n---\n');
};
