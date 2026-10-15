import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/bay_area_catalog.json'), 'utf8'));
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };
const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const isUrl = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const isText = value => typeof value === 'string' && value.trim().length > 0;
const cities = catalog.scope?.cities || [];
const cityIds = new Set(cities.map(city => city.id));
const sourceIds = new Set(Object.keys(catalog.sources || {}));
const seen = new Set();
const addresses = new Set();
expect(catalog.schema_version === 1, 'Unsupported schema_version');
expect(isDate(catalog.updated_on), 'updated_on must be an ISO calendar date');
expect(cityIds.size === 10 && cities.length === 10, 'The launch scope must contain ten unique cities');
for (const [id, source] of Object.entries(catalog.sources || {})) {
  expect(isUrl(source.url) && source.title && source.supports, `${id}: invalid source URL or missing evidence summary`);
  expect(isText(source.title_en), `${id}: missing English source title`);
  expect(isDate(source.checked_on) && source.checked_on <= catalog.updated_on, `${id}: invalid source date`);
  expect(['official_website', 'merchant_menu', 'official_storefront'].includes(source.kind), `${id}: unknown source kind`);
}
for (const [id, brand] of Object.entries(catalog.brands || {})) {
  expect(brand.name && brand.summary && isUrl(brand.website_url), `${id}: incomplete brand identity`);
  expect(isText(brand.summary_en), `${id}: missing English brand summary`);
  expect(['roaster', 'retailer', 'coffee_brand'].includes(brand.kind), `${id}: unknown brand kind`);
  if (brand.bean_shop_url) {
    expect(isUrl(brand.bean_shop_url) && sourceIds.has(brand.bean_shop_source_id), `${id}: shop URL needs an evidence source`);
  } else expect(brand.bean_shop_source_id === null, `${id}: shop source without a shop URL`);
}
for (const store of catalog.locations || []) {
  const id = store.id;
  expect(/^[a-z0-9-]+$/.test(id || '') && !seen.has(id), `Duplicate or invalid location ID: ${id}`);
  seen.add(id);
  expect(Boolean(catalog.brands[store.brand_id]) && cityIds.has(store.city_id), `${id}: unknown brand or launch city`);
  expect(store.name && store.street_address && store.state === 'CA' && store.country === 'US', `${id}: incomplete location`);
  expect(typeof store.notes === 'string' && typeof store.notes_en === 'string' && (!store.notes.trim() || isText(store.notes_en)), `${id}: notes require an English translation`);
  expect(['confirmed', 'unconfirmed'].includes(store.in_store_beans), `${id}: invalid sales status`);
  expect(['walk_in', 'order_ahead_pickup'].includes(store.visit_mode), `${id}: invalid visit mode`);
  expect(store.location_source_ids?.length > 0 && Array.isArray(store.sales_evidence_source_ids), `${id}: missing evidence references`);
  expect(isUrl(store.location_page_url) && store.location_source_ids.some(ref => catalog.sources[ref]?.url === store.location_page_url), `${id}: location page must match an address source`);
  for (const ref of [...(store.location_source_ids || []), ...(store.sales_evidence_source_ids || [])]) {
    expect(sourceIds.has(ref), `${id}: unknown source ${ref}`);
  }
  if (store.in_store_beans === 'confirmed') {
    expect(store.sales_evidence_source_ids?.length > 0 && ['store_statement', 'store_menu', 'pickup_policy', 'brand_policy'].includes(store.confirmation_basis), `${id}: confirmed sales require supporting evidence`);
    expect(store.sales_evidence_source_ids.every(ref => catalog.sources[ref]?.available !== false), `${id}: unavailable evidence cannot confirm sales`);
  } else expect(store.confirmation_basis === 'unconfirmed' && store.sales_evidence_source_ids?.length === 0, `${id}: unconfirmed branch must not claim confirmed sales evidence`);
  expect(isDate(store.last_checked_on) && store.last_checked_on <= catalog.updated_on, `${id}: invalid check date`);
  expect(store.stock_status === 'unknown', `${id}: the seed catalog must not claim live stock`);
  const addressKey = `${store.brand_id}|${store.city_id}|${String(store.street_address || '').toLowerCase()}`;
  expect(!addresses.has(addressKey), `${id}: duplicate brand/address`);
  addresses.add(addressKey);
  if (store.coordinates !== null) {
    const { latitude, longitude } = store.coordinates || {};
    expect(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180 && sourceIds.has(store.coordinate_source_id), `${id}: coordinates require valid values and an independent source`);
  } else expect(store.coordinate_source_id === null, `${id}: coordinate source without coordinates`);
}
for (const city of cities) {
  expect(catalog.locations.some(store => store.city_id === city.id && store.in_store_beans === 'confirmed'), `${city.name}: no confirmed buy-beans or pickup location`);
}
if (errors.length) { console.error(errors.map(error => `- ${error}`).join('\n')); process.exit(1); }
const confirmed = catalog.locations.filter(store => store.in_store_beans === 'confirmed').length;
console.log(`Catalog valid: ${catalog.locations.length} locations, ${confirmed} confirmed, ${catalog.locations.length - confirmed} pending, ${cities.length} cities.`);
if (!process.argv.includes('--check')) {
  const destination = path.join(root, 'beanmap-frontend/src/data/catalog.generated.json');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(catalog, null, 2) + '\n');
  console.log('Frontend catalog synchronized.');
}
