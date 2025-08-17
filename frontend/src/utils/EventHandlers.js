const pieChartColors = [
  "#00C851",
  "#ffbb33",
  "#ff4444",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
  "#aec7e8",
];

const barChartColors = [
  "#ff9896",
  "#c5b0d5",
  "#c49c94",
  "#f7b6d2",
  "#c7c7c7",
  "#dbdb8d",
  "#9edae5",
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
];

export const pieChartEventHandlers = {
  draw: function (data) {
    if (data.type === "slice") {
      const sliceIndex = data.index;
      const color = pieChartColors[sliceIndex];
      data.element.attr({
        style: `fill: ${color}`,
      });
    }
  },
};

export const verticalBarEventHandlers = {
  draw: function (data) {
    if (data.type === "bar") {
      const sliceIndex = data.index;
      const color = barChartColors[sliceIndex];
      data.element.attr({
        style: `stroke-width: 30px; stroke: ${color}`,
      });
    }
  },
};

export const horizontalBarEventHandlers = {
  draw: function (data) {
    if (data.type === "bar") {
      const sliceIndex = data.index;
      const color = barChartColors[sliceIndex];
      data.element.attr({
        style: `stroke-width: 15px; stroke: ${color}`,
      });
    }
  },
};

export const stackedBarEventHandlers = {
  draw: function (data) {
    if (data.type === "bar") {
      const sliceIndex = data.index;
      const color = ["#268dd6ff", "#ff4444"][sliceIndex];
      data.element.attr({
        style: `stroke-width: 30px; stroke: ${color}`,
      });
    }
  },
};
