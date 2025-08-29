export const pieChartOptions = {
  labelInterpolationFnc: function (value) {
    return value[0];
  },
};

export const verticalBarOptions = {
  axisY: {
    labelInterpolationFnc: function (value) {
      return Number.isInteger(value) ? value : "";
    },
  },
};

export const horizontalBarOptions = {
  horizontalBars: true,
  axisX: {
    labelInterpolationFnc: function (value) {
      return Number.isInteger(value) ? value : "";
    },
  },
  axisY: {
    offset: 140,
  },
};

export const stackedBarOptions = {
  stackBars: true,
  axisY: {
    labelInterpolationFnc: function (value) {
      return Number.isInteger(value) ? value : "";
    },
  },
};
