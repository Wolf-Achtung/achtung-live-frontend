# Backend Briefing: Phase 5 - Predictive Privacy

## Übersicht

Phase 5 implementiert **Predictive Privacy** - KI-gestützte Vorhersage zukünftiger Privatsphäre-Risiken. Statt nur aktuelle Probleme zu erkennen, analysiert das System, was mit den Daten in Zukunft passieren KÖNNTE.

**Version:** 5.0.0
**Codename:** Crystal Ball
**Priorität:** Hoch (Unique Selling Point)

---

## Neue Features

### 5.1 Deanonymisierungs-Risiko-Score

Berechnet, wie leicht eine Person anhand der preisgegebenen Daten identifiziert werden könnte.

**Konzept: k-Anonymität**
- k=1: Eindeutig identifizierbar
- k=10: Eine von 10 Personen
- k=1000+: Praktisch anonym

**Datenpunkte und ihre Identifikationskraft:**

| Datenpunkt | Uniqueness Score | Beispiel |
|------------|------------------|----------|
| Vollständiger Name | 0.95 | "Max Müller" |
| Geburtsdatum | 0.60 | "15.03.1985" |
| PLZ | 0.40 | "80331" |
| Geschlecht | 0.10 | "männlich" |
| Beruf + Stadt | 0.75 | "Lehrer in Kleindorf" |
| Kombination 3+ Punkte | 0.99 | Name + Ort + Beruf |

**Algorithmus:**
```
deanon_risk = 1 - ∏(1 - uniqueness_score[i])

Beispiel:
- Name (0.95) + PLZ (0.40) + Alter (0.30)
- Risk = 1 - (0.05 × 0.60 × 0.70) = 1 - 0.021 = 0.979 (97.9%)
```

---

### 5.2 Breach Simulation

Simuliert Szenarien, in denen die analysierten Daten in einem Datenleck auftauchen.

**Szenarien:**

| Breach-Typ | Beschreibung | Impact-Faktoren |
|------------|--------------|-----------------|
| `social_media_leak` | Social Media Plattform gehackt | Posts, Verbindungen, Metadaten |
| `email_breach` | E-Mail Provider kompromittiert | Kontakte, Inhalte, Anhänge |
| `health_data_leak` | Gesundheitsdaten gestohlen | Diagnosen, Medikamente |
| `financial_breach` | Bank/Payment Leak | Kontodaten, Transaktionen |
| `employer_breach` | Arbeitgeber gehackt | HR-Daten, Gehalt, Performance |
| `government_leak` | Behördendaten | Ausweise, Steuerdaten |

**Output pro Szenario:**
- Betroffene Datentypen aus dem analysierten Text
- Mögliche Konsequenzen
- Schadenspotenzial (1-10)
- Empfohlene Maßnahmen

---

### 5.3 Future Risk Prediction

Analysiert, wie sich der Wert/das Risiko der Daten über Zeit verändert.

**Zeitliche Risiko-Faktoren:**

| Zeitraum | Risiko-Multiplikator | Grund |
|----------|---------------------|-------|
| Jetzt | 1.0x | Aktueller Zustand |
| 1 Jahr | 1.2x | Mehr Korrelationsdaten verfügbar |
| 5 Jahre | 1.8x | KI-Fortschritt, bessere Deanonymisierung |
| 10 Jahre | 2.5x | Quantencomputing-Risiko, Langzeitprofile |

**Kontext-spezifische Zukunftsrisiken:**

| Datentyp | Zukunftsrisiko | Beispiel |
|----------|----------------|----------|
| Politische Meinung | Job, Visa | "Ich unterstütze Partei X" |
| Gesundheitsdaten | Versicherung | "Habe Diabetes diagnostiziert" |
| Finanzielle Situation | Kreditscore | "Bin gerade knapp bei Kasse" |
| Beziehungsstatus | Soziale Folgen | "Trenne mich gerade" |
| Aufenthaltsort | Stalking-Risiko | "Bin jeden Dienstag im Yoga" |
| Jugendsünden | Karriere | "Mit 16 habe ich mal..." |

---

### 5.4 Correlation Attack Simulation

Zeigt, wie scheinbar harmlose Daten kombiniert werden können.

**Beispiel-Korrelationen:**

