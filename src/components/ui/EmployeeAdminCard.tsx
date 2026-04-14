
// src/components/ui/EmployeeAdminCard.tsx
import { Phone, User, Calendar, MapPin, Hash, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Employee {
  name: string;
  phone: string;
  status: string;
  empNo: string;
  hireDate: string;
  firstHireDate: string;
  residentId: string;
  address: string;
  isPublic: string;
}

export const EmployeeAdminCard = ({ employee }: { employee: Employee }) => {
  return (
    <Card className="w-full shadow-sm border-slate-200 overflow-hidden mb-4">
      {/* 헤더 섹션: 이름과 주요 상태 */}
      <CardHeader className="p-4 border-b bg-slate-50/50 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{employee.name}</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] h-5">
                {employee.status}
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-500">{employee.phone}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-white shadow-sm border hover:bg-blue-50 hover:text-blue-600"
          onClick={() => window.open(`tel:${employee.phone}`)}
        >
          <Phone className="w-4 h-4" />
        </Button>
      </CardHeader>

      {/* 상세 정보 섹션 */}
      <CardContent className="p-4 bg-white">
        <div className="grid gap-2.5 text-[13px]">
          <InfoRow icon={<Hash size={14} />} label="사원번호" value={employee.empNo} />
          <InfoRow icon={<ShieldCheck size={14} />} label="주민번호" value={employee.residentId} />
          <InfoRow icon={<Calendar size={14} />} label="입사일" value={employee.hireDate} />
          
          <div className="flex items-start gap-2 pt-1 border-t border-slate-50 mt-1">
            <div className="mt-0.5 text-slate-400"><MapPin size={14} /></div>
            <div className="flex flex-col">
              <span className="text-slate-500 font-medium mb-0.5">주소</span>
              <span className="text-slate-900 break-keep leading-snug">
                {employee.address}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 내부 보조 컴포넌트
const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <div className="text-slate-400">{icon}</div>
    <span className="w-20 shrink-0 text-slate-500 font-medium">{label}</span>
    <span className="flex-1 text-slate-900 truncate">{value}</span>
  </div>
);
