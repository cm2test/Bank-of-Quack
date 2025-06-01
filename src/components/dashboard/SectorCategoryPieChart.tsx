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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import TransactionList from "@/components/TransactionList";

const CHART_COLORS = [
  "#26A69A", // Teal
  "#80CBC4", // Light Teal
  "#B2DFDB", // Pale Teal
  "#FFF176", // Bright Yellow
  "#FFEB3B", // Standard Yellow
  "#FFD54F", // Gold Yellow
  "#AED581", // Light Green
  "#004D40", // Deep Teal (background match)
  //"#FFF9C4", // Pale Yellow
  //"#4DD0E1", // Cyan
  //"#81D4FA", // Light Blue
  //"#64B5F6", // Blue
  // Add more if needed
];

interface SectorCategoryPieChartProps {
  transactionsInDateRange: any[];
  categories: any[];
  sectors: any[];
  showValues?: boolean;
}

const SectorCategoryPieChart: React.FC<SectorCategoryPieChartProps> = ({
  transactionsInDateRange,
  categories,
  sectors,
  showValues = true,
}) => {
  // Aggregate sector totals
  const sectorTotals = useMemo(() => {
    const map: Record<string, number> = {};
    transactionsInDateRange
      .filter((t) => t.transaction_type === "expense")
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.category_id);
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
        if (!t.category_id) return;
        if (!sector.category_ids.includes(t.category_id)) return;
        map[t.category_id] = (map[t.category_id] || 0) + (t.amount || 0);
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
      const amountText = showValues
        ? formatMoney(pieData[activeIndex].value)
        : "•••••";
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
        if (!t.category_id) return;
        if (!sector.category_ids.includes(t.category_id)) return;
        map[t.category_id] = (map[t.category_id] || 0) + (t.amount || 0);
      });
    // Use correct sector total for percentage
    let totalSector = 0;
    if (selectedSectorId === "all") {
      totalSector = sectorTotals.find((p) => p.id === sector.id)?.value || 0;
    } else {
      totalSector = Object.values(map).reduce((sum, v) => sum + v, 0);
    }
    // Build and sort categories by amount descending
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
      .filter(Boolean)
      .sort(
        (a: { amount: number }, b: { amount: number }) => b.amount - a.amount
      ) as {
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

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("");

  return (
    <>
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
          <div className="w-full mt-6 mx-auto md:max-w-3xl">
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
                          <span className="text-left flex-1">
                            {sector.name}
                          </span>
                          <span className="text-right min-w-[120px] flex flex-col items-end">
                            {showValues ? formatMoney(sectorTotal) : "•••••"}
                            <span className="ml-2 text-xs text-muted-foreground block">
                              ({sectorPercent.toFixed(1)}%)
                            </span>
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          {categoriesBreakdown.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full px-2 py-2 place-items-center">
                              {categoriesBreakdown.map((cat) => {
                                const catObj = categories.find(
                                  (c) => c.id === cat.id
                                );
                                return (
                                  <div
                                    key={cat.id}
                                    className="flex flex-col items-center w-24 sm:w-28 cursor-pointer group"
                                    onClick={() => {
                                      setSelectedCategoryId(cat.id);
                                      setSelectedCategoryName(cat.name);
                                      setCategoryModalOpen(true);
                                    }}
                                  >
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted-foreground/10 flex items-center justify-center overflow-hidden border-2 border-yellow-400 shadow-sm mb-1 group-hover:scale-105 transition-transform">
                                      {catObj?.image_url ? (
                                        <img
                                          src={catObj.image_url}
                                          alt={cat.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-2xl text-muted-foreground">
                                          🗂️
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      className="text-xs font-semibold text-center truncate w-full"
                                      title={cat.name}
                                    >
                                      {cat.name}
                                    </div>
                                    <div className="text-sm font-bold text-center">
                                      {showValues
                                        ? formatMoney(cat.amount)
                                        : "•••••"}
                                    </div>
                                    <div className="text-xs text-muted-foreground text-center">
                                      ({cat.percentage.toFixed(1)}%)
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
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
      {/* Category Transactions Modal */}
      <Sheet open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <SheetContent
          side="right"
          className="max-w-lg w-full border-l border-border shadow-xl p-8 text-white"
          style={{
            background: "linear-gradient(to bottom, #004D40 0%, #26A69A 100%)",
          }}
        >
          <SheetHeader>
            <div className="flex items-center gap-3 py-2">
              {(() => {
                const catObj = categories.find(
                  (c) => c.id === selectedCategoryId
                );
                if (catObj?.image_url) {
                  return (
                    <img
                      src={catObj.image_url}
                      alt={selectedCategoryName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400 shadow-sm bg-white"
                    />
                  );
                } else {
                  return (
                    <span className="w-12 h-12 flex items-center justify-center rounded-full bg-muted-foreground/10 text-3xl border-2 border-yellow-400 shadow-sm">
                      🗂️
                    </span>
                  );
                }
              })()}
              <span className="text-xl font-bold text-white truncate">
                {selectedCategoryName}
              </span>
            </div>
          </SheetHeader>
          <div className="mt-4 max-h-[80vh] overflow-y-auto pr-2">
            <TransactionList
              transactions={transactionsInDateRange.filter(
                (t) => t.category_id === selectedCategoryId
              )}
              deleteTransaction={() => {}}
              showValues={showValues}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default SectorCategoryPieChart;