```
Input: "Arbeite als einziger IT-Admin bei einer kleinen Firma in Hintertupfingen"

Korrelations-Analyse:
├── LinkedIn: IT-Admin Stellenanzeigen Hintertupfingen → 1 Treffer
├── Xing: IT-Professionals Hintertupfingen → 3 Profile
├── Firmendatenbank: Kleine Firmen Hintertupfingen → 5 Firmen
├── Kombination: IT-Admin + kleine Firma + Hintertupfingen
└── Ergebnis: Person mit 94% Wahrscheinlichkeit identifizierbar
```

**Datenquellen für Korrelation:**
- Öffentliche Register (Handelsregister, Grundbuch)
- Social Media (LinkedIn, Xing, Facebook)
- Bewertungsportale (Kununu, Glassdoor)
- Lokale Medien (Zeitungsarchive)
- Geodaten (Google Maps, OSM)

---

## API Spezifikation

### POST /api/v2/analyze/predictive

Erweiterte Analyse mit Zukunftsprognose.

**Request:**
```json
{
  "text": "Ich bin Max, 34, arbeite als Lehrer in Kleindorf...",
  "lang": "de",
  "options": {
    "deanonymization": true,
    "breachSimulation": true,
    "futureRisk": true,
    "correlationAttack": true,
    "timeHorizons": [1, 5, 10]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "standardAnalysis": {
      "riskScore": 72,
      "categories": [...]
    },
    "predictive": {
      "deanonymization": {
        "kAnonymity": 3,
        "identifiabilityScore": 0.87,
        "uniqueDataPoints": [
          {
            "type": "name",
            "value": "Max",
            "uniqueness": 0.15,
            "note": "Häufiger Vorname, geringes Risiko allein"
          },
          {
            "type": "age",
            "value": "34",
            "uniqueness": 0.02,
            "note": "Sehr häufiges Alter"
          },
          {
            "type": "profession_location",
            "value": "Lehrer in Kleindorf",
            "uniqueness": 0.92,
            "note": "Sehr spezifisch! Wahrscheinlich <5 Personen"
          }
        ],
        "combinedRisk": {
          "score": 0.87,
          "explanation": "Die Kombination aus Beruf und kleinem Ort macht Sie sehr identifizierbar",
          "dataPointsNeeded": 1,
          "recommendation": "Ort generalisieren: 'in einer Kleinstadt' statt 'in Kleindorf'"
        }
      },
      "breachSimulation": {
        "scenarios": [
          {
            "type": "social_media_leak",
            "probability": "medium",
            "affectedData": ["name", "location", "profession"],
            "potentialDamage": 6,
            "consequences": [
              "Identität kann mit Social-Media-Profil verknüpft werden",
              "Arbeitgeber könnte gefunden werden",
              "Lokale Reputation betroffen"
            ],
            "mitigation": [
              "Generische Ortsangabe verwenden",
              "Beruf nicht mit Ort kombinieren"
            ]
          },
          {
            "type": "employer_breach",
            "probability": "low",
            "affectedData": ["profession", "location"],
            "potentialDamage": 8,
            "consequences": [
              "Direkte Zuordnung zum Arbeitgeber möglich",
              "Interne Schulangelegenheiten könnten verknüpft werden"
            ],
            "mitigation": [
              "Keine eindeutigen Arbeitgeber-Hinweise teilen"
            ]
          }
        ],
        "overallBreachRisk": {
          "score": 0.65,
          "worstCase": "Vollständige Deanonymisierung bei Social-Media-Leak"
        }
      },
      "futureRisk": {
        "timeline": [
          {
            "years": 1,
            "riskMultiplier": 1.2,
            "projectedScore": 86,
            "newThreats": [
              "Mehr Posts könnten korreliert werden",
              "Reverse Image Search wird besser"
            ]
          },
          {
            "years": 5,
            "riskMultiplier": 1.8,
            "projectedScore": 130,
            "newThreats": [
              "KI kann Schreibstil eindeutig zuordnen",
              "Aggregierte Standortdaten präziser",
              "Berufliche Veränderungen nachverfolgbar"
            ]
          },
          {
            "years": 10,
            "riskMultiplier": 2.5,
            "projectedScore": 180,
            "newThreats": [
              "Quantencomputer könnten alte Verschlüsselung brechen",
              "Langzeit-Bewegungsprofile möglich",
              "Genetische Daten könnten Familie identifizieren"
            ]
          }
        ],
        "permanentRisks": [
          {
            "dataType": "profession_location",
            "risk": "Karriere",
            "description": "Diese Information bleibt dauerhaft mit Ihnen verknüpft",
            "scenario": "Bei Jobwechsel könnte alter Arbeitgeber recherchiert werden"
          }
        ]
      },
      "correlationAttack": {
        "possibleCorrelations": [
          {
            "method": "LinkedIn + Ort",
            "confidence": 0.85,
            "steps": [
              "Suche: Lehrer Kleindorf LinkedIn",
              "Filter: Alter ~34",
              "Ergebnis: 2-3 mögliche Profile"
            ],
            "difficulty": "easy"
          },
          {
            "method": "Schulwebsite + Name",
            "confidence": 0.95,
            "steps": [
              "Suche: Schulen in Kleindorf",
              "Lehrerverzeichnis durchsuchen",
              "Name 'Max' abgleichen"
            ],
            "difficulty": "trivial"
          }
        ],
        "attackSurface": {
          "score": 0.78,
          "weakestLink": "Kombination Beruf + Ort",
          "recommendation": "Mindestens einen Datenpunkt entfernen oder generalisieren"
        }
      }
    },
    "summary": {
      "currentRisk": "high",
      "futureRisk": "critical",
      "mainVulnerability": "Geografische Eingrenzung durch Kleinstadtnennung",
      "quickFix": "Ersetze 'Kleindorf' durch 'einer Kleinstadt in Bayern'",
      "privacyLifespan": "Diese Daten bleiben ~15-20 Jahre auffindbar"
    }
  },
  "meta": {
    "processingTime": 450,
    "modelsUsed": ["pattern-v2", "correlation-v1", "timeline-v1"],
    "version": "5.0.0"
  }
}
```

