import { InputGuesser } from './InputGuesser.tsx';

interface FieldGroupProps {
  fields: string[];
  resource: string;
}

/**
 * Renders a group of fields within a tab using InputGuesser.
 */
export function FieldGroup({ fields, resource }: FieldGroupProps) {
  return (
    <>
      {fields.map((fieldName) => (
        <InputGuesser
          key={fieldName}
          source={fieldName}
          resource={resource}
        />
      ))}
    </>
  );
}
