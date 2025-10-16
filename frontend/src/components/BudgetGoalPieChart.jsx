import * as React from 'react';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';
import { useMemo } from "react";

// --- Color and Utility Functions ---

// Define base colors for 'Paid' and a derived lighter/greyish color for 'Unpaid'
const paidColors = [
    "#4ADE80", // Green
    "#60A5FA", // Blue
    "#A855F7", // Purple
    "#F472B6", // Pink
    "#FBBF24", // Yellow
    "#EF4444", // Red
    "#34D399", // Teal
    "#8B5CF6", // Violet
    "#EC4899", // Fuchsia
    "#F97316", // Orange
    "#E879F9", // Magenta
];

// Greyish colors for the 'Unpaid' slice for each user/category
const unpaidColors = [
    "#A7F3D0", // Light Green/Greyish
    "#BFDBFE", // Light Blue/Greyish
    "#D8B4FE", // Light Purple/Greyish
    "#FBCFE8", // Light Pink/Greyish
    "#FDE68A", // Light Yellow/Greyish
    "#FECACA", // Light Red/Greyish
    "#99F6E4", // Light Teal/Greyish
    "#C4B5FD", // Light Violet/Greyish
    "#F9A8D4", // Light Fuchsia/Greyish
    "#FED7AA", // Light Orange/Greyish
    "#F5D0FE", // Light Magenta/Greyish
];

const getColor = (index) => {
    const paidColor = paidColors[index % paidColors.length];
    const unpaidColor = unpaidColors[index % unpaidColors.length];
    return { paid: paidColor, unpaid: unpaidColor };
};

// --- Center Label Component (styled to match theme.palette.text.primary) ---

const StyledText = styled('text')(({ theme }) => ({
    fill: theme.palette.text.primary,
    textAnchor: 'middle',
    dominantBaseline: 'central',
    fontSize: 20,
}));

// eslint-disable-next-line
function PieCenterLabel({ children }) {
    const { width, height, left, top } = useDrawingArea();
    return (
        <StyledText x={left + width / 2} y={top + height / 2}>
            {children}
        </StyledText>
    );
}

// --- Data Processing Hook ---

const UNASSIGNED_ID = "unassigned";
const UNASSIGNED_NAME = "Unassigned";
const REMAINING_GOAL_ID = "remaining-goal";
const REMAINING_GOAL_NAME = "Remaining Goal";

