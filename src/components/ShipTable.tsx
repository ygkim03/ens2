import { useState, useMemo } from "react";
import { ShipSchedule } from "@/types/ship";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Ship,
  Anchor,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Building2,
  RefreshCw,
} from "lucide-react";

// 터미널 약어 → 풀네임 매핑
const TERMINAL_MAP: Record<string, string> = {
  "NT01": "PNIT 1번",
  "NT02": "PNIT 2번",
  "NT03": "PNIT 3번",
  "NT04": "PNC 4번",
  "NT05": "PNC 5번",
  "NT06": "PNC 6번",
  "NT07": "PNC 7번",
  "NT08": "PNC 8번",
  "NT09": "PNC 미확정",
  "NT10(HJ1)": "한진 1번",
  "NT11(HJ2)": "한진 2번",
  "NT12(HJ3)": "한진 3번",
  "NT13(HJ4)": "한진 4번",
  "WT01": "동원 1번",
  "WT02": "동원 2번",
  "WT03": "동원 3번",
  "MT-1": "다목적 북측",
  "ST01": "현대 1번",
  "ST02": "현대 2번",
  "ST03": "현대 3번",
  "ST04": "현대 4번",
  "ST05": "고려 1번",
  "ST06": "고려 2번",
  "ST07": "고려 3번",
  "ST08": "고려 4번",
  "ST09": "BCT 1번",
  "ST10": "BCT 2번",
  "ST11": "BCT 3번",
};

const getTerminalName = (code: string): string => {
  return TERMINAL_MAP[code] || code;
};

interface ShipTableProps {
  data: ShipSchedule[];
}

