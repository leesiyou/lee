export interface RuntimeConfig {
  directusInternalUrl: string;
  directusPublicUrl: string;
  publicAdminUrl: string;
  publicBaseUrl: string;
}

type RuntimeEnvironment = Record<string, string | undefined>;

function validatedHttpUrl(name: string, value: string): string {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${name} must use http or https`);
  }
  return url.toString().replace(/\/$/, '');
}

export function resolveRuntimeConfig(environment: RuntimeEnvironment): RuntimeConfig {
  return {
    directusInternalUrl: validatedHttpUrl(
      'DIRECTUS_INTERNAL_URL',
      environment.DIRECTUS_INTERNAL_URL ?? 'http://directus:8055',
    ),
    directusPublicUrl: validatedHttpUrl(
      'DIRECTUS_PUBLIC_URL',
      environment.DIRECTUS_PUBLIC_URL ?? 'http://localhost:8055',
    ),
    publicAdminUrl: validatedHttpUrl(
      'PUBLIC_ADMIN_URL',
      environment.PUBLIC_ADMIN_URL ?? 'http://localhost:8055',
    ),
    publicBaseUrl: validatedHttpUrl(
      'PUBLIC_BASE_URL',
      environment.PUBLIC_BASE_URL ?? 'http://localhost:4321',
    ),
  };
}

export function runtimeConfig(): RuntimeConfig {
  return resolveRuntimeConfig(process.env);
}

export function buildPostUrl(slug: string, config: RuntimeConfig = runtimeConfig()): string {
  return new URL(`posts/${encodeURIComponent(slug)}`, `${config.publicBaseUrl}/`).toString();
}

export function buildAssetUrl(
  file: string | { id: string } | null | undefined,
  config: RuntimeConfig = runtimeConfig(),
): string | null {
  if (!file) return null;
  const id = typeof file === 'string' ? file : file.id;
  return new URL(`assets/${encodeURIComponent(id)}`, `${config.directusPublicUrl}/`).toString();
}