// Custom hook to handle the data transformation logic
const useBudgetGoalData = (budgetPlan) => {
    return useMemo(() => {
        if (!budgetPlan || !budgetPlan.costs || budgetPlan.goal === undefined) {
            return {
                totalGoal: 0,
                totalPaid: 0,
                innerChartData: [],
                outerChartData: [],
                totalPayments: 0
            };
        }

        const costs = budgetPlan.costs || [];
        const originalGoal = budgetPlan.goal || 0;

        let totalPaid = 0;
        let totalCostGoal = 0; // Sum of all individual cost goals

        // Tracks total paid and total goal contribution per user/category
        const paidByUser = {};
        const goalByUser = {};
        const userNamesMap = {};

        costs.forEach((cost) => {
            const paidAmount = cost.paid || 0;
            const costGoal = cost.goal || 0;

            totalPaid += paidAmount;
            totalCostGoal += costGoal;

            const assignedUsers = cost.users && cost.users.length > 0 ? cost.users : [{ id: UNASSIGNED_ID, name: UNASSIGNED_NAME }];

            // Distribute goal and paid amounts among assigned users (simple equal split assumption)
            const splitAmountPaid = paidAmount / assignedUsers.length;
            const splitAmountGoal = costGoal / assignedUsers.length;

            assignedUsers.forEach((user) => {
                // Accumulate paid amount
                paidByUser[user.id] = (paidByUser[user.id] || 0) + splitAmountPaid;

                // Accumulate goal contribution
                goalByUser[user.id] = (goalByUser[user.id] || 0) + splitAmountGoal;

                userNamesMap[user.id] = user.name;
            });
        });

        // CRITICAL UPDATE: Determine the effective goal for the chart
        const effectiveGoal = Math.max(originalGoal, totalCostGoal, totalPaid);
        // eslint-disable-next-line
        const totalPayments = totalPaid; // Total value represented in the inner ring

        const userIds = Object.keys(userNamesMap);

        const innerChartData = []; // Represents total goal allocation (Paid + Unpaid per user + Remaining Goal)
        const outerChartData = []; // Represents the split of each user's goal into Paid and Unpaid

        let colorIndex = 0;

        userIds.forEach((id) => {
            const name = userNamesMap[id];
            const paid = paidByUser[id] || 0;
            const goal = goalByUser[id] || 0;

            const colors = getColor(colorIndex++);

            // Add to Outer Chart: Paid Slice
            if (paid > 0) {
                outerChartData.push({
                    id: `${id}-paid`,
                    label: `${name} (Paid)`,
                    value: paid,
                    color: colors.paid,
                });
            }

            // Add to Outer Chart: Unpaid Slice (Goal - Paid)
            const unpaid = Math.max(0, goal - paid);
            // Only add unpaid slices if they are contributing to a goal
            if (unpaid > 0) {
                outerChartData.push({
                    id: `${id}-unpaid`,
                    label: `${name} (Unpaid)`,
                    value: unpaid,
                    color: colors.unpaid,
                });
            }

            // Add to Inner Chart: User Goal Total (Paid + Unpaid)
            if (goal > 0) {
                innerChartData.push({
                    id: id,
                    label: `${name} Goal`,
                    value: goal,
                    // Use a color that visually groups it with the outer ring segments
                    color: colors.paid,
                });
            }
        });

        // Remaining effective goal (if total goals are less than effectiveGoal or totalPaid is less than effectiveGoal)
        
        // Use the difference between effectiveGoal and totalPaid for the "Remaining" slice
        const totalRemaining = Math.max(0, effectiveGoal - totalPaid);

        if (totalRemaining > 0) {
            // Add to Inner Chart: Remaining Goal (Represents the gap to the effectiveGoal)
            innerChartData.push({
                id: REMAINING_GOAL_ID,
                label: REMAINING_GOAL_NAME,
                value: totalRemaining,
                color: "#D1D5DB", // Standard Grey
            });
            
            // Add to Outer Chart: Remaining Goal (Represents the total unpaid portion of the effectiveGoal)
             outerChartData.push({
                id: REMAINING_GOAL_ID,
                label: REMAINING_GOAL_NAME,
                value: totalRemaining,
                color: "#9CA3AF", // Slightly darker grey for contrast
            });
        }
        
        


        return {
            totalGoal: effectiveGoal,
            totalPaid,
            innerChartData,
            outerChartData,
            totalPayments: totalPaid,
        };
    }, [budgetPlan]);
};

// --- Main Component ---

