import React, { useContext, useEffect } from "react";
import { View, Dimensions, ScrollView, Platform } from "react-native";
import { Text, Card, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  SlideInDown,
} from "react-native-reanimated";
import { withAuth } from "../../components/withAuth";

// Import custom styles and hooks and TaskContext for task management
import { styles } from "../../styles/StatsScreenStyles";
import usePrevious from "../../hooks/usePrevious";
import Chart from "../../components/Chart";
import { TaskContext } from "../../contexts/TaskContext";

// Animated ScrollView component - for smooth background transitions
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

/**
 * StatsScreen component serves as the statistics screen for the task manager application,
 * it displays a summary of tasks, completion status, due dates, and tasks by month.
 *
 * A nice-to-have enhancement for the app!
 */
function StatsScreen() {
  const { tasks } = useContext(TaskContext);
  const { colors } = useTheme();

  // Animate background transitions when colors.background changes for a smoother UX
  // Apply a fade-in effect to the background color, duration 200ms
  const prevBackground = usePrevious(colors.background) || colors.background;
  const progress = useSharedValue(1);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 200 });
  }, [colors.background]);

  /**
   * Animated style that interpolates between the previous and current background color.
   */
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [prevBackground, colors.background],
    ),
  }));

  // ---- PREPARE DATA FOR CHARTS ----
  // Calculate statistics based on task data from taskContext
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const now = new Date();

  // Count overdue and upcoming tasks
  let overdueCount = 0;
  let upcomingCount = 0;

  // Count tasks by month for line chart
  const tasksByMonth: { [month: string]: number } = {};

  // Loop through tasks to count overdue and upcoming tasks (comparing full date/time to the minute)
  tasks.forEach((task) => {
    const due = task.dueDate;
    if (!task.completed && due.getTime() < now.getTime()) {
      overdueCount++;
    } else if (!task.completed && due.getTime() >= now.getTime()) {
      upcomingCount++;
    }
    // Group by month (needed for the line chart)
    const monthKey = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`;
    tasksByMonth[monthKey] = (tasksByMonth[monthKey] || 0) + 1;
  });

  // Keys for months and data for line chart
  // Using keys because the data may not be in order, so we sort them by keys first
  // before mapping to data. This ensures the data is in the correct order for the chart.
  const monthKeys = Object.keys(tasksByMonth).sort();
  const monthData = monthKeys.map((k) => tasksByMonth[k]);

  // Prepare data for pie chart
  const pieData = [
    { name: "Completed", count: completedTasks, color: "#2ecc71" },
    {
      name: "Incomplete",
      count: totalTasks - completedTasks,
      color: "#e74c3c",
    },
  ];

  // Prepare data for bar chart using the full comparison (including minutes)
  const barData = {
    labels: ["Overdue", "Upcoming"],
    datasets: [{ data: [overdueCount, upcomingCount] }],
  };

  // Prepare data for line chart
  let lineChartData = {
    labels: monthKeys,
    datasets: [{ data: monthData }],
  };

  // If there's only one month, duplicate the data to show a single point on the line chart
  if (monthKeys.length === 1) {
    lineChartData = {
      labels: [monthKeys[0], monthKeys[0]],
      datasets: [{ data: [monthData[0], monthData[0]] }],
    };
  }

  // Calculate dimensions for the charts to better fit the screen
  const screenWidth = Dimensions.get("window").width * 0.85; // 85% of screen width to fit nicely
  const chartHeight = 220;

  // Chart config forcing transparent backgrounds and specifying a custom font for labels on web,
  // as well as other customizations for the charts
  const chartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: "transparent",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "transparent",
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.onBackground,
    barPercentage: 1,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 12,
      fontFamily: Platform.OS === "web" ? "Roboto-Regular" : "System",
    },
    propsForBackgroundLines: {
      stroke: colors.onBackground,
      strokeOpacity: 0,
    },
  };

  // Render the StatsScreen component
  return (
    <AnimatedScrollView style={[styles.container, animatedStyle]}>
      {/* Header */}
      <View style={styles.headerArea}>
        <Text style={[styles.heading, { color: colors.onBackground }]}>
          TASK SUMMARY
        </Text>
      </View>

      {/* Summary Text */}
      <Text
        style={[
          styles.subheading,
          { color: colors.onBackground, textAlign: "center" },
        ]}
      >
        Your tasks, at a glance 🚀
      </Text>

      {/* Top Cards - show total tasks and completed tasks at a glance */}
      <View style={styles.topCardsContainer}>
        <Animated.View
          entering={SlideInDown.duration(400)}
          style={[styles.topCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.topCardNumber, { color: colors.onBackground }]}>
            {totalTasks}
          </Text>
          <Text style={[styles.topCardLabel, { color: colors.onBackground }]}>
            Tasks
          </Text>
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(400).delay(100)}
          style={[styles.topCard, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.topCardNumber, { color: colors.onBackground }]}>
            {completedTasks}
          </Text>
          <Text style={[styles.topCardLabel, { color: colors.onBackground }]}>
            Completed
          </Text>
        </Animated.View>
      </View>

      {/* COMPLETION PIE CHART */}
      <Animated.View entering={SlideInDown.duration(400).delay(200)}>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Completion Status"
            titleStyle={{
              color: colors.onBackground,
              fontWeight: "bold",
              fontFamily: Platform.OS === "web" ? "Roboto-Bold" : "System",
            }}
          />
          <Card.Content>
            {totalTasks === 0 ? (
              <Text style={{ color: colors.onBackground }}>No tasks yet.</Text>
            ) : (
              <Chart
                type="pie"
                data={pieData.map((d) => ({
                  name: d.name,
                  population: d.count,
                  color: d.color,
                  legendFontColor: colors.onBackground,
                  legendFontSize: 14,
                  // Force the legend font to use Roboto-Regular on web instead of Arial
                  legendFontFamily:
                    Platform.OS === "web" ? "Roboto-Regular" : "System",
                }))}
                width={screenWidth}
                height={chartHeight}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                hasLegend={true}
                paddingLeft="15"
                style={{ backgroundColor: "transparent" }}
              />
            )}
          </Card.Content>
        </Card>
      </Animated.View>

      {/* OVERDUE/ UPCOMING BAR CHART */}
      <Animated.View entering={SlideInDown.duration(400).delay(300)}>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Overdue vs Upcoming Tasks"
            titleStyle={{
              color: colors.onBackground,
              fontWeight: "bold",
              fontFamily: Platform.OS === "web" ? "Roboto-Bold" : "System",
            }}
          />
          <Card.Content>
            {totalTasks === 0 ? (
              <Text style={{ color: colors.onBackground }}>No tasks yet.</Text>
            ) : (
              <Chart
                type="bar"
                data={barData}
                width={screenWidth}
                height={chartHeight}
                chartConfig={{ ...chartConfig, barPercentage: 2 }}
                style={{
                  backgroundColor: "transparent",
                  borderRadius: 8,
                  marginHorizontal: -10,
                }}
                fromZero={true}
                yAxisLabel=""
                yAxisSuffix=""
                withInnerLines={false}
              />
            )}
          </Card.Content>
        </Card>
      </Animated.View>

      {/* LINE CHART FOR MONTH-BY-MONTH TASKS */}
      <Animated.View entering={SlideInDown.duration(400).delay(400)}>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Title
            title="Task Due Dates by Month"
            titleStyle={{
              color: colors.onBackground,
              fontWeight: "bold",
              fontFamily: Platform.OS === "web" ? "Roboto-Bold" : "System",
            }}
          />
          <Card.Content>
            {monthKeys.length === 0 ? (
              <Text style={{ color: colors.onBackground }}>
                No tasks with valid due dates.
              </Text>
            ) : (
              <Chart
                type="line"
                fromZero={true}
                data={lineChartData}
                width={screenWidth}
                height={chartHeight}
                chartConfig={chartConfig}
                style={{
                  backgroundColor: "transparent",
                  borderRadius: 8,
                }}
                bezier={true}
                withInnerLines={false}
              />
            )}
          </Card.Content>
        </Card>
      </Animated.View>
    </AnimatedScrollView>
  );
}

export default withAuth(StatsScreen);
