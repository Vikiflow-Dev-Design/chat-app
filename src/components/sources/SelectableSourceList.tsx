import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { SelectableSourceItem } from "./SelectableSourceItem";

interface Source {
  id: string;
  title: string;
  type: string;
  size?: string;
  isNew?: boolean;
  lastUpdated?: string;
  status?: string;
  optimizationInfo?: string;
}

interface SelectableSourceListProps {
  title: string;
  icon: React.ReactNode;
  sources: Source[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onDeleteMultiple?: (ids: string[]) => void;
}

export function SelectableSourceList({
  title,
  icon,
  sources,
  onView,
  onEdit,
  onDelete,
  onDeleteMultiple,
}: SelectableSourceListProps) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reset selection when sources change
  useEffect(() => {
    setSelectedSources([]);
    setSelectAll(false);
  }, [sources]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSources(sources.map((source) => source.id));
    } else {
      setSelectedSources([]);
    }
  };

  const handleSelectSource = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedSources((prev) => [...prev, id]);
    } else {
      setSelectedSources((prev) => prev.filter((sourceId) => sourceId !== id));
    }
  };

  const handleDeleteSelected = () => {
    if (onDeleteMultiple && selectedSources.length > 0) {
      onDeleteMultiple(selectedSources);
      setSelectedSources([]);
      setSelectAll(false);
    }
  };

  // Update selectAll state when individual selections change
  useEffect(() => {
    if (sources.length === 0) {
      setSelectAll(false);
    } else {
      setSelectAll(selectedSources.length === sources.length);
    }
  }, [selectedSources, sources]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-700">
            {title}
            <span className="ml-2 text-xs text-gray-500">
              ({sources.length})
            </span>
          </h3>
        </div>

        {selectedSources.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {selectedSources.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="h-8 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        ) : sources.length > 1 ? (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectAll}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
              id={`select-all-${title}`}
            />
            <label
              htmlFor={`select-all-${title}`}
              className="text-xs text-gray-500 cursor-pointer"
            >
              Select all
            </label>
          </div>
        ) : null}
      </div>

      <Separator className="my-2" />

      {sources.length === 0 ? (
        <div className="py-4 text-center text-sm text-gray-500">
          No {title.toLowerCase()} found
        </div>
      ) : (
        <div className="space-y-1">
          {sources.map((source) => (
            <SelectableSourceItem
              key={source.id}
              id={source.id}
              title={source.title}
              type={source.type}
              size={source.size}
              isNew={source.isNew}
              lastUpdated={source.lastUpdated}
              status={source.status}
              optimizationInfo={source.optimizationInfo}
              selected={selectedSources.includes(source.id)}
              onSelect={handleSelectSource}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
