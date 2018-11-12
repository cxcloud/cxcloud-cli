const YAML = require('js-yaml');
const { showError } = require('./');

const sanitizeDomainName = str => str.replace(/\./g, '_');

const buildSSLManifest = domain => {
  return {
    apiVersion: 'certmanager.k8s.io/v1alpha1',
    kind: 'Certificate',
    metadata: {
      name: sanitizeDomainName(domain)
    },
    spec: {
      secretName: sanitizeDomainName(domain),
      dnsNames: [domain],
      acme: {
        config: [
          {
            http01: {
              ingressClass: 'nginx'
            },
            domains: [domain]
          }
        ]
      },
      issuerRef: {
        name: 'letsencrypt-production',
        kind: 'ClusterIssuer'
      }
    }
  };
};

const buildDeploymentRoutingManifest = config => {
  const { deployment } = config;
  const { routing } = deployment;
  return {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: deployment.name,
      namespace: 'applications',
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        ...(routing.ssl
          ? { 'certmanager.k8s.io/cluster-issuer': 'letsencrypt-production' }
          : {})
      }
    },
    spec: {
      ...(routing.ssl
        ? {
            tls: [
              {
                hosts: [routing.domain],
                secretName: sanitizeDomainName(routing.domain)
              }
            ]
          }
        : {}),
      rules: [
        {
          host: routing.domain,
          http: {
            paths: [
              {
                path: routing.path,
                backend: {
                  serviceName: deployment.name,
                  servicePort: deployment.containerPort
                }
              }
            ]
          }
        }
      ]
    }
  };
};

const buildGlobalRoutingManifest = config => {
  const { routing } = config;
  return {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: `${sanitizeDomainName(routing.domain)}-routing`,
      namespace: 'applications',
      annotations: {
        'kubernetes.io/ingress.class': 'nginx',
        ...(routing.ssl
          ? { 'certmanager.k8s.io/cluster-issuer': 'letsencrypt-production' }
          : {})
      }
    },
    spec: {
      ...(routing.ssl
        ? {
            tls: [
              {
                hosts: [routing.domain],
                secretName: sanitizeDomainName(routing.domain)
              }
            ]
          }
        : {}),
      rules: [
        {
          host: routing.domain,
          http: {
            paths: routing.rules.map(rule => ({
              path: rule.path,
              backend: {
                serviceName: rule.serviceName,
                servicePort: rule.servicePort
              }
            }))
          }
        }
      ]
    }
  };
};

const convertManifestToYaml = (config, envList = []) => {
  const passedEnvs = envList
    .filter(item => /^([A-Z_0-9]+)=([\w\W]+)$/.test(item))
    .map(item => item.split('='))
    .map(([name, value]) => ({
      name,
      value
    }));
  const data = config.deployment;
  const image = `${data.image.repository}:${data.image.name}-${
    data.image.version
  }`;
  const env = [
    ...passedEnvs,
    ...(Array.isArray(data.env) ? data.env : [])
  ].reduce(
    (list, curr) =>
      list.findIndex(e => e.name === curr.name) < 0 ? [...list, curr] : list,
    []
  );

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
                env,
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
  ];

  // Deployment specific routing
  if (data.routing) {
    if (data.routing.ssl) {
      manifests.push(buildSSLManifest(data.routing.domain));
    }
    manifests.push(buildDeploymentRoutingManifest(config));
  }

  // Global routing
  if (config.routing) {
    if (config.routing.ssl) {
      manifests.push(buildSSLManifest(config.routing.domain));
    }
    manifests.push(buildGlobalRoutingManifest(config));
  }

  return manifests
    .map(json =>
      YAML.safeDump(json, {
        lineWidth: 200
      })
    )
    .join('\n---\n');
};

exports.getDeploymentSchema = (config, envList = []) => {
  if (config.deployment) {
    return convertManifestToYaml(config, envList);
  }
  showError('Your .cxcloud.yaml file does not include deployment information');
};

exports.getRoutingSchema = (config, envList = []) => {
  if (config.routing) {
    return convertManifestToYaml(config, envList);
  }
  showError('Your .cxcloud.yaml file does not include routing information');
};