---

### GET /api/v2/breach-scenarios

Liefert verfügbare Breach-Szenarien für UI.

**Response:**
```json
{
  "scenarios": [
    {
      "id": "social_media_leak",
      "name": {
        "de": "Social Media Datenleck",
        "en": "Social Media Data Breach"
      },
      "icon": "📱",
      "description": {
        "de": "Simulation: Eine Social-Media-Plattform wird gehackt",
        "en": "Simulation: A social media platform gets hacked"
      },
      "commonDataTypes": ["posts", "connections", "messages", "photos"],
      "realWorldExamples": ["Facebook 2019 (533M)", "LinkedIn 2021 (700M)"]
    },
    {
      "id": "email_breach",
      "name": {
        "de": "E-Mail Provider Hack",
        "en": "Email Provider Breach"
      },
      "icon": "📧",
      "description": {
        "de": "Simulation: Ihr E-Mail-Anbieter wird kompromittiert",
        "en": "Simulation: Your email provider gets compromised"
      },
      "commonDataTypes": ["emails", "contacts", "attachments"],
      "realWorldExamples": ["Yahoo 2013 (3B)", "Collection #1 2019 (773M)"]
    },
    {
      "id": "health_data_leak",
      "name": {
        "de": "Gesundheitsdaten-Leak",
        "en": "Health Data Breach"
      },
      "icon": "🏥",
      "description": {
        "de": "Simulation: Gesundheitsdienstleister wird gehackt",
        "en": "Simulation: Healthcare provider gets breached"
      },
      "commonDataTypes": ["diagnoses", "medications", "appointments"],
      "realWorldExamples": ["Anthem 2015 (78M)", "Medibank 2022 (9.7M)"]
    },
    {
      "id": "financial_breach",
      "name": {
        "de": "Finanzdaten-Leak",
        "en": "Financial Data Breach"
      },
      "icon": "🏦",
      "description": {
        "de": "Simulation: Bank oder Payment-Provider gehackt",
        "en": "Simulation: Bank or payment provider breached"
      },
      "commonDataTypes": ["accounts", "transactions", "credit_cards"],
      "realWorldExamples": ["Equifax 2017 (147M)", "Capital One 2019 (100M)"]
    },
    {
      "id": "employer_breach",
      "name": {
        "de": "Arbeitgeber-Datenleck",
        "en": "Employer Data Breach"
      },
      "icon": "🏢",
      "description": {
        "de": "Simulation: HR-System Ihres Arbeitgebers gehackt",
        "en": "Simulation: Your employer's HR system breached"
      },
      "commonDataTypes": ["salary", "performance", "personal_data"],
      "realWorldExamples": ["Sony 2014 (47K)", "Uber 2016 (57M)"]
    },
    {
      "id": "government_leak",
      "name": {
        "de": "Behörden-Datenleck",
        "en": "Government Data Leak"
      },
      "icon": "🏛️",
      "description": {
        "de": "Simulation: Behördliche Datenbank kompromittiert",
        "en": "Simulation: Government database compromised"
      },
      "commonDataTypes": ["id_documents", "tax_data", "records"],
      "realWorldExamples": ["OPM 2015 (21.5M)", "Bulgaria NRA 2019 (5M)"]
    }
  ]
}
```

