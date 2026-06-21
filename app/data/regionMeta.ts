export type Language = "zh" | "en";
export type ConfederationCode = "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";

type RegionOverride = {
  flag: string;
  zh: string;
  en: string;
};

export const regionCodes: Record<string, string> = {
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  "American Samoa": "AS",
  Andorra: "AD",
  Angola: "AO",
  Anguilla: "AI",
  "Antigua and Barbuda": "AG",
  Argentina: "AR",
  Armenia: "AM",
  Aruba: "AW",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  Bahamas: "BS",
  Bahrain: "BH",
  Bangladesh: "BD",
  Barbados: "BB",
  Belarus: "BY",
  Belgium: "BE",
  Belize: "BZ",
  Benin: "BJ",
  Bermuda: "BM",
  Bhutan: "BT",
  Bolivia: "BO",
  "Bosnia and Herzegovina": "BA",
  Botswana: "BW",
  Brazil: "BR",
  "British Virgin Islands": "VG",
  Brunei: "BN",
  Bulgaria: "BG",
  "Burkina Faso": "BF",
  Burundi: "BI",
  Cambodia: "KH",
  Cameroon: "CM",
  Canada: "CA",
  "Cape Verde": "CV",
  "Cayman Islands": "KY",
  "Central African Republic": "CF",
  Chad: "TD",
  Chile: "CL",
  China: "CN",
  "Chinese Taipei": "TW",
  Colombia: "CO",
  Comoros: "KM",
  Congo: "CG",
  "Cook Islands": "CK",
  "Costa Rica": "CR",
  Croatia: "HR",
  Cuba: "CU",
  Curaçao: "CW",
  Cyprus: "CY",
  Czechia: "CZ",
  "Côte d’Ivoire": "CI",
  "DR Congo": "CD",
  Denmark: "DK",
  Djibouti: "DJ",
  Dominica: "DM",
  "Dominican Republic": "DO",
  Ecuador: "EC",
  Egypt: "EG",
  "El Salvador": "SV",
  "Equatorial Guinea": "GQ",
  Eritrea: "ER",
  Estonia: "EE",
  Eswatini: "SZ",
  Ethiopia: "ET",
  "Faroe Islands": "FO",
  Fiji: "FJ",
  Finland: "FI",
  France: "FR",
  Gabon: "GA",
  Gambia: "GM",
  Georgia: "GE",
  Germany: "DE",
  Ghana: "GH",
  Gibraltar: "GI",
  Greece: "GR",
  Grenada: "GD",
  Guam: "GU",
  Guatemala: "GT",
  Guinea: "GN",
  "Guinea-Bissau": "GW",
  Guyana: "GY",
  Haiti: "HT",
  Honduras: "HN",
  "Hong Kong": "HK",
  Hungary: "HU",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Israel: "IL",
  Italy: "IT",
  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",
  Kazakhstan: "KZ",
  Kenya: "KE",
  Kuwait: "KW",
  Kyrgyzstan: "KG",
  Laos: "LA",
  Latvia: "LV",
  Lebanon: "LB",
  Lesotho: "LS",
  Liberia: "LR",
  Libya: "LY",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",
  Macau: "MO",
  Madagascar: "MG",
  Malawi: "MW",
  Malaysia: "MY",
  Maldives: "MV",
  Mali: "ML",
  Malta: "MT",
  Mauritania: "MR",
  Mauritius: "MU",
  Mexico: "MX",
  Moldova: "MD",
  Mongolia: "MN",
  Montenegro: "ME",
  Montserrat: "MS",
  Morocco: "MA",
  Mozambique: "MZ",
  Myanmar: "MM",
  Namibia: "NA",
  Nepal: "NP",
  Netherlands: "NL",
  "New Caledonia": "NC",
  "New Zealand": "NZ",
  Nicaragua: "NI",
  Niger: "NE",
  Nigeria: "NG",
  "North Korea": "KP",
  "North Macedonia": "MK",
  "Northern Mariana Islands": "MP",
  Norway: "NO",
  Oman: "OM",
  Pakistan: "PK",
  Palestine: "PS",
  Panama: "PA",
  "Papua New Guinea": "PG",
  Paraguay: "PY",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  "Puerto Rico": "PR",
  Qatar: "QA",
  "Republic of Ireland": "IE",
  Romania: "RO",
  Russia: "RU",
  Rwanda: "RW",
  "Saint Kitts and Nevis": "KN",
  "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC",
  Samoa: "WS",
  "San Marino": "SM",
  "Saudi Arabia": "SA",
  Senegal: "SN",
  Serbia: "RS",
  Seychelles: "SC",
  "Sierra Leone": "SL",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  "Solomon Islands": "SB",
  Somalia: "SO",
  "South Africa": "ZA",
  "South Korea": "KR",
  "South Sudan": "SS",
  Spain: "ES",
  "Sri Lanka": "LK",
  Sudan: "SD",
  Suriname: "SR",
  Sweden: "SE",
  Switzerland: "CH",
  Syria: "SY",
  "São Tomé and Príncipe": "ST",
  Tahiti: "PF",
  Tajikistan: "TJ",
  Tanzania: "TZ",
  Thailand: "TH",
  "Timor-Leste": "TL",
  Togo: "TG",
  Tonga: "TO",
  "Trinidad and Tobago": "TT",
  Tunisia: "TN",
  Turkmenistan: "TM",
  "Turks and Caicos Islands": "TC",
  Türkiye: "TR",
  "U.S. Virgin Islands": "VI",
  Uganda: "UG",
  Ukraine: "UA",
  "United Arab Emirates": "AE",
  "United States": "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
  Vanuatu: "VU",
  Venezuela: "VE",
  Vietnam: "VN",
  Yemen: "YE",
  Zambia: "ZM",
  Zimbabwe: "ZW",
};

