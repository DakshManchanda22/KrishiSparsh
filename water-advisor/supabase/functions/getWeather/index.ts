const OPENWEATHER_KEY = Deno.env.get("OPENWEATHER_API_KEY") ?? "PASTE_OPENWEATHER_KEY_HERE";

const BASE_WATER: Record<string, number> = {
  rice: 5000,
  wheat: 2500,
  tomato: 3000,
  sugarcane: 4500,
};

interface ForecastItem {
  main: { temp: number; humidity: number };
  pop?: number;
  rain?: { "3h"?: number };
  dt_txt: string;
}

interface OpenWeatherForecast {
  list: ForecastItem[];
}

function getBaseWater(crop: string): number {
  return BASE_WATER[crop] ?? 3000;
}

function applyModifiers(
  base: number,
  temp: number,
  rainProb: number,
  humidity: number
): number {
  let water = base;
  if (temp > 35) water *= 1.2;
  if (rainProb > 0.6) water *= 0.5;
  else if (humidity > 80) water *= 0.9;
  return Math.round(water);
}

function getTomorrowWater(
  base: number,
  temp: number,
  rainProb: number,
  humidity: number
): number {
  return applyModifiers(base, temp, rainProb, humidity);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    const { lat, lon, crop, stage } = (body || {}) as {
      lat?: number;
      lon?: number;
      crop?: string;
      stage?: string;
    };

    if (lat == null || lon == null || !crop || !stage) {
      return jsonResponse(
        { error: "Missing lat, lon, crop, or stage" },
        400
      );
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      return jsonResponse(
        { error: `OpenWeather error: ${res.status}. Check OPENWEATHER_API_KEY in Supabase secrets.` },
        502
      );
    }

    const data = (await res.json()) as OpenWeatherForecast;
    const list = data?.list ?? [];
    const now = list[0];
    if (!now) {
      return jsonResponse({ error: "No forecast data" }, 502);
    }

    const currentTemp = now.main?.temp ?? 25;
    const currentHumidity = now.main?.humidity ?? 50;
    const currentPop = typeof now.pop === "number" ? now.pop : 0;

    const baseWater = getBaseWater(crop);
    const todayWater = applyModifiers(
      baseWater,
      currentTemp,
      currentPop,
      currentHumidity
    );

    const tomorrow = list.find((item) => {
      const d = new Date(item.dt_txt);
      const today = new Date();
      return d.getDate() !== today.getDate() && d.getHours() >= 6 && d.getHours() <= 18;
    }) ?? list[8] ?? now;

    const tomorrowTemp = tomorrow.main?.temp ?? currentTemp;
    const tomorrowHumidity = tomorrow.main?.humidity ?? currentHumidity;
    const tomorrowPop = typeof tomorrow.pop === "number" ? tomorrow.pop : 0;

    const tomorrowWater = getTomorrowWater(
      baseWater,
      tomorrowTemp,
      tomorrowPop,
      tomorrowHumidity
    );

    const weatherSummary = `Temp ${Math.round(currentTemp)}°C, humidity ${currentHumidity}%. Rain chance ${Math.round(currentPop * 100)}%.`;
    let warning: string | null = null;
    if (currentPop > 0.6) {
      warning = "Rain probability over 60%. Irrigation reduced. Consider skipping or delaying watering.";
    }

    return jsonResponse({
      todayWater,
      tomorrowWater,
      weatherSummary,
      warning,
    }, 200);
  } catch (e) {
    return jsonResponse(
      { error: String((e as Error)?.message ?? e) },
      500
    );
  }
});
