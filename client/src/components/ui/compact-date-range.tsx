import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
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
  const [tempFromDate, setTempFromDate] = useState(fromDate);
  const [tempToDate, setTempToDate] = useState(toDate);

  // Sync temp state with props when they change
  useEffect(() => {
    setTempFromDate(fromDate);
    setTempToDate(toDate);
  }, [fromDate, toDate]);

  const formatDisplayDate = (date: string) => {
    if (!date) return "";
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${day} ${month} ${year}`;
  };

  const getDisplayText = () => {
    if (fromDate && toDate) {
      return `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`;
    }
    return "Select date range";
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    if (!tempFromDate || (tempFromDate && tempToDate)) {
      // First selection or reset range
      setTempFromDate(dateStr);
      setTempToDate("");
    } else if (tempFromDate && !tempToDate) {
      // Second selection
      if (date >= new Date(tempFromDate)) {
        setTempToDate(dateStr);
      } else {
        setTempFromDate(dateStr);
        setTempToDate("");
      }
    }
  };

  const applyDateRange = () => {
    onFromDateChange(tempFromDate);
    onToDateChange(tempToDate);
    onRangeApply?.();
    setIsOpen(false);
  };

  const quickRanges = [
    { 
      label: "Today", 
      onClick: () => {
        const today = new Date().toISOString().split('T')[0];
        onFromDateChange(today);
        onToDateChange(today);
        onRangeApply?.();
        setIsOpen(false);
      }
    },
    { 
      label: "Yesterday", 
      onClick: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        onFromDateChange(dateStr);
        onToDateChange(dateStr);
        onRangeApply?.();
        setIsOpen(false);
      }
    },
    { 
      label: "Last week", 
      onClick: () => {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        onFromDateChange(weekAgo.toISOString().split('T')[0]);
        onToDateChange(today.toISOString().split('T')[0]);
        onRangeApply?.();
        setIsOpen(false);
      }
    },
    { 
      label: "Last month", 
      onClick: () => {
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        onFromDateChange(monthAgo.toISOString().split('T')[0]);
        onToDateChange(today.toISOString().split('T')[0]);
        onRangeApply?.();
        setIsOpen(false);
      }
    },
    { 
      label: "Last quarter", 
      onClick: () => {
        const today = new Date();
        const quarterAgo = new Date();
        quarterAgo.setDate(quarterAgo.getDate() - 90);
        onFromDateChange(quarterAgo.toISOString().split('T')[0]);
        onToDateChange(today.toISOString().split('T')[0]);
        onRangeApply?.();
        setIsOpen(false);
      }
    },
  ];

  const reset = () => {
    onFromDateChange("");
    onToDateChange("");
    onRangeApply?.();
    setIsOpen(false);
  };

  return (
    <div className={`w-auto ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="justify-between h-8 px-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <span>{getDisplayText()}</span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Left side - Quick options */}
            <div className="w-32 p-3 border-r border-gray-200 bg-gray-50">
              <div className="space-y-1">
                {quickRanges.map((range) => (
                  <button
                    key={range.label}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    onClick={range.onClick}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
              <button
                className="w-full text-left px-2 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded mt-4"
                onClick={reset}
              >
                Reset
              </button>
            </div>
            
            {/* Right side - Calendar */}
            <div className="p-3">
              <CalendarComponent
                mode="single"
                selected={tempFromDate ? new Date(tempFromDate) : undefined}
                onSelect={handleDateSelect}
                className="rounded-md border-0"
                disabled={(date) => date > new Date()}
              />
              
              {/* Apply button - only show if dates are selected */}
              {tempFromDate && (
                <div className="mt-3 pt-2 border-t">
                  <Button
                    onClick={applyDateRange}
                    size="sm"
                    className="w-full"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}