export default function BudgetGoalPieMuiChart({ budgetPlan }) {
    const { totalGoal, totalPaid, innerChartData, outerChartData } = useBudgetGoalData(budgetPlan);
    const [view, setView] = React.useState('goal'); // State for view toggle

    if (!budgetPlan || !budgetPlan.goal || budgetPlan.goal <= 0) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                No goal set for this budget plan.
            </div>
        );
    }

    // Filter out items with 0 value for cleaner display
    const filteredInnerChartData = innerChartData.filter(item => item.value > 0);
    const filteredOuterChartData = outerChartData.filter(item => item.value > 0);

    if (filteredInnerChartData.length === 0) {
        return (
            <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                Loading chart data...
            </div>
        );
    }

    const handleViewChange = (event, newView) => {
        if (newView !== null) {
            setView(newView);
        }
    };

    const innerRadius = 50;
    const middleRadius = 120;

    // Value formatter to show dollar amount and percentage (relative to totalGoal)
    const goalValueFormatter = ({ value }) =>
        `$${value.toFixed(0)} (${((value / totalGoal) * 100).toFixed(0)}%)`; // 0 decimals for whole dollars/percents

    // Value formatter for outer ring (Paid/Unpaid)
    // FIX: Consistently use totalGoal (the effectiveGoal) as the percentage base for ALL outer ring segments
    // to ensure they sum to 100%. Prevent division by zero.
    const splitValueFormatter = ({ value }) => {
        const percentageBase = totalGoal > 0 ? totalGoal : 1; 
        
        return `$${value.toFixed(0)} (${((value / percentageBase) * 100).toFixed(0)}%)`; // 0 decimals
    };

    // New Value formatter for 'Paid Contribution' inner ring (percentage relative to totalPaid)
    const paidInnerValueFormatter = ({ value }) => {
        // Use totalPaid as the base for percentage calculation
        const percentageBase = totalPaid > 0 ? totalPaid : 1; 
        
        return `$${value.toFixed(0)} (${((value / percentageBase) * 100).toFixed(0)}%)`; // 0 decimals
    };


    // --- Goal View Series ---
    const goalSeries = [
        {
            // Inner Ring: Total Goal Allocation (User Goals + Remaining Goal)
            innerRadius,
            outerRadius: middleRadius,
            data: filteredInnerChartData,
            arcLabel: (item) => `${item.id === REMAINING_GOAL_ID ? 'Remaining' : item.label.split(' ')[0]}`,
            valueFormatter: goalValueFormatter,
            highlightScope: { fade: 'global', highlight: 'item' },
            highlighted: { additionalRadius: 2 },
            cornerRadius: 3,
        },
        {
            // Outer Ring: Paid vs. Unpaid Split
            innerRadius: middleRadius,
            outerRadius: middleRadius + 20,
            data: filteredOuterChartData,
            valueFormatter: splitValueFormatter,
            highlightScope: { fade: 'global', highlight: 'item' },
            highlighted: { additionalRadius: 2 },
            cornerRadius: 3,
        },
    ];
    
    // --- Paid View Series (UPDATED LOGIC: Removed REMAINING_GOAL_ID from inner ring) ---
    
    // 1. Inner Ring Data: Total Paid by User (No Remaining Goal)
    const paidInnerData = [];
    
    // Add 'Paid' slices from the outerChartData
    filteredOuterChartData.forEach(item => {
        if (item.id.includes('-paid')) {
            paidInnerData.push({
                ...item,
                // Clean up the label
                label: `${item.label.replace(' (Paid)', '')} Paid`, 
            });
        }
    });

    // NOTE: The Remaining Goal logic is explicitly removed from paidInnerData here.
    // The inner ring will now only represent totalPaid (and will not be a complete circle 
    // unless totalPaid >= totalGoal).

    // 2. Outer Ring Data: Full Goal Contribution by User (excluding REMAINING_GOAL_ID)
    const paidOuterData = filteredInnerChartData.filter(item => item.id !== REMAINING_GOAL_ID);

    const paidSeries = [
        {
            // Inner Ring: Total Paid by User (Slices represent money paid)
            innerRadius,
            outerRadius: middleRadius,
            data: paidInnerData,
            // Only show arc label for user names, no 'Remaining' label
            arcLabel: (item) => `${item.label.split(' ')[0]}`, 
            // *** CHANGE: Use the new formatter based on totalPaid ***
            valueFormatter: paidInnerValueFormatter, 
            highlightScope: { fade: 'global', highlight: 'item' },
            highlighted: { additionalRadius: 2 },
            cornerRadius: 3,
        },
        {
            // Outer Ring: Full Goal Contribution by User (Slices represent each user's goal)
            innerRadius: middleRadius,
            outerRadius: middleRadius + 20,
            data: paidOuterData,
            // Goal view outer ring still uses goalValueFormatter (based on totalGoal)
            valueFormatter: goalValueFormatter, 
            highlightScope: { fade: 'global', highlight: 'item' },
            highlighted: { additionalRadius: 2 },
            cornerRadius: 3,
        },
    ];


    return (
        <Box sx={{ width: '100%', textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom >
                Budget Goal Progress
            </Typography>
            <ToggleButtonGroup
                color="primary"
                size="small"
                value={view}
                exclusive
                onChange={handleViewChange}
                sx={{ mb: 2 }}
            >
                <ToggleButton value="goal" >View by Goal Progress</ToggleButton>
                <ToggleButton value="paid" >View by Paid Contribution</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ display: 'flex', justifyContent: 'center', height: 400 }}>
                <PieChart
                    series={view === 'goal' ? goalSeries : paidSeries}
                    // Styling for arc labels (smaller font, matching the example's 12px)
                    sx={{
                        [`& .${pieArcLabelClasses.root}`]: {
                            fontSize: '12px',
                        },
                    }}
                    slotProps={{
                        legend: { hidden: true },
                    }}
                    height={400}
                >
                </PieChart>
            </Box>
            <div className="mt-6">
                <Typography variant="h6" align="left" sx={{ ml: 4, mb: 1 }}>Legend</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {filteredOuterChartData.map((item) => { // Use the comprehensive outerChartData for the legend
                        return (
                            <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', m: 1 }}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: item.color,
                                        mr: 1,
                                    }}
                                />
                                <Typography variant="body2">{item.label}</Typography>
                            </Box>
                        );
                    })}
                </Box>
            </div>
        </Box>
    );
}