---

### GET /api/v2/risk-factors

Liefert Risikofaktoren für verschiedene Datentypen.

**Response:**
```json
{
  "factors": {
    "personal_identifiers": {
      "full_name": {
        "uniqueness": 0.95,
        "futureRiskMultiplier": 1.0,
        "category": "direct_identifier"
      },
      "birth_date": {
        "uniqueness": 0.60,
        "futureRiskMultiplier": 1.0,
        "category": "quasi_identifier"
      },
      "email": {
        "uniqueness": 0.99,
        "futureRiskMultiplier": 1.5,
        "category": "direct_identifier"
      }
    },
    "location_data": {
      "exact_address": {
        "uniqueness": 0.98,
        "futureRiskMultiplier": 1.2,
        "category": "sensitive"
      },
      "city_large": {
        "uniqueness": 0.20,
        "futureRiskMultiplier": 1.1,
        "category": "quasi_identifier"
      },
      "city_small": {
        "uniqueness": 0.70,
        "futureRiskMultiplier": 1.3,
        "category": "quasi_identifier"
      },
      "workplace_location": {
        "uniqueness": 0.85,
        "futureRiskMultiplier": 1.4,
        "category": "sensitive"
      }
    },
    "professional_data": {
      "job_title": {
        "uniqueness": 0.30,
        "futureRiskMultiplier": 1.2,
        "category": "quasi_identifier"
      },
      "job_title_specific": {
        "uniqueness": 0.75,
        "futureRiskMultiplier": 1.3,
        "category": "sensitive"
      },
      "employer_name": {
        "uniqueness": 0.90,
        "futureRiskMultiplier": 1.5,
        "category": "sensitive"
      }
    },
    "temporal_data": {
      "age": {
        "uniqueness": 0.02,
        "futureRiskMultiplier": 1.0,
        "category": "quasi_identifier"
      },
      "birth_year": {
        "uniqueness": 0.05,
        "futureRiskMultiplier": 1.0,
        "category": "quasi_identifier"
      },
      "routine_schedule": {
        "uniqueness": 0.60,
        "futureRiskMultiplier": 2.0,
        "category": "behavioral"
      }
    },
    "opinion_data": {
      "political_view": {
        "uniqueness": 0.20,
        "futureRiskMultiplier": 3.0,
        "category": "sensitive_special"
      },
      "religious_belief": {
        "uniqueness": 0.25,
        "futureRiskMultiplier": 2.5,
        "category": "sensitive_special"
      },
      "health_condition": {
        "uniqueness": 0.40,
        "futureRiskMultiplier": 2.8,
        "category": "sensitive_special"
      }
    }
  },
  "combinationRules": {
    "name_plus_location": {
      "formula": "multiply",
      "bonus": 0.15,
      "note": "Name + Ort ist besonders identifizierend"
    },
    "profession_plus_location": {
      "formula": "multiply",
      "bonus": 0.20,
      "note": "Beruf + Ort in kleinen Städten sehr eindeutig"
    },
    "three_quasi_identifiers": {
      "formula": "compound",
      "threshold": 0.85,
      "note": "3+ quasi-identifiers = meist eindeutig"
    }
  }
}
```

---

## Datenbank-Schema (Optional)

Falls Caching gewünscht:

```sql
-- Breach-Szenarien
CREATE TABLE breach_scenarios (
  id VARCHAR(50) PRIMARY KEY,
  name_de VARCHAR(200),
  name_en VARCHAR(200),
  icon VARCHAR(10),
  description_de TEXT,
  description_en TEXT,
  severity INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Risk Factors
CREATE TABLE risk_factors (
  id SERIAL PRIMARY KEY,
  data_type VARCHAR(100),
  uniqueness DECIMAL(3,2),
  future_risk_multiplier DECIMAL(3,1),
  category VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Korrelations-Methoden
CREATE TABLE correlation_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  data_sources TEXT[],
  difficulty VARCHAR(20),
  average_confidence DECIMAL(3,2)
);
```

