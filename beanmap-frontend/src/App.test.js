import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import { LANGUAGE_STORAGE_KEY } from './i18n';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('starts with confirmed locations and keeps branch-only evidence out of buy-in-store results', () => {
  render(<App />);
  expect(screen.getByRole('article', { name: 'HOME Coffee Roasters' })).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'Voyager Craft Coffee · Cupertino' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'South San Francisco' })).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: '購買方式' }), { target: { value: 'all' } });
  const pending = screen.getByRole('article', { name: 'Voyager Craft Coffee · Cupertino' });
  expect(within(pending).getByText('門市售豆待確認')).toBeInTheDocument();
  expect(within(pending).queryByText('可到店買豆')).not.toBeInTheDocument();
});

test('combines city and text search and supports empty-result recovery', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Sunnyvale' }));
  expect(screen.getByRole('button', { name: 'Sunnyvale' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByRole('article', { name: 'Dana Street Roasting Company' })).not.toBeInTheDocument();
  const search = screen.getByRole('searchbox', { name: '搜尋店名、品牌或地址' });
  fireEvent.change(search, { target: { value: 'HOME   McKINLEY' } });
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('article', { name: 'HOME Coffee Roasters' })).toBeInTheDocument();
  fireEvent.change(search, { target: { value: 'not-a-real-coffee-store' } });
  expect(screen.queryAllByRole('article')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: '重設篩選' }));
  expect(search).toHaveValue('');
  expect(screen.getByRole('button', { name: '全部城市' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('article', { name: 'Dana Street Roasting Company' })).toBeInTheDocument();
});

test('distinguishes preorder pickup and links navigation to the independently sourced street address', () => {
  render(<App />);
  const tico = screen.getByRole('article', { name: 'Tico Coffee Roasters' });
  expect(within(tico).getByText('需預訂自取')).toBeInTheDocument();
  expect(within(tico).getByRole('link', { name: '前往選豆' })).toHaveAttribute('href', 'https://www.ticoroasters.com/collections/coffee');
  const navigation = within(tico).getByRole('link', { name: '地圖與導航' });
  const url = new URL(navigation.href);
  expect(url.hostname).toBe('www.google.com');
  expect(url.searchParams.get('api')).toBe('1');
  expect(url.searchParams.get('query')).toContain('1334 Dell Ave, Ste G, Campbell, CA');
  expect(navigation).toHaveAttribute('rel', 'noopener noreferrer');
});

test('offers brand online shopping separately from confirmed in-store sales', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Palo Alto' }));
  fireEvent.change(screen.getByRole('combobox', { name: '購買方式' }), { target: { value: 'online' } });
  expect(screen.getByRole('article', { name: 'Verve Coffee · University Ave' })).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'Philz Coffee · Forest Ave' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: '店家類型' }), { target: { value: 'roaster' } });
  expect(screen.getByRole('article', { name: 'Verve Coffee · University Ave' })).toBeInTheDocument();
  expect(screen.queryByRole('article', { name: 'ZombieRunner Coffee · California Ave' })).not.toBeInTheDocument();
});

test('switches the interface and metadata while preserving all active filters', () => {
  const description = document.createElement('meta');
  description.name = 'description';
  document.head.appendChild(description);
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Sunnyvale' }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'HOME' } });
  fireEvent.change(screen.getByRole('combobox', { name: '購買方式' }), { target: { value: 'all' } });
  fireEvent.change(screen.getByRole('combobox', { name: '店家類型' }), { target: { value: 'roaster' } });
  fireEvent.click(screen.getByRole('button', { name: 'English' }));

  expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  expect(document.documentElement).toHaveAttribute('lang', 'en');
  expect(document.title).toBe('BeanMap | Bay Area Coffee Guide');
  expect(description.content).toContain('Find Bay Area coffee roasters');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your next great coffee,');
  expect(screen.getByRole('button', { name: 'Sunnyvale' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('searchbox', { name: 'Search shops, brands, or addresses' })).toHaveValue('HOME');
  expect(screen.getByRole('combobox', { name: 'How to buy' })).toHaveValue('all');
  expect(screen.getByRole('combobox', { name: 'Shop type' })).toHaveValue('roaster');
  expect(screen.getAllByRole('article')).toHaveLength(1);
  expect(screen.getByRole('status')).toHaveTextContent('1 location · Sunnyvale');
  expect(screen.getByText('House-roasted coffee beans, available online and at the shop.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /HOME Sunnyvale official order menu/ })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: '繁體中文' }));
  expect(document.documentElement).toHaveAttribute('lang', 'zh-Hant');
  expect(document.title).toBe('BeanMap｜灣區買豆指南');
  expect(screen.getByRole('searchbox', { name: '搜尋店名、品牌或地址' })).toHaveValue('HOME');
  expect(screen.getAllByRole('article')).toHaveLength(1);
  description.remove();
});

test('remembers the selected language on the next visit', () => {
  const firstVisit = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  firstVisit.unmount();
  render(<App />);
  expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('link', { name: 'Find coffee beans' })).toBeInTheDocument();
});

test('translates all catalog content and preserves sales evidence and navigation in English', () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
  render(<App />);
  const tico = screen.getByRole('article', { name: 'Tico Coffee Roasters' });
  expect(within(tico).getByText('Order ahead for pickup')).toBeInTheDocument();
  expect(within(tico).getByText(/Order online and wait for a pickup notification/)).toBeInTheDocument();
  expect(within(tico).getByRole('link', { name: 'Shop beans' })).toHaveAttribute('href', 'https://www.ticoroasters.com/collections/coffee');
  expect(new URL(within(tico).getByRole('link', { name: 'Map & directions' }).href).searchParams.get('query')).toContain('1334 Dell Ave, Ste G, Campbell, CA');

  fireEvent.change(screen.getByRole('combobox', { name: 'How to buy' }), { target: { value: 'all' } });
  expect(screen.getAllByRole('article')).toHaveLength(43);
  const pending = screen.getByRole('article', { name: 'Voyager Craft Coffee · Cupertino' });
  expect(within(pending).getByText('In-store sales unverified')).toBeInTheDocument();
  expect(within(pending).getByText(/In-store bean sales and pickup at this branch have not been confirmed/)).toBeInTheDocument();
  expect(screen.getByRole('main').textContent).not.toMatch(/\p{Script=Han}/u);

  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no-such-shop' } });
  expect(screen.getByText('No shops match these filters.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  expect(screen.getAllByRole('article')).toHaveLength(30);
  expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
});

test('keeps language switching usable when browser storage is blocked', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  render(<App />);
  expect(screen.getByRole('button', { name: '繁體中文' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByRole('link', { name: 'Find coffee beans' })).toBeInTheDocument();
});

test('falls back to Traditional Chinese for an unsupported saved language', () => {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'unsupported');
  render(<App />);
  expect(screen.getByRole('button', { name: '繁體中文' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('link', { name: '開始找豆' })).toBeInTheDocument();
});
