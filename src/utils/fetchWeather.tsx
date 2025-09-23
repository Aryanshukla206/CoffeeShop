// utils/fetchWeather.ts

export interface WeatherRequest {
  location?: string;
  date?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherResponse {
  location: string;
  date: string;
  temperature: number | null;
  windspeed: number | null;
  weatherCode: number | null;
  description: string;
}

export async function fetchWeather({
  location,
  date,
  latitude,
  longitude,
}: WeatherRequest): Promise<WeatherResponse | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(response, "data from api")

    const weather: WeatherResponse = {
      location: location ?? "Your area",
      date: date ?? new Date().toISOString(),
      temperature: data.current_weather?.temperature ?? null,
      windspeed: data.current_weather?.windspeed ?? null,
      weatherCode: data.current_weather?.weathercode ?? null,
      description: mapWeatherCode(data.current_weather?.weathercode),
    };
    console.log(weather, "from utils weather")
    return weather;
  } catch (error) {
    console.error("fetchWeather error:", error);
    return null;
  }
}

// Map weather codes -> readable text
function mapWeatherCode(code?: number): string {
  const codes: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    61: "Slight rain",
    71: "Slight snow fall",
    80: "Rain showers",
  };
  return code !== undefined ? codes[code] ?? "Unknown" : "Unknown";
}
