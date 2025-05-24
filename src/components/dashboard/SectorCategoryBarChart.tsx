import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";

interface SectorCategoryBarChartProps {
  transactionsInDateRange: any[];
  categories: any[];
  sectors: any[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  // Add more if needed
];

const SectorCategoryBarChart: React.FC<SectorCategoryBarChartProps> = ({
  transactionsInDateRange,
  categories,
  sectors,
}) => {
  // Build a map of categoryId -> categoryName
  const categoryIdToName = useMemo(
    () =>
      categories.reduce((acc: Record<string, string>, cat: any) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {}),
    [categories]
  );

  // Build a map of sectorId -> { categoryId -> color }
  const sectorCategoryColorMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    sectors.forEach((sector) => {
      map[sector.id] = {};
      sector.category_ids.forEach((catId: string, i: number) => {
        map[sector.id][catId] = CHART_COLORS[i % CHART_COLORS.length];
      });
    });
    return map;
  }, [sectors]);

  // Aggregate data: sector -> { category -> amount }
  const data = useMemo(() => {
    // sectorId -> { sectorName, ...categoryAmounts }
    const sectorData: Record<string, any> = {};
    sectors.forEach((sector: any) => {
      sectorData[sector.id] = {
        sector: sector.name,
        sectorId: sector.id,
      };
      sector.category_ids.forEach((catId: string) => {
        sectorData[sector.id][catId] = 0;
      });
    });
    transactionsInDateRange
      .filter((t) => t.transaction_type === "expense")
      .forEach((t) => {
        // Find which sector this category belongs to
        const catId = categories.find(
          (cat) =>
            cat.name ===
            (t.category_name_for_reimbursement_logic || t.category_name)
        )?.id;
        if (!catId) return;
        const sector = sectors.find((s) => s.category_ids.includes(catId));
        if (!sector) return;
        if (!sectorData[sector.id][catId]) sectorData[sector.id][catId] = 0;
        sectorData[sector.id][catId] += t.amount || 0;
      });
    // Convert to array for recharts
    return Object.values(sectorData);
  }, [transactionsInDateRange, categories, sectors]);

  // Only show sectors with at least one nonzero value
  const filteredData = data.filter((row) =>
    sectors
      .find((s) => s.id === row.sectorId)
      ?.category_ids.some((catId: string) => row[catId] > 0)
  );

  // Dynamically set chart height based on number of sectors
  const chartHeight = Math.max(220, filteredData.length * 60);

  // Custom label renderer for sector name inside the bar
  const renderSectorLabel = (props: any) => {
    const { y, height, value, width } = props;
    if (!value) return null;
    return (
      <text
        x={8}
        y={y + height / 2 + 5}
        fill="#fff"
        fontSize={14}
        fontWeight="bold"
        alignmentBaseline="middle"
        pointerEvents="none"
      >
        {value}
      </text>
    );
  };

  // Get the first categoryId for each sector (for label placement)
  const firstCategoryIds = sectors.map((sector) => sector.category_ids[0]);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Sector & Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <p className="text-muted-foreground">No expenses to show.</p>
        ) : (
          <div className="w-full overflow-x-auto sm:overflow-x-visible">
            <ChartContainer config={{}} className={`min-w-[480px] w-full`}>
              <BarChart
                data={filteredData}
                height={chartHeight}
                layout="vertical"
                margin={{ top: 16, right: 32, left: 16, bottom: 16 }}
                barCategoryGap={16}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="sector"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={0}
                  tick={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="sector" />}
                />
                {sectors.map((sector) =>
                  sector.category_ids.map((catId: string, i: number) => (
                    <Bar
                      key={`${sector.id}-${catId}`}
                      dataKey={catId}
                      stackId="a"
                      fill={sectorCategoryColorMap[sector.id][catId]}
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                      name={categoryIdToName[catId]}
                    >
                      {i === 0 && (
                        <LabelList
                          dataKey="sector"
                          content={renderSectorLabel}
                        />
                      )}
                    </Bar>
                  ))
                )}
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectorCategoryBarChart;
