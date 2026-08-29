/**
 * Public path/name seams for OpenSpec change `s3-asset-admin-ui`.
 * YAML / Jenkinsfile.bootstrap / docs remain the source of truth; tests import
 * these constants instead of globbing `k8s/`.
 */

/** Namespace for s3manager + MinIO (tasks 1.1–2.2). */
export const S3MANAGER_NAMESPACE = 'platformer';

/** Task 1.1 — Deployment `platformer-s3manager`. */
export const S3MANAGER_DEPLOYMENT_FILE = 'k8s/minio/s3manager-deploy.yaml';
export const S3MANAGER_DEPLOYMENT_NAME = 'platformer-s3manager';

/** Task 1.3 — ClusterIP Service targeting the UI port. */
export const S3MANAGER_SERVICE_FILE = 'k8s/minio/s3manager-svc.yaml';
export const S3MANAGER_SERVICE_NAME = 'platformer-s3manager';
export const S3MANAGER_UI_PORT = 8080;

/** Task 1.4 — htpasswd example only; live Secret is not committed. */
export const S3MANAGER_AUTH_SECRET_EXAMPLE_FILE =
  'k8s/minio/s3manager-auth-secret.yaml.example';
export const S3MANAGER_AUTH_SECRET_NAME = 'platformer-s3manager-auth';

/** Task 2.1 — Traefik Middleware `basicAuth` → Secret `platformer-s3manager-auth`. */
export const S3MANAGER_MIDDLEWARE_FILE = 'k8s/minio/s3manager-middleware.yaml';
export const S3MANAGER_MIDDLEWARE_NAME = 'platformer-s3manager-auth';

/** Task 2.2 — Ingress host `minio-adminer.balashov-maxim.ru`. */
export const S3MANAGER_INGRESS_FILE = 'k8s/minio/s3manager-ingress.yaml';
export const S3MANAGER_INGRESS_NAME = 'platformer-s3manager';
export const S3MANAGER_INGRESS_HOST = 'minio-adminer.balashov-maxim.ru';

/** Task 3.1 — Jenkins credential id (password not in git). */
export const S3MANAGER_JENKINS_CREDENTIAL_ID = 's3manager-http';

/** Task 3.2 — bootstrap stage after `MinIO Init`. */
export const S3MANAGER_BOOTSTRAP_STAGE = 's3manager';
