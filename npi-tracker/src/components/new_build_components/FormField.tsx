// FormField.tsx
import { Input, InfoLabel } from "@fluentui/react-components";
import type { BuildData } from "../../models/BuildData";

interface FormFieldProps {
  label: string;
  field: keyof BuildData["orderDetails"];
  value: string;
  maxlen: number;
  onChange: (field: keyof BuildData["orderDetails"], value: string) => void;
  disabled?: boolean;
}

export default function FormField({
  label,
  field,
  value,
  maxlen,
  onChange,
  disabled,
}: FormFieldProps) {
  return (
    <>
      <InfoLabel>{label}</InfoLabel>
      <Input
        className="ord-details-input"
        value={value}
        maxLength={maxlen}
        disabled={disabled}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </>
  );
}