import React, { useEffect, useMemo, useState } from 'react';
import catalog from './data/catalog.generated.json';
import { getInitialLanguage, languages, LANGUAGE_STORAGE_KEY, translations } from './i18n';
import './App.css';

const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
const cities = new Map(catalog.scope.cities.map(city => [city.id, city.name]));
const confirmedCount = catalog.locations.filter(store => store.in_store_beans === 'confirmed').length;

function Arrow({ diagonal = false }) {
  return <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}
  </svg>;
}

function BeanMark() {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M29.7 8.5c6 5 5.6 14-1.1 20.5S13 36 7.3 30.3 2 16 8.5 9.4 23.8 3.5 29.7 8.5Z" />
    <path d="M28 10c-11 0-7 16-18 19" />
  </svg>;
}

function CoffeeIllustration({ t }) {
  return <div className="coffee-illustration" aria-hidden="true">
    <div className="illustration-orbit orbit-one" /><div className="illustration-orbit orbit-two" />
    <span className="illustration-caption">A LITTLE LOCAL DISCOVERY</span>
    <svg viewBox="0 0 360 360" fill="none">
      <path d="m93 69 174-7 15 239-208 8L93 69Z" fill="#e9d6b6" stroke="#254b3c" strokeWidth="2" />
      <path d="m93 69 8-24 158-5 8 22-174 7Z" fill="#f8ead4" stroke="#254b3c" strokeWidth="2" />
      <path d="m101 45 1 16 157-5" stroke="#254b3c" strokeWidth="2" />
      <path d="m84 121 188-6 9 142-203 8 6-144Z" fill="#254b3c" />
      <text x="180" y="155" textAnchor="middle" fill="#e9d6b6" fontSize="12" letterSpacing="4">BEANMAP</text>
      <path d="M211 175c14 12 10 35-6 47s-37 9-44-4-2-29 11-40 28-12 39-3Z" stroke="#e9d6b6" strokeWidth="2" />
      <path d="M208 177c-27-2-17 36-44 41" stroke="#e9d6b6" strokeWidth="2" />
      <text x="180" y="245" textAnchor="middle" fill="#e9d6b6" fontSize="10" letterSpacing="3">BAY AREA COFFEE GUIDE</text>
      <path d="m88 285 181-7" stroke="#254b3c" strokeWidth="2" />
      <path d="M312 238c13 1 23 13 19 26s-19 18-28 9-9-26 0-32 7-3 9-3Z" fill="#c87e4e" />
      <path d="M321 243c-14 2-8 23-18 25" stroke="#f9f2e7" strokeWidth="1.5" />
      <path d="M38 180c12-8 27-3 29 10s-6 26-19 25-22-12-18-23 5-9 8-12Z" fill="#c87e4e" />
      <path d="M52 181c-15 6 0 20-15 24" stroke="#f9f2e7" strokeWidth="1.5" />
    </svg>
    <span className="illustration-stamp">{t.stampTop}<br />{t.stampBottom}</span>
  </div>;
}

