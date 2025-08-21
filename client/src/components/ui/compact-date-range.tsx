import { Calendar, X } from "lucide-react";

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
    <div className={`w-full max-w-md ${className}`}>
      {/* Purple Gradient Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 text-white px-4 py-3 rounded-t-xl">
        <div className="text-xs font-medium opacity-90">DATE RANGE</div>
        <div className="text-sm font-semibold">Select Date Range</div>
      </div>
      
      {/* Date Inputs */}
      <div className="bg-white p-4 rounded-b-xl border border-t-0 border-gray-200">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-sm text-gray-700 block mb-2">From</label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm pr-10"
                placeholder="dd-mm-yyyy"
                data-testid="date-range-from"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="text-sm text-gray-700 block mb-2">To</label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm pr-10"
                placeholder="dd-mm-yyyy"
                data-testid="date-range-to"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {(fromDate || toDate) && (
            <button 
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors mb-1"
              data-testid="date-range-clear"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}