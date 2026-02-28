import { useEffect, useState } from "react";
import { TextInput } from "react-native-paper";

export default function DebouncedInput ({ label, value, onChange, ...props }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect (() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (text) => {
    setLocalValue(text);
    onChange(text);
  };

  return (
    <TextInput
      {...props}
      label={label}
      value={localValue}
      onChangeText={handleChange}
    />
  );
};