function StoreCard({ store, language, t }) {
  const brand = catalog.brands[store.brand_id];
  const city = cities.get(store.city_id);
  const confirmed = store.in_store_beans === 'confirmed';
  const ahead = store.visit_mode === 'order_ahead_pickup';
  const status = confirmed ? (ahead ? t.statusPickup : t.statusConfirmed) : t.statusPending;
  const summary = language === 'en' ? brand.summary_en : brand.summary;
  const notes = language === 'en' ? store.notes_en : store.notes;
  const references = [...new Set([...store.location_source_ids, ...store.sales_evidence_source_ids,
    ...(brand.bean_shop_source_id ? [brand.bean_shop_source_id] : [])])];
  const address = `${store.street_address}, ${city}, CA`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name}, ${address}`)}`;
  return <article className="store-card" aria-labelledby={`${store.id}-title`}>
    <div className="card-topline"><span className="city-label"><span className="location-dot" />{city}</span>
      <span className={`sales-badge ${confirmed ? 'is-confirmed' : 'is-pending'}`}>{status}</span></div>
    <div className="card-heading"><span className="brand-initial" aria-hidden="true">{brand.name[0]}</span>
      <div><p className="store-kind">{t.kinds[brand.kind]}{ahead ? ` · ${t.pickupPoint}` : ''}</p><h3 id={`${store.id}-title`}>{store.name}</h3></div></div>
    <p className="store-summary">{summary}</p>
    <p className="store-address">{store.street_address}<br /><span>{city}, California</span></p>
    <div className="card-actions"><a className="button button-small button-primary" href={brand.bean_shop_url || store.location_page_url || brand.website_url} target="_blank" rel="noopener noreferrer">
      {brand.bean_shop_url ? t.shopBeans : t.storePage}<Arrow diagonal /></a>
      <a className="map-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">{t.maps}<Arrow diagonal /></a></div>
    <details className="store-evidence"><summary>{t.evidence} · {store.last_checked_on.replaceAll('-', '/')}</summary><div className="evidence-body">
      <p>{notes || (confirmed ? t.defaultEvidence : t.pendingEvidence)}</p>
      {store.confirmation_basis === 'brand_policy' && <p>{t.brandPolicyEvidence}</p>}
      <ul>{references.map(id => <li key={id}><a href={catalog.sources[id].url} target="_blank" rel="noopener noreferrer">{language === 'en' ? catalog.sources[id].title_en : catalog.sources[id].title}<span className="sr-only">{t.opensNewTab}</span></a></li>)}</ul>
    </div></details>
  </article>;
}

