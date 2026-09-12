const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../adsense.js'), 'utf8');
const key = 'cartoonmax-ad-consent-v1';

function setup(options = {}) {
  const listeners = {};
  const scripts = [];
  const panels = [];
  const storage = new Map();
  let kid = options.kid ?? false;
  let reloads = 0;

  class Element {
    constructor() {
      this.listeners = {};
      this.dataset = {};
      this.hidden = false;
      this.isConnected = true;
    }
    setAttribute(name, value) { this[name] = value; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    focus() {}
    click() { this.listeners.click?.(); }
    set innerHTML(value) {
      this.html = value;
      this.buttons = ['deny', 'allow'].map(choice => {
        const button = new Element();
        button.dataset.adChoice = choice;
        return button;
      });
    }
    querySelectorAll() { return this.buttons; }
    querySelector() { return this.buttons[0]; }
  }

  if (options.choice) storage.set(key, JSON.stringify({
    version: 1,
    choice: options.choice,
    time: options.time ?? Date.now()
  }));
  const settings = new Element();
  const context = {
    document: {
      querySelector: () => ({ content: options.client ?? 'ca-pub-7962627237294175' }),
      getElementById: () => settings,
      createElement: () => new Element(),
      head: { appendChild: element => scripts.push(element) },
      body: { appendChild: element => panels.push(element) },
      activeElement: settings
    },
    location: {
      hostname: options.host ?? 'cartoon-max.netlify.app',
      reload: () => { reloads++; }
    },
    localStorage: {
      getItem: name => { if (options.noStorage) throw Error(); return storage.get(name) ?? null; },
      setItem: (name, value) => { if (options.noStorage) throw Error(); storage.set(name, value); }
    },
    prof: () => ({ kid }),
    addEventListener: (name, fn) => { listeners[name] = fn; }
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return {
    context, scripts, panels, settings, storage,
    get reloads() { return reloads; },
    choose(choice) { panels.at(-1).buttons.find(b => b.dataset.adChoice === choice).click(); },
    changeProfile(value) { kid = value; listeners['cartoonmax:profile-change'](); },
    storageEvent(event) { listeners.storage(event); }
  };
}

test('adult requests no ads until explicit opt-in; only one Google loader', () => {
  const env = setup();
  assert.equal(env.scripts.length, 0);
  assert.equal(env.panels[0].hidden, false);
  env.choose('allow');
  env.choose('allow');
  assert.equal(env.scripts.length, 1);
  assert.equal(env.scripts[0].src, 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7962627237294175');
  assert.equal(env.scripts[0].async, true);
  assert.equal(env.scripts[0].crossOrigin, 'anonymous');
  assert.equal(env.context.adsbygoogle.requestNonPersonalizedAds, 1);
});

test('rejecting keeps Google unloaded and remembers the decision', () => {
  const env = setup();
  env.choose('deny');
  assert.equal(env.scripts.length, 0);
  assert.equal(env.panels[0].hidden, true);
  assert.equal(JSON.parse(env.storage.get(key)).choice, 'deny');
  const returning = setup({ choice: 'deny' });
  assert.equal(returning.scripts.length, 0);
  assert.equal(returning.panels.length, 0);
});

test('child profiles never load Google, even with a saved opt-in', () => {
  const env = setup({ kid: true, choice: 'allow' });
  assert.equal(env.scripts.length, 0);
  assert.equal(env.panels.length, 0);
  assert.equal(env.settings.hidden, true);
});

test('switching from an opted-in adult profile to child pauses and reloads', () => {
  const env = setup({ choice: 'allow' });
  env.changeProfile(true);
  assert.equal(env.reloads, 1);
  assert.equal(env.context.adsbygoogle.pauseAdRequests, 1);
});

test('revocation pauses and reloads to remove the third-party context', () => {
  const env = setup({ choice: 'allow' });
  env.settings.click();
  env.choose('deny');
  assert.equal(env.reloads, 1);
  assert.equal(env.context.adsbygoogle.pauseAdRequests, 1);
  assert.equal(JSON.parse(env.storage.get(key)).choice, 'deny');
});

test('expired consent requires a fresh choice', () => {
  const env = setup({ choice: 'allow', time: Date.now() - 181 * 86400000 });
  assert.equal(env.scripts.length, 0);
  assert.equal(env.panels.length, 1);
});

test('preview, localhost, CDN, and invalid publisher values never request ads', () => {
  for (const host of ['localhost', 'preview--cartoon-max.netlify.app', 'cdn.jsdelivr.net', 'rawcdn.githack.com']) {
    const env = setup({ host, choice: 'allow' });
    assert.equal(env.scripts.length, 0);
  }
  assert.equal(setup({ client: 'ca-pub-invalid', choice: 'allow' }).scripts.length, 0);
});

test('unavailable storage fails closed until a current explicit choice', () => {
  const env = setup({ noStorage: true });
  assert.equal(env.scripts.length, 0);
  env.choose('deny');
  assert.equal(env.scripts.length, 0);
});

test('clearing consent in another tab stops existing ads', () => {
  const env = setup({ choice: 'allow' });
  env.storage.delete(key);
  env.storageEvent({ key, newValue: null });
  assert.equal(env.reloads, 1);
  assert.equal(env.context.adsbygoogle.pauseAdRequests, 1);
});

test('ordinary poster-cache writes do not reload tabs; child switch does', () => {
  const env = setup({ choice: 'allow' });
  env.storageEvent({ key: 'cartoonmax3', newValue: JSON.stringify({ profile: 0, profiles: [{ kid: false }] }) });
  assert.equal(env.reloads, 0);
  env.storageEvent({ key: 'cartoonmax3', newValue: JSON.stringify({ profile: 1, profiles: [{ kid: false }, { kid: true }] }) });
  assert.equal(env.reloads, 1);
});

test('account verification, seller declaration and local asset references match', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /name="google-adsense-account" content="ca-pub-7962627237294175"/);
  assert.equal(fs.readFileSync(path.join(root, 'ads.txt'), 'utf8').trim(), 'google.com, pub-7962627237294175, DIRECT, f08c47fec0942fa0');
  assert.equal((html.match(/src="adsense.js"/g) || []).length, 1);
  for (const match of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
    if (!/^https?:/.test(match[1])) assert.ok(fs.existsSync(path.join(root, match[1])), match[1]);
  }
});
