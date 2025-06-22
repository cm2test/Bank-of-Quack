import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter as FilterIcon, ArrowLeft, ArrowRight, X } from "lucide-react";
import { Category, Sector } from "@/types";
import {
  formatDateForInput,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getFirstDayOfYear,
  getLastDayOfYear,
} from "@/utils/dateUtils";

interface FilterSheetProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  descriptionFilter: string;
  setDescriptionFilter: (filter: string) => void;
  personInvolvementFilter: { user1: boolean; user2: boolean; shared: boolean };
  setPersonInvolvementFilter: (filter: any) => void;
  userNames: string[];
  categorySectorFilter: string;
  setCategorySectorFilter: (filter: string) => void;
  categories: Category[];
  sectors: Sector[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const FilterSheet: React.FC<FilterSheetProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  descriptionFilter,
  setDescriptionFilter,
  personInvolvementFilter,
  setPersonInvolvementFilter,
  userNames,
  categorySectorFilter,
  setCategorySectorFilter,
  categories,
  sectors,
  isOpen,
  setIsOpen,
}) => {
  const setDateRange = (range: "thisMonth" | "lastMonth" | "thisYear") => {
    const now = new Date();
    let start, end;
    if (range === "thisMonth") {
      start = getFirstDayOfMonth(now);
      end = getLastDayOfMonth(now);
    } else if (range === "lastMonth") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start = getFirstDayOfMonth(lastMonth);
      end = getLastDayOfMonth(lastMonth);
    } else if (range === "thisYear") {
      start = getFirstDayOfYear(now);
      end = getLastDayOfYear(now);
    }
    setStartDate(formatDateForInput(start!));
    setEndDate(formatDateForInput(end!));
  };

  const navigateDateRange = (direction: "prev" | "next") => {
    const currentMonthDate = new Date(
      `${startDate.substring(0, 8)}01T12:00:00`
    );

    if (direction === "prev") {
      currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    } else {
      currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    }

    const newStart = getFirstDayOfMonth(currentMonthDate);
    const newEnd = getLastDayOfMonth(currentMonthDate);

    setStartDate(formatDateForInput(newStart));
    setEndDate(formatDateForInput(newEnd));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="bg-gradient-to-b from-[#004D40] to-[#26A69A] border-none text-white w-full sm:w-3/4 md:w-1/2 lg:w-1/3 flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-white text-2xl">Filters</SheetTitle>
          <SheetDescription className="text-gray-300">
            Refine the dashboard data using the filters below.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDateRange("prev")}
                className="hover:bg-white/10"
              >
                <ArrowLeft />
              </Button>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Button
                  variant="outline"
                  onClick={() => setDateRange("thisMonth")}
                  className="bg-black/20 border-white/20 hover:bg-black/40"
                >
                  This Month
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDateRange("lastMonth")}
                  className="bg-black/20 border-white/20 hover:bg-black/40"
                >
                  Last Month
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDateRange("thisYear")}
                  className="bg-black/20 border-white/20 hover:bg-black/40"
                >
                  This Year
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateDateRange("next")}
                className="hover:bg-white/10"
              >
                <ArrowRight />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date" className="text-gray-300">
                From
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-black/20 border-white/20"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-gray-300">
                To
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-black/20 border-white/20"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category-sector-filter" className="text-gray-300">
              Filter by Category/Sector
            </Label>
            <Select
              value={categorySectorFilter}
              onValueChange={setCategorySectorFilter}
            >
              <SelectTrigger className="bg-black/20 border-white/20">
                <SelectValue placeholder="All Categories/Sectors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={`sector-${sector.id}`} value={sector.id}>
                    {sector.name} (Sector)
                  </SelectItem>
                ))}
                {categories.map((category) => (
                  <SelectItem
                    key={`category-${category.id}`}
                    value={category.id}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Show Data for</Label>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="user1-filter"
                  name="user1"
                  className="border-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  checked={personInvolvementFilter.user1}
                  onCheckedChange={(checked) =>
                    setPersonInvolvementFilter((prev: any) => ({
                      ...prev,
                      user1: checked,
                    }))
                  }
                />
                <Label htmlFor="user1-filter">{userNames[0]}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="user2-filter"
                  name="user2"
                  className="border-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  checked={personInvolvementFilter.user2}
                  onCheckedChange={(checked) =>
                    setPersonInvolvementFilter((prev: any) => ({
                      ...prev,
                      user2: checked,
                    }))
                  }
                />
                <Label htmlFor="user2-filter">{userNames[1]}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="shared-filter"
                  name="shared"
                  className="border-white data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  checked={personInvolvementFilter.shared}
                  onCheckedChange={(checked) =>
                    setPersonInvolvementFilter((prev: any) => ({
                      ...prev,
                      shared: checked,
                    }))
                  }
                />
                <Label htmlFor="shared-filter">Shared</Label>
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="description" className="text-gray-300">
              Filter by Description
            </Label>
            <Input
              id="description"
              placeholder="Search description..."
              value={descriptionFilter}
              onChange={(e) => setDescriptionFilter(e.target.value)}
              className="bg-black/20 border-white/20"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterSheet;
