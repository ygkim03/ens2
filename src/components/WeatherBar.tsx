import { useEffect, useState } from "react";
import { Thermometer, Wind, Droplets } from "lucide-react";

const WEATHER_API_URL = "https://round-thunder-8301.rladudrnr03.workers.dev/";

interface CurrentWeather {
  temp: string;
  chill: string;
  minmax: string;
  humidity: string;
  wind: string;
  rain: string;
  updated: string;
  diff: string;
}

interface DailyForecast {
  label: string; // 오늘/내일
  dayLabel: string; // 16일(화)
  amWeather: string;
  pmWeather: string;
  min: string;
  max: string;
  amPop: string;
  pmPop: string;
}

const parseCurrent = (html: string): CurrentWeather | null => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const tmp = doc.querySelector(".cmp-cur-weather .tmp");
    const tempText = tmp?.childNodes[0]?.textContent?.trim() || "";
    const minmax = doc.querySelector(".cmp-cur-weather .minmax")?.textContent?.replace(/\s+/g, "") || "";
    const chill = doc.querySelector(".cmp-cur-weather .chill")?.textContent?.trim() || "";
    const wrap2 = doc.querySelectorAll(".cmp-cur-weather .wrap-2 li");
    const humidity = wrap2[0]?.querySelector(".val")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const wind = wrap2[1]?.querySelector(".val")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const updated = doc.querySelector(".odam-updated .updated-at")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const diff = doc.querySelector(".cmp-cur-weather .w-txt")?.textContent?.replace(/\s+/g, " ").trim() || "";

    return {
      temp: tempText,
      chill,
      minmax,
      humidity,
      wind,
      rain: "",
      updated,
      diff,
    };
  } catch (e) {
    console.error("parseCurrent failed", e);
    return null;
  }
};

const parseForecast = (html: string): DailyForecast[] => {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const slides = doc.querySelectorAll(".dfs-daily-slide");
    const out: DailyForecast[] = [];
    slides.forEach((s) => {
      const h4 = s.querySelector("h4.todaytomorrow");
      const spans = h4?.querySelectorAll("span");
      const em = h4?.querySelector("em")?.textContent?.trim() || "";
      const dayLabel = `${spans?.[0]?.textContent?.trim() || ""}${spans?.[1]?.textContent?.trim() || ""}`;
      const amWeather = s.querySelector(".daily-weather-am span.wic")?.textContent?.trim() || "";
      const pmWeather = s.querySelector(".daily-weather-pm span.wic")?.textContent?.trim() || "";
      const minmaxDivs = s.querySelectorAll(".daily-minmax span");
      const min = minmaxDivs[0]?.textContent?.trim() || "";
      const max = minmaxDivs[1]?.textContent?.trim() || "";
      const amPop = s.querySelector(".daily-pop-am span")?.textContent?.trim() || "-";
      const pmPop = s.querySelector(".daily-pop-pm span")?.textContent?.trim() || "-";
      if (em === "오늘") {
        out.push({ label: em, dayLabel, amWeather, pmWeather, min, max, amPop, pmPop });
      }
    });
    return out;
  } catch (e) {
    console.error("parseForecast failed", e);
    return [];
  }
};

export const WeatherBar = () => {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(WEATHER_API_URL);
        const json = await res.json();
        setCurrent(parseCurrent(json.current));
        setForecast(parseForecast(json.forecast));
      } catch (e) {
        console.error("weather fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="mb-2 h-6 rounded-md bg-blue-50 border border-blue-100 px-2 flex items-center text-[10px] text-muted-foreground">
        기상정보 불러오는 중...
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mb-2 h-6 rounded-md bg-red-50 border border-red-100 px-2 flex items-center text-[10px] text-red-600">
        기상정보를 불러올 수 없습니다
      </div>
    );
  }

  const items: React.ReactNode[] = [];
  if (current.humidity) {
    items.push(
      <span key="hum" className="inline-flex items-center gap-0.5">
        <Droplets className="h-2.5 w-2.5 text-blue-500" />
        {current.humidity}
      </span>
    );
  }
  if (current.wind) {
    items.push(
      <span key="wind" className="inline-flex items-center gap-0.5">
        <Wind className="h-2.5 w-2.5 text-sky-500" />
        {current.wind}
      </span>
    );
  }
  forecast.forEach((f) => {
    items.push(
      <span key={f.label} className="inline-flex items-center gap-1">
        <strong className="text-blue-700">오늘</strong>
        <span>오전 {f.amWeather}({f.amPop})</span>
        <span>오후 {f.pmWeather}({f.pmPop})</span>
        <span className="text-muted-foreground">{f.min}/{f.max}</span>
      </span>
    );
  });
  if (current.diff) {
    items.push(<span key="diff" className="text-muted-foreground">{current.diff}</span>);
  }

  const sep = (i: number) => (
    <span key={`s${i}`} className="text-blue-300 px-0.5">|</span>
  );

  const interleaved: React.ReactNode[] = [];
  items.forEach((it, i) => {
    interleaved.push(it);
    if (i < items.length - 1) interleaved.push(sep(i));
  });

  const chillText = current.chill ? current.chill.replace(/체감\(|\)|℃/g, "") : "";

  return (
    <div className="mb-2 rounded-md bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 overflow-hidden">
      <style>{`
        .weather-marquee {
          animation: marquee 40s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="relative h-6 flex items-center text-[10px]">
        {/* 왼쪽 고정: 기온/체감 */}
        <div className="flex-shrink-0 flex items-center gap-1 px-1.5 border-r border-blue-200 bg-blue-100/40 h-full">
          <Thermometer className="h-2.5 w-2.5 text-red-500 flex-shrink-0" />
          <strong className="text-foreground whitespace-nowrap">{current.temp}℃</strong>
          {chillText && (
            <span className="whitespace-nowrap">
              <span className="text-[9px] text-blue-500">체감</span>
              <span className="text-blue-700 font-semibold">{chillText}℃</span>
            </span>
          )}
        </div>
        {/* 오른쪽 마퀴 */}
        <div className="flex-1 overflow-hidden">
          <div className="weather-marquee w-max flex items-center">
            <div className="flex items-center gap-2 px-1.5">
              {interleaved}
              <span className="text-blue-300 px-0.5">|</span>
            </div>
            <div className="flex items-center gap-2 px-1.5">
              {interleaved}
              <span className="text-blue-300 px-0.5">|</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
