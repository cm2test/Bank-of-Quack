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
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

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
      const cx = viewBox.cx;
      const cy = viewBox.cy;
      // Prepare text values
      const amountText = formatMoney(pieData[activeIndex].value);
      const nameText = pieData[activeIndex].name;
      // Font sizes
      const amountFontSize = 22;
      const nameFontSize = 15;
      return (
        <g>
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none"
          >
            <tspan
              className="fill-white text-2xl font-bold"
              style={{ fontSize: amountFontSize }}
              x={cx}
              dy={0}
            >
              {amountText}
            </tspan>
          </text>
          <text
            x={cx}
            y={cy + amountFontSize / 2 + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none"
          >
            <tspan
              className="fill-white text-base"
              style={{ fontSize: nameFontSize, opacity: 0.85 }}
              x={cx}
              dy={0}
            >
              {nameText}
            </tspan>
          </text>
        </g>
      );
    }
    return null;
  };

  // Helper to format money
  const formatMoney = (amount: number) =>
    `$${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Calculate total for percentage
  const total = sectorTotals.reduce((sum, item) => sum + item.value, 0);

  // Text breakdown data
  let breakdownSectors: typeof sectors = [];
  if (selectedSectorId === "all") {
    breakdownSectors = sectors.filter((s) =>
      pieData.find((p) => p.id === s.id)
    );
  } else {
    const sector = sectors.find((s) => s.id === selectedSectorId);
    breakdownSectors = sector ? [sector] : [];
  }
  // Sort breakdownSectors by value descending
  breakdownSectors = breakdownSectors.slice().sort((a, b) => {
    const aValue = sectorTotals.find((p) => p.id === a.id)?.value || 0;
    const bValue = sectorTotals.find((p) => p.id === b.id)?.value || 0;
    return bValue - aValue;
  });

  // For each sector, get its categories and totals
  const getCategoryBreakdown = (sector: any) => {
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
    // Use correct sector total for percentage
    let totalSector = 0;
    if (selectedSectorId === "all") {
      totalSector = sectorTotals.find((p) => p.id === sector.id)?.value || 0;
    } else {
      totalSector = Object.values(map).reduce((sum, v) => sum + v, 0);
    }
    return sector.category_ids
      .map((catId: string) => {
        const cat = categories.find((c) => c.id === catId);
        const amount = map[catId] || 0;
        return cat && amount > 0
          ? {
              id: cat.id,
              name: cat.name,
              amount,
              percentage: totalSector > 0 ? (amount / totalSector) * 100 : 0,
            }
          : null;
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      amount: number;
      percentage: number;
    }[];
  };

  // State for expanded accordions
  const [expandedSectors, setExpandedSectors] = useState<string[]>([]);

  // Helper to get all sector ids in breakdown
  const allSectorIds = breakdownSectors.map((s) => s.id);
  const allExpanded =
    expandedSectors.length === allSectorIds.length && allSectorIds.length > 0;

  // Handler for expand/collapse all
  const handleExpandCollapseAll = () => {
    if (allExpanded) {
      setExpandedSectors([]);
    } else {
      setExpandedSectors(allSectorIds);
    }
  };

  // Sync expanded sectors when breakdownSectors changes
  React.useEffect(() => {
    setExpandedSectors([]);
  }, [selectedSectorId, breakdownSectors.length]);

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
      <CardContent className="flex flex-col items-center pb-0">
        <ChartContainer
          id="sector-category-pie"
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[300px]"
        >
          <PieChart>
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
        {/* Text breakdown below the chart */}
        <div className="w-full max-w-[400px] mt-6">
          {breakdownSectors.length === 0 ? (
            <p className="text-muted-foreground text-center">
              No data to show.
            </p>
          ) : (
            <>
              {breakdownSectors.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mb-2 ml-auto block"
                  onClick={handleExpandCollapseAll}
                >
                  {allExpanded ? "Collapse All" : "Expand All"}
                </Button>
              )}
              <Accordion
                type="multiple"
                value={expandedSectors}
                onValueChange={setExpandedSectors}
              >
                {breakdownSectors.map((sector) => {
                  const sectorTotal =
                    sectorTotals.find((p) => p.id === sector.id)?.value || 0;
                  const sectorPercent =
                    total > 0 ? (sectorTotal / total) * 100 : 0;
                  const categoriesBreakdown = getCategoryBreakdown(sector);
                  return (
                    <AccordionItem key={sector.id} value={sector.id}>
                      <AccordionTrigger className="flex items-center font-bold text-base px-0">
                        <span className="text-left flex-1">{sector.name}</span>
                        <span className="text-right min-w-[120px] flex flex-col items-end">
                          {formatMoney(sectorTotal)}
                          <span className="ml-2 text-xs text-muted-foreground block">
                            ({sectorPercent.toFixed(1)}%)
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        {categoriesBreakdown.length > 0 && (
                          <ul className="mt-1 ml-4 space-y-1">
                            {categoriesBreakdown.map((cat) => (
                              <li key={cat.id} className="flex justify-between">
                                <span className="text-sm">{cat.name}</span>
                                <span className="text-sm">
                                  {formatMoney(cat.amount)}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({cat.percentage.toFixed(1)}%)
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorCategoryPieChart;
