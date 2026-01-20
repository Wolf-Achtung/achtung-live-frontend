// patterns-offline.js - Provides offline analysis patterns for PWA caching

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const lang = event.queryStringParameters?.lang || 'de';

  // Offline patterns for client-side analysis
  const patterns = {
    de: {
      patterns: {
        email: {
          regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
          flags: 'gi',
          label: 'E-Mail-Adresse',
          risk: 'medium',
          message: 'E-Mail-Adresse erkannt'
        },
        phone: {
          regex: '(\\+49|0)[0-9\\s/-]{8,15}',
          flags: 'g',
          label: 'Telefonnummer',
          risk: 'medium',
          message: 'Telefonnummer erkannt'
        },
        iban: {
          regex: '[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}',
          flags: 'gi',
          label: 'IBAN',
          risk: 'high',
          message: 'Bankverbindung (IBAN) erkannt'
        },
        address: {
          regex: '(Str\\.|Straße|Strasse|Weg|Platz|Allee|Ring)\\s*[0-9]+',
          flags: 'gi',
          label: 'Adresse',
          risk: 'medium',
          message: 'Adresse erkannt'
        },
        postal: {
          regex: '\\b[0-9]{5}\\s+[A-ZÄÖÜ][a-zäöüß]+',
          flags: 'g',
          label: 'PLZ/Ort',
          risk: 'low',
          message: 'Postleitzahl mit Ort erkannt'
        },
        health: {
          regex: '(Diagnose|Krankheit|Medikament|Therapie|Arzt|Krankenhaus|Operation|Symptom)',
          flags: 'gi',
          label: 'Gesundheitsdaten',
          risk: 'high',
          message: 'Gesundheitsbezogene Informationen erkannt'
        },
        password: {
          regex: '(Passwort|Kennwort|PIN|Zugangscode|Password)\\s*[:=]?\\s*\\S+',
          flags: 'gi',
          label: 'Zugangsdaten',
          risk: 'critical',
          message: 'Mögliche Zugangsdaten erkannt'
        }
      },
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    },
    en: {
      patterns: {
        email: {
          regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
          flags: 'gi',
          label: 'Email Address',
          risk: 'medium',
          message: 'Email address detected'
        },
        phone: {
          regex: '(\\+1|\\+44|\\+49)?[0-9\\s.-]{8,15}',
          flags: 'g',
          label: 'Phone Number',
          risk: 'medium',
          message: 'Phone number detected'
        },
        iban: {
          regex: '[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}',
          flags: 'gi',
          label: 'IBAN',
          risk: 'high',
          message: 'Bank account (IBAN) detected'
        },
        address: {
          regex: '(Street|St\\.|Avenue|Ave\\.|Road|Rd\\.|Lane|Ln\\.)\\s*[0-9]+',
          flags: 'gi',
          label: 'Address',
          risk: 'medium',
          message: 'Address detected'
        },
        health: {
          regex: '(diagnosis|disease|medication|therapy|doctor|hospital|surgery|symptom)',
          flags: 'gi',
          label: 'Health Data',
          risk: 'high',
          message: 'Health-related information detected'
        },
        password: {
          regex: '(password|PIN|access code|passcode)\\s*[:=]?\\s*\\S+',
          flags: 'gi',
          label: 'Credentials',
          risk: 'critical',
          message: 'Possible credentials detected'
        }
      },
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    }
  };

  const selectedPatterns = patterns[lang] || patterns.de;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      ...selectedPatterns
    })
  };
};
