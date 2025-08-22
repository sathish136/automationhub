import { useState } from "react";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

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
  const [showInputs, setShowInputs] = useState(false);

  const formatDisplayDate = (date: string) => {
    if (!date) return "dd-mm-yyyy";
    const d = new Date(date);
    return d.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    if (!fromDate || (fromDate && toDate)) {
      // First selection or reset range
      onFromDateChange(dateStr);
      onToDateChange("");
    } else if (fromDate && !toDate) {
      // Second selection
      if (date >= new Date(fromDate)) {
        onToDateChange(dateStr);
      } else {
        onFromDateChange(dateStr);
        onToDateChange("");
      }
    }
  };

  const handleApply = () => {
    onRangeApply?.();
    setIsOpen(false);
  };

  const quickRanges = [
    { label: "Today", onClick: () => {
      const today = new Date().toISOString().split('T')[0];
      onFromDateChange(today);
      onToDateChange(today);
    }},
    { label: "Yesterday", onClick: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      onFromDateChange(dateStr);
      onToDateChange(dateStr);
    }},
    { label: "Last Week", onClick: () => {
      const today = new Date();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      onFromDateChange(weekAgo.toISOString().split('T')[0]);
      onToDateChange(today.toISOString().split('T')[0]);
    }},
    { label: "Last Month", onClick: () => {
      const today = new Date();
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      onFromDateChange(monthAgo.toISOString().split('T')[0]);
      onToDateChange(today.toISOString().split('T')[0]);
    }},
  ];

  return (
    <div className={`w-full max-w-sm ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="w-full cursor-pointer border rounded-lg overflow-hidden shadow-sm">
            {/* Purple Gradient Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium opacity-90 tracking-wider">DATE RANGE</div>
                  <div className="text-sm font-semibold">Select Date Range</div>
                </div>
                <Calendar className="w-5 h-5 opacity-90" />
              </div>
            </div>
            
            {/* Date Display */}
            <div className="bg-white p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">From</label>
                  <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    {formatDisplayDate(fromDate)}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">To</label>
                  <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
                    {formatDisplayDate(toDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="space-y-4">
              {/* Quick Range Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {quickRanges.map((range) => (
                  <Button
                    key={range.label}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      range.onClick();
                      handleApply();
                    }}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              
              {/* Toggle between calendar and inputs */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInputs(!showInputs)}
                  className="text-xs"
                >
                  {showInputs ? "Show Calendar" : "Manual Input"}
                </Button>
              </div>
              
              {showInputs ? (
                /* Manual Input Mode */
                <div className="space-y-3">
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
                </div>
              ) : (
                /* Calendar Mode */
                <div className="space-y-3">
                  <div className="text-xs text-gray-600 text-center">
                    {!fromDate ? "Select start date" : !toDate ? "Select end date" : "Range selected"}
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={fromDate ? new Date(fromDate) : undefined}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                    disabled={(date) => date > new Date()}
                  />
                </div>
              )}
              
              <div className="flex gap-2 pt-2 border-t">
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