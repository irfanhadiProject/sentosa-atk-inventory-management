import { useEffect, useRef, useState } from "react";
import { TextInput } from "react-native-paper";

export default function DebouncedInput ({ label, value, onChange, delay = 500, ...props }) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef(null);

  useEffect (() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (text) => {
    setLocalValue(text);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      onChange(text);
    }, delay);
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