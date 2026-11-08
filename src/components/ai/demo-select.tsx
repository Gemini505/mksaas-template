'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
export function DemoSelect({
  id,
  testId,
  value,
  values,
  onChange,
}: {
  id: string;
  testId: string;
  value: string;
  values: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} data-testid={testId} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align="start">
        {values.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
