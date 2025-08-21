import { Calendar, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CompactDateRangeProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onClear?: () => void;
  className?: string;
}

export function CompactDateRange({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
  className = ""
}: CompactDateRangeProps) {
  const handleClear = () => {
    onFromDateChange("");
    onToDateChange("");
    onClear?.();
  };

  return (
    <div className={`w-full max-w-lg ${className}`}>
      {/* Purple Gradient Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 text-white p-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium opacity-90">DATE RANGE</div>
            <div className="text-sm font-semibold">Select Date Range</div>
          </div>
          {(fromDate || toDate) && (
            <button 
              onClick={handleClear}
              className="text-white/80 hover:text-white transition-colors"
              data-testid="date-range-clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Date Inputs */}
      <div className="bg-gray-50 border border-t-0 rounded-b-lg p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">From</label>
            <div className="relative">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="pr-8"
                data-testid="date-range-from"
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">To</label>
            <div className="relative">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                placeholder="dd-mm-yyyy"
                className="pr-8"
                data-testid="date-range-to"
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}