const overrides: Record<string, RegionOverride> = {
  England: { flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", zh: "英格兰", en: "England" },
  Scotland: { flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}", zh: "苏格兰", en: "Scotland" },
  Wales: { flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}", zh: "威尔士", en: "Wales" },
  "Northern Ireland": { flag: "🇬🇧", zh: "北爱尔兰", en: "Northern Ireland" },
  "Chinese Taipei": { flag: "🇹🇼", zh: "中华台北 / 台湾", en: "Chinese Taipei / Taiwan" },
  Tahiti: { flag: "🇵🇫", zh: "塔希提 / 法属波利尼西亚", en: "Tahiti / French Polynesia" },
  Kosovo: { flag: "🇽🇰", zh: "科索沃", en: "Kosovo" },
  Curaçao: { flag: "🇨🇼", zh: "库拉索", en: "Curaçao" },
  "DR Congo": { flag: "🇨🇩", zh: "刚果民主共和国", en: "DR Congo" },
  "Côte d’Ivoire": { flag: "🇨🇮", zh: "科特迪瓦", en: "Côte d’Ivoire" },
  Türkiye: { flag: "🇹🇷", zh: "土耳其", en: "Türkiye" },
  Czechia: { flag: "🇨🇿", zh: "捷克", en: "Czechia" },
  "Republic of Ireland": { flag: "🇮🇪", zh: "爱尔兰", en: "Republic of Ireland" },
  "North Korea": { flag: "🇰🇵", zh: "朝鲜", en: "North Korea" },
  "South Korea": { flag: "🇰🇷", zh: "韩国", en: "South Korea" },
  "United States": { flag: "🇺🇸", zh: "美国", en: "United States" },
};

const confederations: Record<ConfederationCode, { zh: string; en: string }> = {
  AFC: { zh: "亚洲足球联合会", en: "Asian Football Confederation" },
  CAF: { zh: "非洲足球联合会", en: "Confederation of African Football" },
  CONCACAF: {
    zh: "中北美洲及加勒比海足球协会",
    en: "Confederation of North, Central America and Caribbean Association Football",
  },
  CONMEBOL: { zh: "南美洲足球联合会", en: "South American Football Confederation" },
  OFC: { zh: "大洋洲足球联合会", en: "Oceania Football Confederation" },
  UEFA: { zh: "欧洲足球协会联盟", en: "Union of European Football Associations" },
};

function codeToFlag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function displayNameFromCode(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function regionFlag(name: string) {
  const override = overrides[name];
  if (override) return override.flag;
  const code = regionCodes[name];
  return code ? codeToFlag(code) : "🏳️";
}

export function regionName(name: string, language: Language) {
  const override = overrides[name];
  if (override) return override[language];
  const code = regionCodes[name];
  if (!code) return name;
  return displayNameFromCode(code, language === "zh" ? "zh-CN" : "en");
}

export function regionLabel(name: string, language: Language) {
  const primary = regionName(name, language);
  const secondary = regionName(name, language === "zh" ? "en" : "zh");
  const suffix = primary === secondary ? "" : ` / ${secondary}`;
  return `${regionFlag(name)} ${primary}${suffix}`;
}

export function compactRegionLabel(name: string, language: Language) {
  return `${regionFlag(name)} ${regionName(name, language)}`;
}

export function confedName(confed: string, language: Language) {
  const metadata = confederations[confed as ConfederationCode];
  return metadata?.[language] ?? confed;
}

export function confedLabel(confed: string, language: Language) {
  const metadata = confederations[confed as ConfederationCode];
  if (!metadata) return confed;
  const primary = metadata[language];
  const secondary = metadata[language === "zh" ? "en" : "zh"];
  return `${confed} · ${primary} / ${secondary}`;
}