function App() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const t = translations[language];
  const [city, setCity] = useState('all');
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState('confirmed');
  const [kind, setKind] = useState('all');
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.pageTitle;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = t.metaDescription;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // A language choice should not depend on browser storage permissions.
    }
  }, [language, t]);
  const stores = useMemo(() => {
    const terms = normalize(query).split(' ').filter(Boolean);
    return catalog.locations.filter(store => {
      const brand = catalog.brands[store.brand_id];
      const searchable = normalize(`${store.name} ${brand.name} ${cities.get(store.city_id)} ${store.street_address}`);
      return (city === 'all' || store.city_id === city) &&
        (channel !== 'confirmed' || store.in_store_beans === 'confirmed') &&
        (channel !== 'online' || Boolean(brand.bean_shop_url)) &&
        (kind === 'all' || brand.kind === kind) && terms.every(term => searchable.includes(term));
    }).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }, [city, query, channel, kind]);
  function resetFilters() { setCity('all'); setQuery(''); setChannel('confirmed'); setKind('all'); }
  return <>
    <a className="skip-link" href="#shops">{t.skipLink}</a>
    <header className="site-header page-width"><a className="brand-logo" href="#top" aria-label={t.homeLabel}><BeanMark /><span>BeanMap<span className="logo-period">.</span></span></a>
      <div className="header-actions"><nav aria-label={t.navShops}><a href="#shops">{t.navShops}</a><a href="#about">{t.navAbout}<Arrow diagonal /></a></nav>
        <div className="language-switch" role="group" aria-label={t.languageLabel}>{languages.map(item => <button key={item.id} type="button" lang={item.id} aria-label={item.accessibleLabel} aria-pressed={language === item.id} onClick={() => setLanguage(item.id)}>{item.label}</button>)}</div>
      </div></header>
    <main id="top"><section className="hero page-width" aria-labelledby="hero-title"><div className="hero-copy">
      <p className="eyebrow"><span />BAY AREA COFFEE GUIDE</p><h1 id="hero-title">{t.heroTitle}<br /><span>{t.heroTitleAccent}</span></h1>
      <p className="hero-description">{t.heroDescription}<br className="desktop-break" />{' '}{t.heroDescriptionMore}</p>
      <a className="button button-primary hero-button" href="#shops">{t.findBeans}<Arrow /></a>
      <div className="hero-stats"><div><strong>{confirmedCount}<span>{t.countUnit}</span></strong><span>{t.confirmedStat}</span></div><div><strong>{catalog.scope.cities.length}<span>{t.cityUnit}</span></strong><span>{t.citiesStat}</span></div><div><strong>{Object.keys(catalog.brands).length}<span>{t.countUnit}</span></strong><span>{t.brandsStat}</span></div></div>
    </div><CoffeeIllustration t={t} /></section>
    <section className="directory" id="shops" aria-labelledby="shops-title"><div className="page-width">
      <div className="section-heading"><div><p className="eyebrow">FIND YOUR NEXT BAG</p><h2 id="shops-title">{t.directoryTitle}</h2></div><span className="edition-label">SOUTH BAY & PENINSULA / VOL. 01</span></div>
      <div className="city-filters" role="group" aria-label={t.cityFilters}><button className={city === 'all' ? 'city-chip active' : 'city-chip'} aria-pressed={city === 'all'} onClick={() => setCity('all')}>{t.allCities}</button>
        {catalog.scope.cities.map(item => <button key={item.id} className={city === item.id ? 'city-chip active' : 'city-chip'} aria-pressed={city === item.id} onClick={() => setCity(item.id)}>{item.name}</button>)}</div>
      <div className="search-toolbar"><div className="search-field"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg><input type="search" aria-label={t.search} placeholder={t.searchPlaceholder} value={query} onChange={event => setQuery(event.target.value)} /></div>
        <label className="select-field"><span className="sr-only">{t.channelLabel}</span><select aria-label={t.channelLabel} value={channel} onChange={event => setChannel(event.target.value)}><option value="confirmed">{t.channelConfirmed}</option><option value="online">{t.channelOnline}</option><option value="all">{t.channelAll}</option></select></label>
        <label className="select-field"><span className="sr-only">{t.kindLabel}</span><select aria-label={t.kindLabel} value={kind} onChange={event => setKind(event.target.value)}><option value="all">{t.kindAll}</option><option value="roaster">{t.kinds.roaster}</option><option value="retailer">{t.kinds.retailer}</option><option value="coffee_brand">{t.kinds.coffee_brand}</option></select></label></div>
      <div className="results-heading"><p role="status"><strong>{stores.length}</strong>{t.locationUnit(stores.length)}{city !== 'all' && <span> · {cities.get(city)}</span>}</p><p>{t.updated}{catalog.updated_on.replaceAll('-', '/')}<span className="results-divider">/</span>{t.inventoryNote}</p></div>
      {stores.length ? <div className="store-grid">{stores.map(store => <StoreCard store={store} key={store.id} language={language} t={t} />)}</div> : <div className="empty-state"><BeanMark /><h3>{t.emptyTitle}</h3><p>{t.emptyDescription}</p><button className="button button-primary" onClick={resetFilters}>{t.resetFilters}<Arrow /></button></div>}
      {stores.length > 0 && <p className="directory-end">{t.directoryEnd}<span> · </span><button onClick={resetFilters}>{t.resetCities}</button></p>}
    </div></section>
    <section className="about-section page-width" id="about" aria-labelledby="about-title"><div><p className="eyebrow">A GUIDE YOU CAN TRACE</p><h2 id="about-title">{t.aboutTitle}</h2><p>{t.aboutDescription}<br />{' '}{t.aboutDescriptionMore}</p></div>
      <div className="about-notes"><div><span>01</span><p><strong>{t.aboutPickupTitle}</strong>{t.aboutPickup}</p></div><div><span>02</span><p><strong>{t.aboutBranchTitle}</strong>{t.aboutBranch}</p></div><div><span>03</span><p><strong>{t.aboutStockTitle}</strong>{t.aboutStock(catalog.locations.length, catalog.locations.length - confirmedCount)}</p></div></div>
    </section></main>
    <footer className="site-footer page-width"><a className="brand-logo" href="#top"><BeanMark /><span>BeanMap.</span></a><p>{t.footer}</p><span>Made for your next coffee run.</span></footer>
  </>;
}

export default App;

