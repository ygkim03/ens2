import { ShipTable } from "@/components/ShipTable";
import { Ship, Waves, RefreshCw, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { ShipSchedule, WorkerData } from "@/types/ship";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const API_URL = "https://yellow-truth-54a3.rladudrnr03.workers.dev/";
const WORKER_API_URL = "https://script.google.com/macros/s/AKfycbx5DMnZQDDeqHFA5vRvKC-XvmXbN7mxBsx5O2S_uET9RikN0CM_tIumFg3Ht5PBbHwgpQ/exec";

const TERMINAL_BUTTONS = [
  { name: "PNIT", url: "https://www.pnitl.com/infoservice/vessel/vslScheduleChart.jsp" },
  { name: "PNC", url: "https://svc.pncport.com/info/CMS/Ship/ShipBerthCNew.pnc?mCode=MN105" },
  { name: "HJNC", url: "https://www.hjnc.co.kr/esvc/vessel/berthScheduleG" },
  { name: "HPNT", url: "https://www.hpnt.co.kr/infoservice/vessel/vslScheduleChart.jsp" },
  { name: "BNCT", url: "https://info.bnctkorea.com/esvc/vessel/berthScheduleG" },
  { name: "BCT", url: "https://info.bct2-4.com/infoservice/index.html" },
  { name: "DGT", url: "https://info.dgtbusan.com/DGT/esvc/vessel/berthScheduleG" },
  { name: "신항AIS", url: "https://www.marinetraffic.com/en/ais/home/centerx:128.788/centery:35.056/zoom:13" },
];

const Index = () => {
  const [shipData, setShipData] = useState<ShipSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workerData, setWorkerData] = useState<WorkerData | null>(null);

  const fetchWorkerData = async () => {
    try {
      const response = await fetch(WORKER_API_URL);
      if (!response.ok) throw new Error('Failed to fetch worker data');
      const data = await response.json();
      setWorkerData(data);
    } catch (error) {
      console.error("Failed to fetch worker data:", error);
    }
  };

  const fetchShipData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // API 데이터를 ShipSchedule 형식으로 변환
      const transformedData: ShipSchedule[] = data.map((item: any, index: number) => ({
        id: `${item.date}-${item.no}`,
        no: parseInt(item.no) || index + 1,
        date: item.date,
        time: item.time,
        shipName: item.name,
        grt: item.grt.split('/')[0].trim(),
        loa: item.grt.split('/')[1]?.trim() || '',
        dt: item.dt,
        from: item.fm,
        to: item.to,
        side: item.side,
        callSign: item.cs.split('(')[0].trim(),
        imo: item.cs.match(/\((\d+)\)/)?.[1] || '',
        tugs: item.tugs,
        quarantine: item.quarantine !== "",
        line: item.line,
        navigation: item.nav === "입항" ? "입항" : item.nav === "출항" ? "출항" : "이동",
        agent: item.agent,
        remarks: item.rmkTeam || item.rmkAgent || '',
        rmkTeam: item.rmkTeam || '',
        rmkAgent: item.rmkAgent || '',
        isSpecial: (item.rmkTeam && item.rmkTeam.includes('@')) || false,
        pt: item.pt,
        rmk: item.rmk
      }));
      
      setShipData(transformedData);
    } catch (error) {
      console.error("Failed to fetch ship data:", error);
      alert("데이터를 불러오는데 실패했습니다. Worker API에 CORS 헤더를 추가해주세요.\n\nWorker 코드에 다음을 추가하세요:\n\nconst headers = {\n  'Access-Control-Allow-Origin': '*',\n  'Access-Control-Allow-Methods': 'GET, OPTIONS',\n  'Access-Control-Allow-Headers': 'Content-Type',\n  'Content-Type': 'application/json'\n};\n\nreturn new Response(JSON.stringify(data), { headers });");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipData();
    fetchWorkerData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
<header className="sticky top-0 z-10 backdrop-blur-lg bg-background/80 border-b shadow-sm">
  <div className="container mx-auto px-4 py-5">
    <div className="flex items-start gap-3">
      {/* 아이콘 + 타이틀 */}
      <div className="relative">
        <Ship className="h-8 w-8 text-primary" />
        <Waves className="h-4 w-4 text-accent absolute -bottom-1 -right-1" />
      </div>
      <div className="flex-1">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          이엔에스마린 도선 모니터링
        </h1>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-base text-muted-foreground">부산신항 실시간 스케줄</p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(TERMINAL_BUTTONS[7].url, "_blank")}
              className="h-6 w-auto px-2 py-2 text-xs bg-red-500 text-white hover:bg-red-600 border-red-500 rounded-lg"
            >
              신항AIS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchShipData}
              className="gap-2 h-6 w-auto px-2 py-2 text-xs rounded-lg"
            >
              <RefreshCw className="h-3 w-3" />
              새로고침
            </Button>
          </div>
        </div>

      </div>
              {workerData && (
          <Collapsible className="mt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-foreground">{workerData.date} ({workerData.weekday})</span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 px-2 py-0 text-xs text-muted-foreground hover:text-foreground">
                  오늘 근무자명단
                  <ChevronDown className="h-3 w-3 ml-1 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-1 text-xs text-muted-foreground space-y-0.5">
              <p>
                <span className="font-semibold text-primary">ENS</span> ({workerData.ensCount}명) : {workerData.ensWorkers.map(w => w.name).join(', ')}
              </p>
              <p>
                <span className="font-semibold text-accent">웨스턴</span> ({workerData.westCount}명) : {workerData.westWorkers.map(w => w.name).join(', ')}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
    </div>
  </div>
</header>


      {/* Main Content */}
      <main className="container mx-auto px-4 py-3 max-w-6xl min-h-[calc(100vh-280px)]">
        {/* Terminal Buttons */}
        <div className="mb-2">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-1 min-w-max pb-1">
              {TERMINAL_BUTTONS.slice(0, 7).map((terminal) => (
                <Button
                  key={terminal.name}
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(terminal.url, '_blank')}
                  className="h-6 text-[12px] whitespace-nowrap min-w-[45px] px-2 py-1 rounded-md"
                >
                  {terminal.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : (
          <ShipTable data={shipData} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>이엔에스마린 부산신항 도선 모니터링</p>
          <p className="text-xs mt-1">실시간 업데이트</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
