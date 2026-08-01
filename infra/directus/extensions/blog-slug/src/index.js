import { randomBytes } from 'node:crypto';

function normalizeTitle(title) {
  return String(title ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function randomSuffix() {
  return randomBytes(5).toString('hex');
}

async function slugExists(database, slug) {
  return Boolean(await database('articles').where({ slug }).first('id'));
}

export async function createSlug(payload, database, suffix = randomSuffix) {
  const explicit = String(payload.slug ?? '').trim();
  if (explicit) return explicit;

  const normalized = normalizeTitle(payload.title);
  if (normalized && !(await slugExists(database, normalized))) return normalized;

  let candidate = normalized ? `${normalized}-${suffix()}` : `post-${suffix()}`;
  while (await slugExists(database, candidate)) {
    candidate = normalized ? `${normalized}-${suffix()}` : `post-${suffix()}`;
  }
  return candidate;
}

export default ({ filter }, { database }) => {
  filter('articles.items.create', async (payload) => ({
    ...payload,
    slug: await createSlug(payload, database),
  }));
};
