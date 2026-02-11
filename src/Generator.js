import mersenne from 'mersenne';
import CryptoJS from 'crypto-js';
import { faker } from '@faker-js/faker';
import { transliterate } from 'transliteration';
import dayjs from 'dayjs';
import { data } from './data';
import { injects } from './injects';
import { random, randomItem, range, uppercaseify, pad } from './utils';
// Note: 'util' import removed, using local 'pad' from utils. settings removed/simplified.

const settings = { maxResults: 5000 };
const version = '1.4';

export class Generator {
  constructor() {
    this.originalFields = [
      'gender', 'name', 'location', 'email',
      'login', 'registered', 'dob', 'phone',
      'cell', 'id', 'picture', 'nat'
    ];
    this.constantTime = 1653344189;
    this.version = version;

    this.datasets = null;
    this.injects = null;
    this.nats = [];
  }

  async init() {
    if (this.datasets === null) {
      this.datasets = data;
      this.injects = injects;
      this.nats = this.getNats();
    }
  }

  // Returns random user object
  async generate(options) {
    await this.init();
    options = options || {};

    return new Promise((resolve, reject) => {
      // Check for multiple vals
      this.checkOptions(options);
      this.results  = Number(options.results);
      this.seed     = options.seed || '';
      this.lego     = typeof options.lego !== 'undefined' && options.lego !== 'false' ? true : false;
      this.gender   = options.gender || null;
      this.format   = (options.format || options.fmt || 'json').toLowerCase();
      this.nat      = options.nat || options.nationality || null;
      this.noInfo   = typeof options.noinfo !== 'undefined' && options.lego !== 'false' ? true : false;
      this.page     = Number(options.page) || 1;
      this.password = options.password;

      // Include all fields by default
      this.inc     = options.inc || this.originalFields.join(', ');
      this.exc     = options.exc || '';

      this.inc = this.inc.split(',').filter((i) => i !== '').map((w) => w.trim().toLowerCase());
      this.exc = this.exc.split(',').filter((i) => i !== '').map((w) => w.trim().toLowerCase());

      // Remove exclusions
      this.inc = this.inc.filter((w) => this.exc.indexOf(w) === -1);

      // Update exclusions list to inverse of inclusions
      this.exc = this.originalFields.filter((w) => this.inc.indexOf(w) === -1);

      if (this.nat !== null) {
        this.nat = this.nat.split(',').filter((i) => i !== '');
      }

      if (this.nat !== null) this.nat = uppercaseify(this.nat);

      // Sanitize values
      if (isNaN(this.results) || this.results < 0 || this.results > settings.maxResults || this.results === '') this.results = 1;

      if (this.gender !== 'male' && this.gender !== 'female' || this.seed !== '') {
        this.gender = null;
      }

      if (this.lego) this.nat = 'LEGO';
      else if (this.nat !== null && !(this.validNat(this.nat))) this.nat = null;

      if (this.seed.length === 18) {
        this.nat = this.nats[parseInt(this.seed.slice(-2), 16)];
      } else if (this.seed === '') {
        this.defaultSeed();
      }

      if (this.page < 0 || this.page > 10000) this.page = 1;
      ///////////////////

      this.seedRNG();

      let output = [];
      let nat, inject;

      for (let i = 0; i < this.results; i++) {
        this.current = {};
        nat = this.nat === null ? this.randomNat() : this.nat;
        if (Array.isArray(nat)) {
          nat = nat[range(0, nat.length-1)];
        }
        inject = this.injects[nat];

        this.current.gender = this.gender === null ? randomItem(['male', 'female']) : this.gender;

        let name = this.randomName(this.current.gender, nat);
        this.include('name', {
          title: this.current.gender === 'male' ? 'Mr' : randomItem(this.datasets.common.title),
          first: name[0],
          last: name[1]
        });

        let timezone = JSON.parse(randomItem(this.datasets.common.timezones));
        this.include('location', {
          street: {
            number: range(1, 9999),
            name: randomItem(this.datasets[nat].street)
          },
          city: randomItem(this.datasets[nat].cities),
          state: randomItem(this.datasets[nat].states),
          country: this.fullNatName(nat),
          postcode: range(10000, 99999),
          coordinates: {
            latitude: faker.address.latitude(),
            longitude: faker.address.longitude()
          },
          timezone
        });

        this.include('email', transliterate(`${name[0]}.${name[1]}`).replace(/ /g, '').toLowerCase() + '@example.com');

        let salt = random(2, 8);
        let password = this.password === undefined ? randomItem(this.datasets.common.passwords) : this.genPassword();
        this.include('login', {
          uuid: faker.datatype.uuid(),
          username: randomItem(this.datasets.common.user1) + randomItem(this.datasets.common.user2) + range(100, 999),
          password,
          salt:   salt,
          md5:    CryptoJS.MD5(password + salt).toString(CryptoJS.enc.Hex),
          sha1:   CryptoJS.SHA1(password + salt).toString(CryptoJS.enc.Hex),
          sha256: CryptoJS.SHA256(password + salt).toString(CryptoJS.enc.Hex)
        });

        let dob = range(-800000000000, this.constantTime * 1000 - 86400000 * 365 * 21);
        let dobDate = new Date(dob);

        this.current.dob = {
          date: dobDate.toISOString(),
          age:  dayjs().diff(dayjs(dobDate), 'years'),
        };
        let reg = range(1016688461000, this.constantTime * 1000);
        let regDate = new Date(reg);
        this.include('registered', {
          date: regDate.toISOString(),
          age: dayjs().diff(dayjs(regDate), 'years'),
        });

        let id, genderText;
        if (nat != 'LEGO') {
            id = this.current.gender == 'male' ? range(0, 99) : range(0, 96);
            genderText = this.current.gender == 'male' ? 'men' : 'women';
        } else {
            id = range(0, 9);
            genderText = 'lego';
        }
        let base = 'https://randomuser.me/api/';

        this.include('picture', {
          large: base + 'portraits/' + genderText + '/' + id + '.jpg',
          medium: base + 'portraits/med/' + genderText + '/' + id + '.jpg',
          thumbnail: base + 'portraits/thumb/' + genderText + '/' + id + '.jpg'
        });

        if (inject) inject(this.inc, this.current, this.datasets);  // Inject unique fields for nationality

        this.include('nat', nat);

        // Gender hack - Remove gender if the user doesn't want it in the results
        if (this.inc.indexOf('gender') === -1) {
          delete this.current.gender;
        }

        // DoB hack - DoB is required for id generation in NO dataset
        if (this.inc.indexOf('dob') === -1) {
          delete this.current.dob;
        }

        output.push(this.current);
      }

      let json = {
        results: output,
        info: {
          seed: String(this.seed + (this.nat !== null && !Array.isArray(this.nat) ? pad((this.nats.indexOf(this.nat)).toString(16), 2) : '')),
          results: this.results,
          page: this.page,
          version: this.version
        }
      };

      if (this.noInfo) delete json.info;

      if (this.format === 'prettyjson' || this.format === 'pretty') {
        resolve({output: JSON.stringify(json, null, 2), ext: "json"});
      } else {
        resolve({output: JSON.stringify(json), ext: "json"});
      }
    });
  }

