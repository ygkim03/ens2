export interface ShipSchedule {
  id: string;
  no: number;
  date: string;
  time: string;
  shipName: string;
  grt: string;
  loa: string;
  dt: string;
  from: string;
  to: string;
  side: string;
  callSign: string;
  imo: string;
  tugs: string;
  quarantine: boolean;
  line: string;
  navigation: "입항" | "출항" | "이동";
  agent: string;
  remarks: string;
  rmkTeam?: string;
  rmkAgent?: string;
  isSpecial: boolean;
  pt: string;
}
