const YAML = require('js-yaml');
const { showError } = require('./');

const buildSSLManifest = (domain, namespace) => {
  return {
    apiVersion: 'certmanager.k8s.io/v1alpha1',
    kind: 'Certificate',
    metadata: {
      namespace,
      name: domain
    },
    spec: {
      secretName: domain,
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
  const namespace = config.namespace || 'applications';
  return {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: `${deployment.name}-routing`,
      namespace,
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
                secretName: routing.domain
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
  const namespace = config.namespace || 'applications';
  return {
    apiVersion: 'extensions/v1beta1',
    kind: 'Ingress',
    metadata: {
      name: `${routing.domain}-routing`,
      namespace,
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
                secretName: routing.domain
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

const buildDeploymentManifests = (config, envList = []) => {
  const data = config.deployment;
  const namespace = config.namespace || 'applications';
  const passedEnvs = envList
    .filter(item => /^([A-Z_0-9]+)=([\w\W]+)$/.test(item))
    .map(item => item.split('='))
    .map(([name, value]) => ({
      name,
      value
    }));
  const env = [
    ...passedEnvs,
    ...(Array.isArray(data.env) ? data.env : [])
  ].reduce(
    (list, curr) =>
      list.findIndex(e => e.name === curr.name) < 0 ? [...list, curr] : list,
    []
  );
  const image = `${data.image.repository}:${data.image.name}-${
    data.image.version
  }`;

  return [
    {
      apiVersion: 'extensions/v1beta1',
      kind: 'Deployment',
      metadata: {
        labels: { app: data.name, role: 'service' },
        name: data.name,
        namespace
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
        namespace
      },
      spec: {
        ports: [{ name: 'http', port: data.containerPort }],
        selector: { app: data.name }
      }
    }
  ];
};

const buildNamespaceManifest = namespace => ({
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: namespace
  }
});

exports.getKubernetesManifest = (config, envList = []) => {
  const manifests = [];
  const namespace = config.namespace || 'applications';

  // Push namespace, so if it's not there should be created
  manifests.push(buildNamespaceManifest(namespace));

  // Single deployment
  if (config.deployment) {
    manifests.push(...buildDeploymentManifests(config, envList));
  }

  // Deployment specific routing
  if (config.deployment && config.deployment.routing) {
    if (config.deployment.routing.ssl) {
      manifests.push(
        buildSSLManifest(config.deployment.routing.domain, namespace)
      );
    }
    manifests.push(buildDeploymentRoutingManifest(config));
  }

  // Global routing
  if (config.routing) {
    if (config.routing.ssl) {
      manifests.push(buildSSLManifest(config.routing.domain, namespace));
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
