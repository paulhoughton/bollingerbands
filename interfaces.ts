interface MarkitInteractiveChart {
  Labels: any;
  Positions: number[];
  Dates: string[];
  Elements: {Currency:string;
    DataSeries:any;
    Symbol:string;
    TimeStamp:any
    Type:string;
  }[]
}
interface DateClose {
  date: Date;
  close: number;
}

interface Bollinger {
  date: Date;
  ma: number;
  lower: number;
  upper: number;
}

declare var fetchJsonp: (s:string) => PromiseLike<any>;
