const assert = require('assert');
const os = require('os');
const path = require('path');
const expect = require('chai').expect;
const request = require('request-promise');
const uuid4 = require('uuid/v4');
const desc = require('../../src/util/desc');

const dirPrefix = path.join(os.tmpdir(), 'tmp-');

desc('Testing useTmpDir', () => {
  desc('Testing Custom Before/After', { useTmpDir: true }, ({ beforeEach, afterEach, it }) => {
    let beforeDir;

    beforeEach(({ dir }) => {
      assert(dir.startsWith(dirPrefix));
      beforeDir = dir;
    });

    afterEach(({ dir }) => {
      assert(dir === null);
    });

    it('Testing dir matched beforeEach dir', ({ dir }) => {
      expect(dir).to.equal(beforeDir);
    });
  });

  desc('Testing Defaults', { useTmpDir: true }, ({ it }) => {
    it('Testing dir stars with prefix', ({ dir }) => {
      expect(dir.startsWith(dirPrefix)).to.equal(true);
    });
  });

  desc('Testing useTmpDir not set', ({ it }) => {
    it('Testing dir is null', ({ dir }) => {
      expect(dir).to.equal(null);
    });
  });
});

desc('Testing useNock', { useNock: true }, ({ it }) => {
  it('Testing useNock empty recording', () => {});

  it('Testing useNock record request', async () => {
    const result = await request({
      uri: 'http://ip-api.com/json',
      method: 'GET',
      json: true,
      resolveWithFullResponse: true
    });
    expect(result.headers.date).to.equal('Sun, 19 Nov 2017 02:02:30 GMT');
  });
});

desc('Testing environment variables', ({
  before, after, beforeEach, afterEach, it
}) => {
  before(() => {
    assert(process.env.VAR === 'VALUE');
  });

  after(() => {
    assert(process.env.VAR === undefined);
  });

  beforeEach(() => {
    assert(['VALUE', 'OTHER'].includes(process.env.VAR));
  });

  afterEach(() => {
    assert(['VALUE', 'OTHER'].includes(process.env.VAR));
  });

  it('Testing environment variable set', () => {
    expect(process.env.VAR).to.equal('VALUE');
  });

  desc('Testing environment variable overwrite', {
    envVars: { '^VAR': 'OTHER' }
  }, ({
    before: beforeInner,
    after: afterInner,
    beforeEach: beforeEachInner,
    afterEach: afterEachInner,
    it: itInner
  }) => {
    beforeInner(() => {
      assert(process.env.VAR === 'OTHER');
    });

    afterInner(() => {
      assert(process.env.VAR === 'VALUE');
    });

    beforeEachInner(() => {
      assert(process.env.VAR === 'OTHER');
    });

    afterEachInner(() => {
      assert(process.env.VAR === 'OTHER');
    });

    itInner('Testing environment variable overwritten', () => {
      expect(process.env.VAR).to.equal('OTHER');
    });
  });
});

desc('Testing freezing time', { timestamp: 123456789 }, ({ it, before, after }) => {
  before(() => {
    assert(Math.floor(new Date() / 1000) === 123456789);
  });

  after(() => {
    assert(Math.floor(new Date() / 1000) > 123456789);
  });

  it('Testing time is frozen', () => {
    expect(Math.floor(new Date() / 1000)).to.equal(123456789);
  });
});

desc('Testing console recording', { recordConsole: true }, ({ it }) => {
  const logger = ['log', 'info', 'error', 'warn'].reduce((p, c) => Object.assign(p, {
    // eslint-disable-next-line no-console
    [c]: (...args) => console[c](...args)
  }), {});

  it('Testing recorded logs', ({ getConsoleOutput }) => {
    expect(getConsoleOutput()).to.deep.equal([]);
    ['log', 'warn', 'error', 'info'].forEach((level) => {
      logger[level](level);
    });
    const result = getConsoleOutput();
    expect(result).to.deep.equal(['log', 'warn', 'error', 'info']);
    ['log', 'warn', 'error', 'info'].forEach((level) => {
      expect(result[level]).to.deep.equal([level]);
    });
  });

  it('Testing recording resets', ({ getConsoleOutput }) => {
    expect(getConsoleOutput()).to.deep.equal([]);
    logger.log('log');
    expect(getConsoleOutput()).to.deep.equal(['log']);
    expect(getConsoleOutput().error).to.deep.equal([]);
  });
});

desc('Testing random mocking', { cryptoSeed: 'ca8e7655-cd4f-47bf-a817-3b44f0f5b74e' }, ({ it }) => {
  it('Testing random is mocked', () => {
    expect(uuid4()).to.deep.equal('f052644d-e485-4693-aef0-76267f1499ea');
    expect(uuid4()).to.deep.equal('ba8e46ec-d63d-4fb8-9189-23e2454f7172');
  });
});

desc('Testing Before/After', ({
  before, after, beforeEach, afterEach, it
}) => {
  const state = [];

  before(() => {
    state.push('before');
  });

  after(() => {
    state.push('after');
    assert(state.join('-') === 'before-beforeEach-testOne-afterEach-beforeEach-testTwo-afterEach-after');
  });

  beforeEach(() => {
    state.push('beforeEach');
  });

  afterEach(() => {
    state.push('afterEach');
  });

  it('Test one', () => {
    state.push('testOne');
  });

  it('Test two', () => {
    state.push('testTwo');
  });
});

desc('Prevent Build-in Mocha Functions', ({ it: itCustom }) => {
  let error;
  try {
    it();
  } catch (e) {
    error = e;
  }

  itCustom('Testing Build-in Mocha throws', () => {
    expect(error.message).to.equal('Please use method "it" provided by node-tdd.');
  });
});

desc('Prevent Grandparent Function Usage', ({ it: itOuter }) => {
  desc('Prevent Inner Describe Uses Outer it', ({ it: itInner }) => {
    let error;
    try {
      itOuter();
    } catch (e) {
      error = e;
    }

    itInner('Testing Outer it throws when used in inner desc', () => {
      expect(error.message).to.equal('Please use "it" from parent "desc".');
    });
  });
});