export const ShipTable = ({ data }: ShipTableProps) => {
  // 초기 필터를 이엔에스마린으로 설정 (없으면 전체)
  const [filterLine, setFilterLine] = useState<Set<string>>(() => {
    const ensMarineExists = data.some(ship => ship.line === "이엔에스마린");
    return ensMarineExists ? new Set(["이엔에스마린"]) : new Set();
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleLineFilter = (line: string) => {
    const newFilter = new Set(filterLine);
    if (newFilter.has(line)) {
      newFilter.delete(line);
    } else {
      newFilter.add(line);
    }
    setFilterLine(newFilter);
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // 데이터에서 고유한 라인 목록 추출 (이엔에스마린을 맨 앞으로)
  const uniqueLines = useMemo(() => {
    const lines = [...new Set(data.map((ship) => ship.line))];
    return lines.sort((a, b) => {
      if (a === "이엔에스마린") return -1;
      if (b === "이엔에스마린") return 1;
      return a.localeCompare(b);
    });
  }, [data]);

  const filteredData = data
    .filter((ship) => {
      const matchesLine = filterLine.size === 0 || filterLine.has(ship.line);
      return matchesLine;
    })
    .sort((a, b) => {
      // 날짜와 시간을 결합하여 Date 객체 생성
      const dateTimeA = new Date(`${a.date}T${a.time}`);
      const dateTimeB = new Date(`${b.date}T${b.time}`);
      const now = new Date();
      
      // 현재 시간과의 절대 차이 계산
      const diffA = Math.abs(dateTimeA.getTime() - now.getTime());
      const diffB = Math.abs(dateTimeB.getTime() - now.getTime());
      
      return diffA - diffB;
    });

  return (
    <div className="space-y-2">
      {/* 라인별 필터 */}
      <div className="flex items-center gap-1 flex-wrap">
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
          <Button
            variant={filterLine.size === 0 ? "default" : "outline"}
            onClick={() => setFilterLine(new Set())}
            size="sm"
            className="shrink-0 w-auto px-2 py-3 h-6 text-xs"
          >
            전체 라인
          </Button>
        </div>
        {uniqueLines.map((line) => (
          <Button
            key={line}
            variant={filterLine.has(line) ? "default" : "outline"}
            onClick={() => toggleLineFilter(line)}
            size="sm"
            className="shrink-0 w-auto px-2 py-3 whitespace-nowrap h-6 text-xs"
          >
            {line}
          </Button>
        ))}
      </div>

      {/* 선박 카드 리스트 */}
      <div className="space-y-1">
        {filteredData.map((ship, index) => {
          const isExpanded = expandedRows.has(ship.id);
          let bgColor = "";
          if (ship.navigation === "입항") {
            bgColor = "bg-[hsl(var(--arrival-card))] dark:bg-[hsl(var(--arrival-card-dark))]";
          } else if (ship.navigation === "출항") {
            bgColor = "bg-[hsl(var(--departure-card))] dark:bg-[hsl(var(--departure-card-dark))]";
          } else if (ship.navigation === "이동") {
            bgColor = "bg-[#C8F7C5] dark:bg-[#8BC985]";
          }
          
          // 표시할 터미널 정보
          let terminalInfo = "";
          if (ship.navigation === "입항") {
            terminalInfo = getTerminalName(ship.to);
          } else if (ship.navigation === "출항") {
            terminalInfo = getTerminalName(ship.from);
          } else if (ship.navigation === "이동") {
            terminalInfo = `${getTerminalName(ship.from)} → ${getTerminalName(ship.to)}`;
          }
          
          // 날짜 구분선 표시 여부 확인
          const showDateSeparator = index === 0 || filteredData[index - 1].date !== ship.date;
          
          return (
            <div key={ship.id}>
              {showDateSeparator && (
                <div className="mb-0.5 mt-1.5">
                  <div className="bg-blue-500 dark:bg-blue-600 h-5 flex items-center rounded-lg px-3 py-0">
                    <span className="text-xs font-bold text-white leading-tight">
                      {ship.date}
                    </span>
                  </div>
                </div>
              )}
              <Card
                className={`p-1.5 hover:shadow-md transition-all duration-200 cursor-pointer rounded-lg ${bgColor}`}
                onClick={() => toggleRow(ship.id)}
              >
              <div className="space-y-0.5">
                {/* 기본 정보 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* 시간 */}
                  <div className="flex items-center gap-0.5 text-primary font-semibold text-xs shrink-0">
                    <Clock className="h-3 w-3" />
                    {ship.time}
                  </div>
                  
                  {/* 입항/출항 */}
                  <Badge
                    variant="outline"
                    className={`text-xs h-4 px-1.5 rounded-md ${
                      ship.navigation === "입항" 
                        ? "bg-orange-500 text-white border-orange-500" 
                        : ship.navigation === "출항"
                        ? "bg-sky-500 text-white border-sky-500"
                        : ""
                    }`}
                  >
                    {ship.navigation}
                  </Badge>
                  
                  {/* 터미널 */}
                  <span className="text-xs truncate max-w-full overflow-hidden text-ellipsis">{terminalInfo}</span>
                  
                  {/* 검역 */}
                  {ship.quarantine && (
                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-xs h-4 px-1.5 rounded-md shrink-0">
                      검역
                    </Badge>
                  )}
                  
                  {/* 선명 (왼쪽 정렬, 남은 공간 차지) */}
                  <h3 className="font-bold text-xs flex-1 min-w-0 truncate overflow-hidden text-ellipsis">{ship.shipName}</h3>
                  
                  {/* 확장 아이콘 */}
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* 상세 정보 (확장) */}
                {isExpanded && (
                  <div className="pt-1.5 border-t space-y-1 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      <div>
                        <span className="text-muted-foreground">대리점:</span>{" "}
                        <span className="font-medium">{ship.agent}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">GRT/LOA:</span>{" "}
                        <span className="font-medium">
                          {ship.grt} ton / {ship.loa}m
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Draft:</span>{" "}
                        <span className="font-medium">{ship.dt}m</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">접안:</span>{" "}
                        <span className="font-medium">{ship.side}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pilot:</span>{" "}
                        <span className="font-medium">{ship.pt}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Call Sign:</span>{" "}
                        <span className="font-medium">{ship.callSign}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">IMO:</span>{" "}
                        <span className="font-medium">{ship.imo}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">예선:</span>{" "}
                        <span className="font-medium">{ship.tugs}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">라인:</span>{" "}
                        <span className="font-medium">{ship.line}</span>
                      </div>
                      {(ship as any).rmkTeam && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">RMK(지원팀):</span>{" "}
                          <span className="font-medium">{(ship as any).rmkTeam}</span>
                        </div>
                      )}
                      {(ship as any).rmkAgent && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">RMK(대리점):</span>{" "}
                          <span className="font-medium">{(ship as any).rmkAgent}</span>
                        </div>
                      )}
                      {(ship as any).rmk && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">RMK:</span>{" "}
                          <span className="font-medium">{(ship as any).rmk}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </Card>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Ship className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
};
