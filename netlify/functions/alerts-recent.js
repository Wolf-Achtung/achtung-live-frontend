// Netlify Function: Phase 9 - Data Breach Alerts - Recent Breaches
const API_BASE = "https://achtung-live-backend-production.up.railway.app";

// Fallback data for recent breaches
const RECENT_BREACHES_FALLBACK = [
  {
    id: "breach_2024_001",
    name: "SocialMediaApp",
    date: "2024-01-15",
    severity: "high",
    affectedUsers: 2500000,
    dataTypes: ["email", "password_hash", "username"],
    icon: "📱",
    category: "social",
    description: "Datenbankzugriff durch unsichere API"
  },
  {
    id: "breach_2024_002",
    name: "OnlineShop24",
    date: "2024-01-10",
    severity: "critical",
    affectedUsers: 800000,
    dataTypes: ["email", "credit_card", "address", "phone"],
    icon: "🛒",
    category: "retail",
    description: "Kreditkartendaten durch Malware gestohlen"
  },
  {
    id: "breach_2024_003",
    name: "FitnessTracker",
    date: "2024-01-08",
    severity: "medium",
    affectedUsers: 350000,
    dataTypes: ["email", "name", "dob", "health_data"],
    icon: "🏃",
    category: "health",
    description: "Ungeschützte Cloud-Speicherung"
  },
  {
    id: "breach_2024_004",
    name: "GamePlatformX",
    date: "2024-01-05",
    severity: "high",
    affectedUsers: 5000000,
    dataTypes: ["email", "username", "password_hash", "ip_address"],
    icon: "🎮",
    category: "gaming",
    description: "SQL-Injection Angriff"
  },
  {
    id: "breach_2023_005",
    name: "TravelBooking",
    date: "2023-12-28",
    severity: "high",
    affectedUsers: 1200000,
    dataTypes: ["email", "name", "passport", "credit_card"],
    icon: "✈️",
    category: "travel",
    description: "Insider-Datenleck"
  }
];

const SEVERITY_LEVELS = {
  critical: { label: "Kritisch", color: "#d32f2f", icon: "🚨" },
  high: { label: "Hoch", color: "#f57c00", icon: "⚠️" },
  medium: { label: "Mittel", color: "#fbc02d", icon: "⚡" },
  low: { label: "Niedrig", color: "#388e3c", icon: "ℹ️" }
};

const DATA_TYPES = {
  email: { label: "E-Mail", icon: "📧" },
  password: { label: "Passwort", icon: "🔑" },
  password_hash: { label: "Passwort-Hash", icon: "🔐" },
  credit_card: { label: "Kreditkarte", icon: "💳" },
  phone: { label: "Telefon", icon: "📱" },
  address: { label: "Adresse", icon: "🏠" },
  name: { label: "Name", icon: "👤" },
  dob: { label: "Geburtsdatum", icon: "🎂" },
  username: { label: "Benutzername", icon: "🏷️" },
  ip_address: { label: "IP-Adresse", icon: "🌐" },
  passport: { label: "Reisepass", icon: "🛂" },
  health_data: { label: "Gesundheitsdaten", icon: "🏥" }
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    // Try backend first
    try {
      const response = await fetch(`${API_BASE}/api/v2/alerts/recent-breaches`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        return { statusCode: 200, headers, body: JSON.stringify(data) };
      }
    } catch (apiError) {
      console.log("Backend unavailable, using fallback");
    }

    // Enrich fallback data with severity and data type info
    const enrichedBreaches = RECENT_BREACHES_FALLBACK.map(breach => ({
      ...breach,
      severityInfo: SEVERITY_LEVELS[breach.severity],
      dataTypesInfo: breach.dataTypes.map(dt => DATA_TYPES[dt] || { label: dt, icon: "📄" })
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        breaches: enrichedBreaches,
        lastUpdated: new Date().toISOString(),
        totalBreachesThisMonth: 12,
        totalAffectedUsers: "9.8M"
      })
    };

  } catch (error) {
    console.error("Recent breaches error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Fehler beim Laden der Datenlecks" })
    };
  }
};
