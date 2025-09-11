import React from "react";
import { PieChart, BarChart, LineChart } from "react-native-chart-kit";

/**
 * Type for the chart type prop.
 */
export type ChartType = "pie" | "bar" | "line";

/**
 * Base props for all chart types.
 */
interface BaseChartProps {
  data: any;
  width: number;
  height: number;
  chartConfig: any;
  style?: any;
}

/**
 * Custom props for pie charts.
 */
interface PieChartCustomProps extends BaseChartProps {
  type: "pie";
  accessor?: string;
  backgroundColor?: string;
  paddingLeft?: string;
  hasLegend?: boolean;
}

/**
 * Custom props for bar charts.
 */
interface BarChartCustomProps extends BaseChartProps {
  type: "bar";
  yAxisLabel?: string;
  yAxisSuffix?: string;
  fromZero?: boolean;
  withInnerLines?: boolean;
}

/**
 * Custom props for line charts.
 */
interface LineChartCustomProps extends BaseChartProps {
  type: "line";
  fromZero?: boolean;
  bezier?: boolean;
  withInnerLines?: boolean;
}

/**
 * Union type for all chart props.
 */
export type ChartProps =
  | PieChartCustomProps
  | BarChartCustomProps
  | LineChartCustomProps;

/**
 * Helper function to sample data for line charts to ensure that there are at most maxPoints data points.
 * Skip some data points to avoid overlapping labels, if there are more than maxPoints (5 by default).
 *
 * @param data - The data object for the line chart.
 * @param maxPoints - The maximum number of data points to display.
 * @returns The sampled data object.
 */
const sampleLineChartData = (data: any, maxPoints: number = 5) => {
  if (!data || !data.labels || data.labels.length <= maxPoints) {
    return data;
  }

  // Sample the data to ensure that we have at most maxPoints data points
  const { labels, datasets } = data;
  const step = Math.ceil(labels.length / maxPoints);

  // Filter the labels based on the step size (so that we have at most maxPoints labels on the chart)
  const newLabels = labels.filter(
    (_: any, index: number) => index % step === 0,
  );

  // Filter the data points based on the step size (so that we have at most maxPoints data points on the chart)
  const newDatasets = datasets.map((dataset: any) => ({
    ...dataset,
    data: dataset.data.filter((_: any, index: number) => index % step === 0),
  }));

  return {
    labels: newLabels,
    datasets: newDatasets,
  };
};

/**
 * Chart component that renders a pie, bar, or line chart based on the type prop.
 *
 * @param props - The props for the chart component. Either PieChartCustomProps, BarChartCustomProps, or LineChartCustomProps.
 */
const Chart: React.FC<ChartProps> = (props) => {
  const { type, ...rest } = props;

  // Render the appropriate chart based on the type prop, using react-native-chart-kit components
  switch (type) {
    case "pie": {
      const {
        accessor,
        backgroundColor,
        paddingLeft,
        hasLegend,
        ...otherProps
      } = rest as PieChartCustomProps;
      return (
        <PieChart
          {...otherProps}
          accessor={accessor ?? "population"}
          backgroundColor={backgroundColor ?? "transparent"}
          paddingLeft={paddingLeft ?? "15"}
          hasLegend={hasLegend ?? false}
        />
      );
    }
    case "bar": {
      const {
        yAxisLabel,
        yAxisSuffix,
        fromZero,
        withInnerLines,
        ...otherProps
      } = rest as BarChartCustomProps;
      return (
        <BarChart
          {...otherProps}
          yAxisLabel={yAxisLabel ?? ""}
          yAxisSuffix={yAxisSuffix ?? ""}
          fromZero={fromZero ?? false}
          withInnerLines={withInnerLines ?? true}
        />
      );
    }
    case "line": {
      const { fromZero, bezier, withInnerLines, ...otherProps } =
        rest as LineChartCustomProps;
      // Ensure that we have at most 5 data points to avoid overlapping labels
      if (otherProps.data && otherProps.data.labels) {
        otherProps.data = sampleLineChartData(otherProps.data, 5);
      }
      return (
        <LineChart
          {...otherProps}
          fromZero={fromZero ?? false}
          bezier={bezier ?? false}
          withInnerLines={withInnerLines ?? true}
        />
      );
    }
    default:
      return null; // Return null if the type is invalid
  }
};

export default Chart;
