import { ShipTable } from "@/components/ShipTable";
import { Ship, Waves, RefreshCw, ChevronDown, MessageSquare, MessageCircleWarning, X, Users, Phone, Clock, Calendar, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ShipSchedule, WorkerData } from "@/types/ship";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";

const API_URLS = {
  all: "https://yellow-truth-54a3.rladudrnr03.workers.dev/",
  sinhang: "https://dark-resonance-e1c6.rladudrnr03.workers.dev/",
  bukhang: "https://falling-pond-0776.rladudrnr03.workers.dev/",
};

const firebaseConfig = {
  apiKey: "",
  authDomain: "western-6281b.firebaseapp.com",
  projectId: "western-6281b",
  storageBucket: "western-6281b.firebasestorage.app",
  messagingSenderId: "64799899840",
  appId: "1:64799899840:web:a977661dab0d4ede40ad25"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type AreaTab = "all" | "sinhang" | "bukhang";

// ✅ 직원 카드 데이터 타입
interface EmployeeCardData {
  name: string;
  phone: string;
  company: string;
  age: number | null;
  workYears: string | null;
}

const TERMINAL_BUTTONS = [
  { name: "PNIT", url: "https://www.pnitl.com/infoservice/vessel/vslScheduleChart.jsp" },
  { name: "PNC", url: "https://svc.pncport.com/info/CMS/Ship/ShipBerthCNew.pnc?mCode=MN105" },
  { name: "HJNC", url: "https://www.hjnc.co.kr/esvc/vessel/berthScheduleG" },
  { name: "HPNT", url: "https://www.hpnt.co.kr/infoservice/vessel/vslScheduleChart.jsp" },
  { name: "BNCT", url: "https://info.bnctkorea.com/esvc/vessel/berthScheduleG" },
  { name: "BCT", url: "https://info.bct2-4.com/infoservice/index.html" },
  { name: "DGT", url: "https://info.dgtbusan.com/DGT/esvc/vessel/berthScheduleG" },
  { name: "신항AIS", url: "https://www.marinetraffic.com/en/ais/home/centerx:128.807/centery:35.063/zoom:13" },
  { name: "북항AIS", url: "https://www.marinetraffic.com/en/ais/home/centerx:129.077/centery:35.112/zoom:13" },
];

// ✅ 만나이 계산 (주민등록번호)
const calcAge = (jumin: string): number | null => {
  if (!jumin || jumin.length < 8) return null;
  const genderDigit = jumin[7]; // YYMMDD-X 에서 7번째(0-indexed)
  const yy = parseInt(jumin.substring(0, 2));
  const mm = parseInt(jumin.substring(2, 4));
  const dd = parseInt(jumin.substring(4, 6));
  let fullYear: number;
  if (genderDigit === '1' || genderDigit === '2') fullYear = 1900 + yy;
  else if (genderDigit === '3' || genderDigit === '4') fullYear = 2000 + yy;
  else return null;

  const today = new Date();
  let age = today.getFullYear() - fullYear;
  const birthdayThisYear = new Date(today.getFullYear(), mm - 1, dd);
  if (today < birthdayThisYear) age--;
  return age;
};

// ✅ 근무기간 계산
const calcWorkYears = (startDate: string): string | null => {
  if (!startDate) return null;
  const start = new Date(startDate);
  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return `${Math.floor(diffYears)}.${Math.floor((diffYears % 1) * 10)}년`;
};

// ✅ 직원 카드 팝업 컴포넌트
const EmployeeCard = ({ employee, onClose }: { employee: EmployeeCardData; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 카드 헤더 — 진한 파랑 → 부드러운 slate/gray 계열 */}
        <div className="px-5 py-4 flex items-center justify-between bg-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-full p-2">
              <UserCircle className="h-8 w-8 text-white/80" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium tracking-wide">{employee.company}</p>
              <p className="text-white font-bold text-lg leading-tight">{employee.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 카드 바디 */}
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => window.location.href = `tel:${employee.phone}`}
              className="text-sm font-medium text-foreground hover:underline cursor-pointer"
            >
              {employee.phone}
            </button>
          </div>
          {employee.age !== null && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">만 <span className="font-semibold">{employee.age}세</span></span>
            </div>
          )}
          {employee.workYears && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">근무기간 <span className="font-semibold">{employee.workYears}</span></span>
            </div>
          )}
        </div>

        {/* 전화 버튼 — 빨강 제거, 차분한 스타일 */}
        <div className="px-5 pb-5">
          <button
            onClick={() => window.location.href = `tel:${employee.phone}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
          >
            <Phone className="h-4 w-4" />
            전화하기
          </button>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [shipData, setShipData] = useState<ShipSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workerData, setWorkerData] = useState<WorkerData | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaTab>("all");
  const [isBoardOpen, setIsBoardOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [hasNewPost, setHasNewPost] = useState(false);
  // ✅ 직원 카드 상태
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeCardData | null>(null);
  const [isCardLoading, setIsCardLoading] = useState(false);

  // ✅ 이름 클릭 시 Firestore에서 직원 조회
  const handleWorkerClick = async (name: string) => {
    setIsCardLoading(true);
    setSelectedEmployee(null);
    try {
      // employees 컬렉션에서 이름으로 조회
      // public.name 필드로 검색
      const q = query(
        collection(db, "employees"),
        where("public.name", "==", name),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const details = data.private?.details || {};
        const jumin = details["주민등록번호"] || "";
        const firstJoinDate = details["최초입사일"] || "";

        setSelectedEmployee({
          name: data.public?.name || name,
          phone: data.public?.phone || details["전화번호"] || "-",
          company: data.private?.company || "",
          age: calcAge(jumin),
          workYears: calcWorkYears(firstJoinDate),
        });
      } else {
        // Firestore에 없는 경우 이름만 표시
        setSelectedEmployee({
          name,
          phone: "-",
          company: "",
          age: null,
          workYears: null,
        });
      }
    } catch (error) {
      console.error("직원 정보 조회 실패:", error);
    } finally {
      setIsCardLoading(false);
    }
  };

  const checkNewPosts = async () => {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const q = query(collection(db, "posts"), where("timestamp", ">=", threeDaysAgo), limit(1));
      const querySnapshot = await getDocs(q);
      setHasNewPost(!querySnapshot.empty);
    } catch (error) {
      console.error("Failed to check new posts:", error);
    }
  };

  const fetchWorkerData = async () => {
    try {
      const docRef = doc(db, "workers", "today");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWorkerData(docSnap.data() as WorkerData);
      }
    } catch (error) {
      console.error("Firebase에서 근무자 데이터를 가져오는 중 오류 발생:", error);
    }
  };

  const fetchShipData = async (area: AreaTab = selectedArea) => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URLS[area], { mode: 'cors', headers: { 'Accept': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const transformedData: ShipSchedule[] = data.map((item: any, index: number) => ({
        id: `${item.date}-${item.no}`,
        no: parseInt(item.no) || index + 1,
        date: item.date,
        time: item.time?.match(/\d{2}:\d{2}/)?.[0] || '',
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleAreaChange = (value: string) => {
    if (value && (value === "all" || value === "sinhang" || value === "bukhang")) {
      setSelectedArea(value);
      fetchShipData(value);
    }
  };

  useEffect(() => {
    fetchShipData();
    fetchWorkerData();
    checkNewPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-lg bg-background/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Ship className="h-8 w-8 text-primary" />
              <Waves className="h-4 w-4 text-accent absolute -bottom-1 -right-1" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                이엔에스마린 도선 모니터링
              </h1>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-base text-muted-foreground">부산항 실시간 스케줄</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => window.open(TERMINAL_BUTTONS[7].url, "_blank")} className="h-5 w-auto px-1 py-2 text-[10.5px] bg-red-500 text-white hover:bg-red-600 border-red-500 rounded-lg">신항AIS</Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(TERMINAL_BUTTONS[8].url, "_blank")} className="h-5 w-auto px-1 py-2 text-[10.5px] bg-red-500 text-white hover:bg-red-600 border-red-500 rounded-lg">북항AIS</Button>
                  <Button variant="outline" size="sm" onClick={() => fetchShipData()} className="gap-1 h-5 w-auto px-1 py-2 text-[10.5px] rounded-lg"><RefreshCw className="h-0.5 w-0.5" />새로고침</Button>
                </div>
              </div>
            </div>
          </div>

          {workerData && (
            <Collapsible className="mt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-foreground">{workerData.date} ({workerData.weekday})</span>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-5 px-2 py-0 text-xs text-muted-foreground hover:text-foreground">
                    오늘 근무자 <ChevronDown className="h-3 w-3 ml-1 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
                <ToggleGroup type="single" value={selectedArea} onValueChange={handleAreaChange} className="ml-auto">
                  <ToggleGroupItem value="all" className="h-5 px-2 text-[10px] border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">부산 전체</ToggleGroupItem>
                  <ToggleGroupItem value="sinhang" className="h-5 px-2 text-[10px] border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">신항</ToggleGroupItem>
                  <ToggleGroupItem value="bukhang" className="h-5 px-2 text-[10px] border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">북항/감천</ToggleGroupItem>
                </ToggleGroup>
              </div>
              {/* ✅ 이름을 클릭 가능한 버튼으로 변경 */}
              <CollapsibleContent className="mt-1 text-xs text-muted-foreground space-y-0.5">
                <div className="flex text-xs text-muted-foreground">
                  <div className="shrink-0">
                    <span className="font-semibold text-primary">ENS</span>
                    ({workerData.ensCount}명)
                    {workerData.ensStatus === "교대 전" && (
                      <span className="text-yellow-600 ml-1">(교대 전)</span>
                    )}{" :"}
                  </div>
                  <div className="ml-2 flex-1 break-keep flex flex-wrap gap-x-1">
                    {workerData.ensWorkers.map((w, i) => (
                      <span key={w.name}>
                        <button
                          onClick={() => handleWorkerClick(w.name)}
                          className="hover:underline cursor-pointer"
                        >
                          {w.name}
                        </button>
                        {i < workerData.ensWorkers.length - 1 && <span className="text-muted-foreground">, </span>}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex text-xs text-muted-foreground">
                  <div className="shrink-0">
                    <span className="font-semibold text-accent">웨스턴</span>
                    ({workerData.westCount}명)
                    {workerData.westStatus === "교대 전" && (
                      <span className="text-yellow-600 ml-1">(교대 전)</span>
                    )}{" :"}
                  </div>
                  <div className="ml-2 flex-1 break-keep flex flex-wrap gap-x-1">
                    {workerData.westWorkers.map((w, i) => (
                      <span key={w.name}>
                        <button
                          onClick={() => handleWorkerClick(w.name)}
                          className="hover:underline cursor-pointer"
                        >
                          {w.name}
                        </button>
                        {i < workerData.westWorkers.length - 1 && <span className="text-muted-foreground">, </span>}
                      </span>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-3 max-w-6xl min-h-[calc(100vh-280px)]">
        <div className="mb-2">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-1 min-w-max pb-1">
              {TERMINAL_BUTTONS.slice(0, 7).map((terminal) => (
                <Button key={terminal.name} variant="outline" size="sm" onClick={() => window.open(terminal.url, '_blank')} className="h-6 text-[12px] whitespace-nowrap min-w-[45px] px-2 py-1 rounded-md">{terminal.name}</Button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setIsBoardOpen(true); setHasNewPost(false); }} className="h-6 text-[12px] whitespace-nowrap min-w-[45px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 border-blue-200 relative">
            <MessageSquare className="h-3 w-3" />
            익명 건의 게시판
            {hasNewPost && (
              <span className="absolute -top-1 -right-1 flex h-3 w-6 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-1 ring-white shadow-sm">NEW</span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('https://open.kakao.com/o/skj4Ejni', '_blank')} className="h-6 text-[12px] whitespace-nowrap min-w-[45px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 border-blue-200">
            <MessageCircleWarning className="h-3 w-3" />
            1:1 익명 카톡
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsContactsOpen(true)} className="h-6 text-[12px] whitespace-nowrap min-w-[45px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 border-blue-200">
            <Users className="h-3 w-3" />
            직원 연락처
          </Button>
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

      <footer className="mt-12 py-6 border-t bg-card/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>이엔에스마린 부산항 도선 모니터링</p>
          <p className="text-xs mt-1">실시간 업데이트</p>
        </div>
      </footer>

      {/* 익명 게시판 팝업 */}
      {isBoardOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="flex items-center gap-2 font-semibold text-sm"><MessageSquare className="h-4 w-4 text-blue-600" />익명 건의 게시판</span>
              <Button variant="ghost" size="sm" onClick={() => setIsBoardOpen(false)} className="h-8 px-2 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /> 닫기</Button>
            </div>
            <iframe src="https://western-6281b.web.app/?v=5" className="flex-1 w-full border-0" title="익명 게시판" />
          </div>
        </div>
      )}

      {/* 직원 연락처 팝업 */}
      {isContactsOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="flex items-center gap-2 font-semibold text-sm"><Users className="h-4 w-4 text-blue-600" />직원 연락처 명부</span>
              <Button variant="ghost" size="sm" onClick={() => setIsContactsOpen(false)} className="h-8 px-2 text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /> 닫기</Button>
            </div>
            <iframe src="https://western-6281b.web.app/contacts/" className="flex-1 w-full border-0" title="직원 연락처" />
          </div>
        </div>
      )}

      {/* ✅ 직원 카드 로딩 스피너 */}
      {isCardLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-background rounded-xl p-6 flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-sm text-muted-foreground">직원 정보 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* ✅ 직원 카드 팝업 */}
      {selectedEmployee && !isCardLoading && (
        <EmployeeCard employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}
    </div>
  );
};

export default Index;