---

## Implementierungshinweise

### Deanonymisierungs-Algorithmus

```python
def calculate_deanonymization_risk(data_points):
    """
    Berechnet k-Anonymität basierend auf gefundenen Datenpunkten
    """
    # Basis-Uniqueness aus einzelnen Punkten
    individual_risks = [get_uniqueness(dp) for dp in data_points]

    # Kombinationseffekte
    combined_risk = 1.0
    for risk in individual_risks:
        combined_risk *= (1 - risk)

    # Bonus für bestimmte Kombinationen
    if has_name_and_location(data_points):
        combined_risk *= 0.85  # +15% Risiko

    if len(data_points) >= 3:
        combined_risk *= 0.80  # +20% für 3+ Datenpunkte

    final_risk = 1 - combined_risk

    # k-Anonymität schätzen
    k_anonymity = estimate_k(final_risk)

    return {
        "identifiabilityScore": final_risk,
        "kAnonymity": k_anonymity,
        "dataPointsNeeded": max(0, 3 - len(data_points))
    }

def estimate_k(risk_score):
    """Schätzt k-Anonymität aus Risk Score"""
    if risk_score > 0.95: return 1
    if risk_score > 0.90: return 2
    if risk_score > 0.80: return 5
    if risk_score > 0.60: return 20
    if risk_score > 0.40: return 100
    return 1000
```

### Future Risk Timeline

```python
def calculate_future_risk(current_risk, data_types, years):
    """
    Projiziert Risiko in die Zukunft
    """
    base_multipliers = {
        1: 1.2,
        5: 1.8,
        10: 2.5,
        20: 4.0
    }

    # Datentyp-spezifische Anpassungen
    type_multipliers = {
        "political_view": 1.5,  # Politische Daten werden risikoreicher
        "health_data": 1.3,
        "location_routine": 1.4,
        "opinion": 1.6
    }

    multiplier = base_multipliers.get(years, 1.0)

    # Addiere datentyp-spezifische Risiken
    for dt in data_types:
        if dt in type_multipliers:
            multiplier *= type_multipliers[dt]

    return min(current_risk * multiplier, 200)  # Cap bei 200
```

---

## Frontend-Integration

Das Frontend wird folgende Komponenten benötigen:

1. **Deanonymisierungs-Gauge** - Kreisdiagramm mit k-Anonymität
2. **Breach Scenario Cards** - Klickbare Karten für jedes Szenario
3. **Future Risk Timeline** - Interaktive Zeitleiste (1/5/10 Jahre)
4. **Correlation Graph** - Visualisierung der Angriffsvektoren
5. **Privacy Lifespan Indicator** - Wie lange bleiben Daten relevant

---

## Erwartete Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/v2/analyze/predictive` | POST | Hauptanalyse mit Predictive Features |
| `/api/v2/breach-scenarios` | GET | Liste der Breach-Szenarien |
| `/api/v2/risk-factors` | GET | Risikofaktoren für Datentypen |
| `/api/v2/correlation-methods` | GET | Verfügbare Korrelationsmethoden |

---

## Beispiel-Testfälle

```bash
# Predictive Analysis
curl -X POST https://api.achtung.live/api/v2/analyze/predictive \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Ich bin Max, 34, arbeite als Lehrer in Kleindorf und gehe jeden Dienstag zum Yoga.",
    "lang": "de",
    "options": {
      "deanonymization": true,
      "breachSimulation": true,
      "futureRisk": true,
      "correlationAttack": true
    }
  }'

# Breach Scenarios
curl https://api.achtung.live/api/v2/breach-scenarios

# Risk Factors
curl https://api.achtung.live/api/v2/risk-factors
```

---

## Zusammenfassung

Phase 5 macht achtung.live einzigartig durch:

1. **Predictive statt Reactive** - Zeigt zukünftige Risiken
2. **Quantifizierbar** - k-Anonymität als messbarer Wert
3. **Actionable** - Konkrete Empfehlungen zur Risikoreduktion
4. **Educational** - Nutzer lernen, wie Deanonymisierung funktioniert

**Technische Anforderungen:**
- Keine externen APIs nötig (regelbasiert)
- Erweiterbar durch ML später
- Response Time: <500ms für Standard-Analyse
- Optional: Caching für Risk Factors
