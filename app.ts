const getUrl = stock => `http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/jsonp?parameters={"Normalized":false,"NumberOfDays":365,"DataPeriod":"Day","Elements":[{"Symbol":"${stock}","Type":"price","Params":["c"]}]}`;

d3.select("#stockInput").on("keydown", () => {
  if (d3.event.keyCode === 13) {
    const dataUrl = getUrl((<HTMLInputElement>document.getElementById("stockInput")).value);
    fetchJsonp(dataUrl).then(res => res.json()).then(createChart);
  }
})

const height = +d3.select("svg").attr("height") - 50
const width = +d3.select("svg").attr("width") - 70

const x = d3.time.scale()
  .range([0, width]);

const y = d3.scale.linear()
  .range([height, 0]);

const xAxis = d3.svg.axis()
  .scale(x)
  .innerTickSize(-height)
  .orient("bottom")
  .tickFormat(d3.time.format("%B"));

const yAxis = d3.svg.axis()
  .scale(y)
  .innerTickSize(-width)
  .orient("left")

const line = (field) => d3.svg.line<Bollinger | DateClose>()
  .x(d => x(d.date))
  .y(d => y(d[field]));

const bandsArea = d3.svg.area<Bollinger>()
  .x(d => x(d.date))
  .y0(d => y(d.lower))
  .y1(d => y(d.upper));

let savedData;

d3.selectAll("select").on("change", createChart);

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
  const min = Math.min(d3.min(bollingerData, d => d.lower), d3.min(closeData, d => d.close));
  const max = Math.max(d3.max(bollingerData, d => d.upper), d3.max(closeData, d => d.close));
  y.domain([min, max]);

  d3.select(".x")
    .call(xAxis);

  d3.select(".y")
    .transition()
    .call(yAxis);

  d3.select(".ma")
    .datum(bollingerData)
    .transition()
    .attr("d", line("ma"))

  d3.select(".close")
    .datum(closeData)
    .transition()
    .attr("d", line("close"))

  d3.select(".area")
    .datum(bollingerData)
    .transition()
    .attr("d", bandsArea)
    
  d3.select(".y text")
    .text("Price $")

}

function getBollinger(data: DateClose[], n: number = 20, k: number = 2): Bollinger[] {
  return d3.range(0, data.length - n).map(start => {
    const end = start + n - 1;
    const period = data.slice(start, end);
    const ma = d3.mean(period, d => d.close);
    const stdDev = Math.sqrt(d3.mean(period.map(d => (d.close - ma) ** 2)));

    return ({
      date: data[end].date,
      ma,
      lower: ma - k * stdDev,
      upper: ma + k * stdDev
    });

  });
}