  // Seeds Mersenne Twister PRNG
  seedRNG() {
    let seed = this.seed;
    if (this.seed.length === 18) {
      seed = this.seed.substring(0, 16);
    }
    seed = this.page !== 1 ? seed + String(this.page) : seed;

    seed = parseInt(CryptoJS.MD5(seed).toString(CryptoJS.enc.Hex).substring(0, 8), 16);
    mersenne.seed(seed);
    faker.seed(seed);
  }

  // Choose random seed
  defaultSeed() {
    this.seed = random(1, 16);
  }

  // Return random nat to use
  randomNat() {
    return this.nats[range(0, this.nats.length - 1)];
  }

  // Make sure nat is available
  validNat(nat) {
    if (Array.isArray(nat)) {
      for (var i = 0; i < nat.length; i++) {
        if (this.nats.indexOf(nat[i]) === -1) {
          return false;
        }
      }
    } else {
      return this.nats.indexOf(nat) !== -1;
    }
    return true;
  }

  randomName(gender, nat) {
    gender = gender === undefined ? randomItem(['male', 'female']) : gender;
    return [randomItem(this.datasets[nat][gender + '_first']), randomItem(this.datasets[nat]['last'])];
  }

  // Return available nats
  getNats() {
    let exclude = ['common', 'LEGO'];
    let nats = Object.keys(this.datasets).filter(nat => {
      return exclude.indexOf(nat) == -1;
    });
    return nats;
  }

  include(field, value) {
    if (this.inc.indexOf(field) !== -1) {
      this.current[field] = value;
    }
  }

  checkOptions(options) {
    let keys = Object.keys(options);
    for (let i = 0; i < keys.length; i++) {
      if (Array.isArray(options[keys[i]])) {
        options[keys[i]] = options[keys[i]][options[keys[i]].length-1];
      }
    }
  }

  genPassword() {
    if (this.password.length === 0) {
      return randomItem(this.datasets.common.passwords);
    }

    let charsets = {
      special: " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      lower: "abcdefghijklmnopqrstuvwxyz",
      number: "0123456789"
    };

    // Parse sections
    let sections = ["special", "upper", "lower", "number"];
    let matches = this.password.split(',').filter(val => sections.indexOf(val) !== -1)

    if (matches.length === 0) {
      return randomItem(this.datasets.common.passwords);
    }

    matches = matches.filter((v,i,self) => self.indexOf(v) === i);

    // Construct charset to choose from
    let charset = "";
    matches.forEach(match => {
      charset += charsets[match];
    });

    let length = this.password.split(',').slice(-1)[0];

    // Range
    let min, max;
    if (length.indexOf('-') !== -1) {
      let range = length.split('-').map(Number);
      min = Math.min(...range);
      max = Math.max(...range);
    } else {
      min = Number(Number(length));
      max = min;
    }
    min = min > 64 || min < 1 || min === undefined || isNaN(min) ? 8 : min;
    max = max > 64 || max < 1 || max === undefined || isNaN(max) || max < min ? 64 : max;

    let passLen = range(min, max);

    // Generate password
    let password = "";
    for (let i = 0; i < passLen; i++) {
      password += String(charset[range(0, charset.length-1)]);
    }

    return password;
  }

  fullNatName(nat) {
    const mapping = {
      AU: "Australia",
      BR: "Brazil",
      CA: "Canada",
      CH: "Switzerland",
      DE: "Germany",
      DK: "Denmark",
      ES: "Spain",
      FI: "Finland",
      FR: "France",
      GB: "United Kingdom",
      IE: "Ireland",
      IN: "India",
      IR: "Iran",
      MX: "Mexico",
      NL: "Netherlands",
      NO: "Norway",
      NZ: "New Zealand",
      RS: "Serbia",
      TR: "Turkey",
      UA: "Ukraine",
      US: "United States",
    };
    return mapping[nat];
  }
}
