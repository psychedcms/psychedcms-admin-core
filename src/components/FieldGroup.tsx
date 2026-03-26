import { Box } from '@mui/material';
import { InputGuesser } from './InputGuesser.tsx';

interface FieldGroupProps {
  fields: string[];
  resource: string;
  disabled?: boolean;
}

/**
 * Renders a group of fields within a tab using InputGuesser.
 * When disabled, wraps fields in a read-only fieldset.
 */
export function FieldGroup({ fields, resource, disabled }: FieldGroupProps) {
  const content = fields.map((fieldName) => (
    <InputGuesser
      key={fieldName}
      source={fieldName}
      resource={resource}
    />
  ));

  if (disabled) {
    return (
      <Box
        component="fieldset"
        sx={{
          border: 'none', m: 0, p: 0,
          opacity: 0.7,
          pointerEvents: 'none',
        }}
        disabled
      >
        {content}
      </Box>
    );
  }

  return <>{content}</>;
}
