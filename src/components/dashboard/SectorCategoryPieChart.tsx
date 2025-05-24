import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Sector, Label } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  // Add more if needed
];

interface SectorCategoryPieChartProps {
  transactionsInDateRange: any[];
  categories: any[];
  sectors: any[];
}

const SectorCategoryPieChart: React.FC<SectorCategoryPieChartProps> = ({
  transactionsInDateRange,
  categories,
  sectors,
}) => {
  // Aggregate sector totals
  const sectorTotals = useMemo(() => {
    const map: Record<string, number> = {};
    transactionsInDateRange
      .filter((t) => t.transaction_type === "expense")
      .forEach((t) => {
        const cat = categories.find(
          (c) =>
            c.name ===
            (t.category_name_for_reimbursement_logic || t.category_name)
        );
        if (!cat) return;
        const sector = sectors.find((s) => s.category_ids.includes(cat.id));
        if (!sector) return;
        map[sector.id] = (map[sector.id] || 0) + (t.amount || 0);
      });
    return sectors
      .map((s, i) => ({
        id: s.id,
        name: s.name,
        value: map[s.id] || 0,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .filter((s) => s.value > 0);
  }, [transactionsInDateRange, categories, sectors]);

  // Aggregate category totals for a sector
  const getCategoryTotalsForSector = (sectorId: string) => {
    const sector = sectors.find((s) => s.id === sectorId);
    if (!sector) return [];
    const map: Record<string, number> = {};
    transactionsInDateRange
      .filter((t) => t.transaction_type === "expense")
      .forEach((t) => {
        const cat = categories.find(
          (c) =>
            c.name ===
            (t.category_name_for_reimbursement_logic || t.category_name)
        );
        if (!cat) return;
        if (!sector.category_ids.includes(cat.id)) return;
        map[cat.id] = (map[cat.id] || 0) + (t.amount || 0);
      });
    return sector.category_ids
      .map((catId: string, i: number) => {
        const cat = categories.find((c) => c.id === catId);
        return cat && map[catId]
          ? {
              id: cat.id,
              name: cat.name,
              value: map[catId],
              fill: CHART_COLORS[i % CHART_COLORS.length],
            }
          : null;
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      value: number;
      fill: string;
    }[];
  };

  // Dropdown state
  const [selectedSectorId, setSelectedSectorId] = useState<string | "all">(
    "all"
  );

  // Pie data and config
  const pieData =
    selectedSectorId === "all"
      ? sectorTotals
      : getCategoryTotalsForSector(selectedSectorId);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    pieData.forEach((item) => {
      config[item.id] = {
        label: item.name,
        color: item.fill,
      };
    });
    return config;
  }, [pieData]);

  // Pie chart active index
  const [activeIndex, setActiveIndex] = useState(0);
  React.useEffect(() => {
    setActiveIndex(0);
  }, [selectedSectorId, pieData.length]);

  // Dropdown options
  const sectorOptions = [
    { id: "all", name: "All Sectors" },
    ...sectors.map((s) => ({ id: s.id, name: s.name })),
  ];

  // Pie label in center
  const renderCenterLabel = ({ viewBox }: any) => {
    if (!pieData[activeIndex]) return null;
    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
      return (
        <text
          x={viewBox.cx}
          y={viewBox.cy}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          <tspan
            x={viewBox.cx}
            y={viewBox.cy}
            className="fill-foreground text-2xl font-bold"
          >
            ${pieData[activeIndex].value.toLocaleString()}
          </tspan>
          <tspan
            x={viewBox.cx}
            y={(viewBox.cy || 0) + 24}
            className="fill-muted-foreground text-base"
          >
            {pieData[activeIndex].name}
          </tspan>
        </text>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <ChartStyle id="sector-category-pie" config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Sector & Category Breakdown</CardTitle>
        </div>
        <Select value={selectedSectorId} onValueChange={setSelectedSectorId}>
          <SelectTrigger
            className="ml-auto h-7 w-[160px] rounded-lg pl-2.5"
            aria-label="Select a sector"
          >
            <SelectValue placeholder="Select sector" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {sectorOptions.map((opt) => (
              <SelectItem
                key={opt.id}
                value={opt.id}
                className="rounded-lg [&_span]:flex"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="flex h-3 w-3 shrink-0 rounded-sm"
                    style={{
                      backgroundColor: chartConfig[opt.id]?.color || "#ccc",
                    }}
                  />
                  {opt.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id="sector-category-pie"
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={activeIndex}
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onTouchStart={(_, idx) => setActiveIndex(idx)}
              activeShape={({ outerRadius = 0, ...props }) => (
                <g>
                  <Sector {...props} outerRadius={outerRadius + 10} />
                  <Sector
                    {...props}
                    outerRadius={outerRadius + 25}
                    innerRadius={outerRadius + 12}
                  />
                </g>
              )}
            >
              <Label content={renderCenterLabel} />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SectorCategoryPieChart;
