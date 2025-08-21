import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface CompactDateRangeProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onRangeApply?: () => void;
  className?: string;
}

export function CompactDateRange({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onRangeApply,
  className = ""
}: CompactDateRangeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDisplayDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  const getDisplayText = () => {
    if (fromDate && toDate) {
      return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`;
    } else if (fromDate) {
      return `From ${formatDisplayDate(fromDate)}`;
    } else if (toDate) {
      return `Until ${formatDisplayDate(toDate)}`;
    }
    return "Select Date Range";
  };

  const handleApply = () => {
    onRangeApply?.();
    setIsOpen(false);
  };

  return (
    <div className={`w-full max-w-md ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="w-full cursor-pointer">
            {/* Purple Gradient Header */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600 text-white p-3 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium opacity-90">DATE RANGE</div>
                  <div className="text-sm font-semibold">{getDisplayText()}</div>
                </div>
                <CalendarDays className="w-5 h-5 opacity-90" />
              </div>
            </div>
            
            {/* Date Inputs Preview */}
            <div className="bg-gray-50 border border-t-0 rounded-b-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">From</label>
                  <div className="text-sm text-gray-800 bg-white border rounded px-2 py-1.5 min-h-[32px] flex items-center">
                    {fromDate ? formatDisplayDate(fromDate) : "dd-mm-yyyy"}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">To</label>
                  <div className="text-sm text-gray-800 bg-white border rounded px-2 py-1.5 min-h-[32px] flex items-center">
                    {toDate ? formatDisplayDate(toDate) : "dd-mm-yyyy"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-3">Select Date Range</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">From</label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => onFromDateChange(e.target.value)}
                    className="text-sm"
                    data-testid="date-range-from"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">To</label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => onToDateChange(e.target.value)}
                    className="text-sm"
                    data-testid="date-range-to"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleApply} 
                  size="sm" 
                  className="flex-1"
                  disabled={!fromDate && !toDate}
                  data-testid="date-range-apply"
                >
                  Apply
                </Button>
                <Button 
                  onClick={() => {
                    onFromDateChange("");
                    onToDateChange("");
                    onRangeApply?.();
                    setIsOpen(false);
                  }} 
                  variant="outline" 
                  size="sm"
                  data-testid="date-range-clear"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}