import { select, selectAll, event } from 'd3-selection';
import { scaleLinear, scaleTime } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { line, area } from 'd3-shape';
import { min, max, mean, range } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import 'd3-transition';

const getUrl = (stock:String) => `http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/jsonp?parameters={"Normalized":false,"NumberOfDays":365,"DataPeriod":"Day","Elements":[{"Symbol":"${stock}","Type":"price","Params":["c"]}]}`;

select("#stockInput").on("keydown", () => {
  if (event.keyCode === 13) {
    const dataUrl = getUrl((<HTMLInputElement>document.getElementById("stockInput")).value);
    fetchJsonp(dataUrl).then(res => res.json()).then(createChart);
  }
})

const height = +select("svg").attr("height") - 50
const width = +select("svg").attr("width") - 70

const x = scaleTime()
  .range([0, width]);

const y = scaleLinear()
  .range([height, 0]);

const xAxis = axisBottom(x)
  .tickSizeInner(-height)
  .tickFormat(timeFormat("%B"));

const yAxis = axisLeft(y)
  .tickSizeInner(-width);

const chartLine = (field:string) => line<Bollinger | DateClose>()
  .x(d => x(d.date))
  .y(d => y(d[field]));

const bandsArea = area<Bollinger>()
  .x(d => x(d.date))
  .y0(d => y(d.lower))
  .y1(d => y(d.upper));

let savedData:any;

selectAll("select").on("change", data=>createChart(<MarkitInteractiveChart>data));

function createChart(data?: MarkitInteractiveChart) {

  if (data) {
    var closeData: DateClose[] = data.Dates.map((d, i) => ({
      date: new Date(d),
      close: +data.Elements[0].DataSeries.close.values[i]
    }));
    savedData = closeData;
  }
  else {
    closeData = savedData;
  }

  const bollingerData = getBollinger(closeData,
    +(<HTMLInputElement>document.getElementById("maPeriod")).value,
    +(<HTMLInputElement>document.getElementById("stddev")).value);

  x.domain([closeData[0].date, closeData[closeData.length - 1].date]);
  const min2 = Math.min(+min(bollingerData, d => d.lower), +min(closeData, d => d.close));
  const max2 = Math.max(+max(bollingerData, d => d.upper), +max(closeData, d => d.close));
  y.domain([min2, max2]);

  select(".x")
    .call(xAxis);

  select(".y")
    .call(yAxis);

  select(".ma")
    .datum(bollingerData)
    .transition()
    .attr("d", chartLine("ma"))

  select(".close")
    .datum(closeData)
    .transition()
    .attr("d", chartLine("close"))

  select(".area")
    .datum(bollingerData)
    .transition()
    .attr("d", bandsArea)
    
  select(".y text")
    .text("Price $")

}

function getBollinger(data: DateClose[], n: number = 20, k: number = 2): Bollinger[] {
  return range(0, data.length - n).map(start => {
    const end = start + n - 1;
    const period = data.slice(start, end);
    const ma = mean(period, d => d.close);
    const stdDev = Math.sqrt(+mean(period.map(d => (d.close - ma) ** 2)));

    return <Bollinger>({
      date: data[end].date,
      ma: ma,
      lower: ma - k * stdDev,
      upper: ma + k * stdDev
    });

  });
}