import { useEffect, useState } from "react";
import { Thermometer, Wind, Droplets, Cloud } from "lucide-react";

const WEATHER_API_URL = "https://round-thunder-8301.rladudrnr03.workers.dev/";

interface CurrentWeather {
  temp: string;
  chill: string;
  minmax: string;
  humidity: string;
  wind: string;
  rain: string;
  pm25: { val: string; level: string };
  pm10: { val: string; level: string };
  o3: { val: string; level: string };
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
    const rain = wrap2[2]?.querySelector(".val")?.textContent?.trim().replace(/\s+/g, " ") || "";
    const updated = doc.querySelector(".odam-updated .updated-at")?.textContent?.replace(/\s+/g, " ").trim() || "";
    const diff = doc.querySelector(".cmp-cur-weather .w-txt")?.textContent?.replace(/\s+/g, " ").trim() || "";

    const airItems = doc.querySelectorAll(".cmp-cur-weather-air .air-wrap li");
    const parseAir = (li: Element | undefined) => ({
      val: li?.querySelector(".air-lvv")?.textContent?.trim() || "-",
      level: li?.querySelector(".air-lvt")?.childNodes[0]?.textContent?.trim() || "",
    });
    return {
      temp: tempText,
      chill,
      minmax,
      humidity,
      wind,
      rain,
      updated,
      diff,
      pm25: parseAir(airItems[0]),
      pm10: parseAir(airItems[1]),
      o3: parseAir(airItems[2]),
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
      if (em === "오늘" || em === "내일") {
        out.push({ label: em, dayLabel, amWeather, pmWeather, min, max, amPop, pmPop });
      }
    });
    return out;
  } catch (e) {
    console.error("parseForecast failed", e);
    return [];
  }
};

const airColor = (level: string) => {
  if (level.includes("좋음")) return "text-blue-600";
  if (level.includes("보통")) return "text-green-600";
  if (level.includes("나쁨") && !level.includes("매우")) return "text-orange-600";
  if (level.includes("매우")) return "text-red-600";
  return "text-muted-foreground";
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
      <div className="mb-2 h-7 rounded-md bg-blue-50 border border-blue-100 px-2 flex items-center text-[11px] text-muted-foreground">
        기상정보 불러오는 중...
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mb-2 h-7 rounded-md bg-red-50 border border-red-100 px-2 flex items-center text-[11px] text-red-600">
        기상정보를 불러올 수 없습니다
      </div>
    );
  }

  const items: React.ReactNode[] = [];
  if (current.minmax) {
    items.push(<span key="minmax" className="text-muted-foreground">{current.minmax}</span>);
  }
  items.push(
    <span key="hum" className="inline-flex items-center gap-1">
      <Droplets className="h-3 w-3 text-blue-500" />습도 {current.humidity}
    </span>
  );
  items.push(
    <span key="wind" className="inline-flex items-center gap-1">
      <Wind className="h-3 w-3 text-sky-500" />바람 {current.wind}
    </span>
  );
  items.push(
    <span key="pm25" className="inline-flex items-center gap-1">
      <Cloud className="h-3 w-3 text-slate-500" />초미세 {current.pm25.val}
      <span className={airColor(current.pm25.level) + " font-semibold"}>{current.pm25.level}</span>
    </span>
  );
  items.push(
    <span key="pm10" className="inline-flex items-center gap-1">
      <Cloud className="h-3 w-3 text-slate-500" />미세 {current.pm10.val}
      <span className={airColor(current.pm10.level) + " font-semibold"}>{current.pm10.level}</span>
    </span>
  );
  forecast.forEach((f) => {
    items.push(
      <span key={f.label} className="inline-flex items-center gap-1">
        <strong className="text-blue-700">{f.label}</strong>
        <span className="text-muted-foreground">{f.dayLabel}</span>
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
    <span key={`s${i}`} className="text-blue-300 px-1">|</span>
  );

  const interleaved: React.ReactNode[] = [];
  items.forEach((it, i) => {
    interleaved.push(it);
    if (i < items.length - 1) interleaved.push(sep(i));
  });

  const chillText = current.chill ? current.chill.replace(/체감\(|\)/g, "") : "";

  return (
    <div className="mb-2 rounded-md bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 overflow-hidden">
      <style>{`
        .weather-marquee {
          animation: marquee 60s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="relative h-7 flex items-center">
        {/* 왼쪽 고정: 기온/체감 */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2 border-r border-blue-200 bg-blue-100/40 h-full text-[11px] ">
          <Thermometer className="h-3 w-3 text-red-500 flex-shrink-0" />
          <strong className="text-foreground whitespace-nowrap">{current.temp}℃</strong>
          {chillText && (
            <span className="text-muted-foreground whitespace-nowrap">체감 {chillText}℃</span>
          )}
        </div>
        {/* 오른쪽 마퀴 */}
<div className="flex-1 overflow-hidden">
  {/* 💡 핵심 1: w-max 추가로 글자 길이에 맞춰 컨테이너 너비 확장 */}
  <div className="weather-marquee w-max flex items-center text-[11px]">
    
    {/* 💡 핵심 2: 두 세트를 각각 동일한 div로 묶어 오차를 없앰 */}
    {/* 1번 세트 */}
    <div className="flex items-center gap-2 px-2">
      {interleaved}
      <span className="text-blue-300 px-1">|</span>
    </div>

    {/* 2번 세트 (1번 세트와 완벽히 동일한 구조) */}
    <div className="flex items-center gap-2 px-2">
      {interleaved}
      <span className="text-blue-300 px-1">|</span>
    </div>

  </div>
</div>
      </div>
    </div>
  );
};
