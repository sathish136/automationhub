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
    <div className={`w-full max-w-sm ${className}`}>
      {/* Compact Purple Gradient Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 rounded-t-lg h-2"></div>
      
      {/* Compact Date Inputs */}
      <div className="bg-white p-2 rounded-b-lg border border-t-0 border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">From</label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none pr-6"
                placeholder="dd-mm-yyyy"
                data-testid="date-range-from"
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">To</label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none pr-6"
                placeholder="dd-mm-yyyy"
                data-testid="date-range-to"
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {(fromDate || toDate) && (
            <button 
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors mt-4"
              data-testid="date-range-clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}