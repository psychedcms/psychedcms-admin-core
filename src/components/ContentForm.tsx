import { useState } from 'react';
import {
  SimpleForm,
  useResourceContext,
  useTranslate,
} from 'react-admin';
import { Box, Card, Tab, Tabs } from '@mui/material';

import { FormHookSlot } from '../slots/FormHookSlot.tsx';
import { usePsychedSchema } from '../hooks/usePsychedSchema.ts';
import { FieldGroup } from './FieldGroup.tsx';
import { EditSidebar } from './EditSidebar.tsx';
import type { FieldMetadata } from '../types/psychedcms.ts';

interface ContentFormProps {
  resource?: string;
}

const HARDCODED_SIDEBAR_FIELDS = new Set(['status', 'publishedAt', 'depublishedAt']);

function humanizeGroupName(group: string): string {
  const abbreviations: Record<string, string> = {
    seo: 'SEO',
    url: 'URL',
    api: 'API',
    id: 'ID',
    html: 'HTML',
    css: 'CSS',
  };

  if (abbreviations[group.toLowerCase()]) {
    return abbreviations[group.toLowerCase()];
  }

  return group
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ContentFormLayout({
  resource,
  groupOrder,
  groupedFields,
}: {
  resource: string;
  groupOrder: string[];
  groupedFields: Map<string, string[]>;
}) {
  const translate = useTranslate();
  const [activeTab, setActiveTab] = useState(0);
  const hasTabs = groupOrder.length > 1;

  return (
    <>
      <FormHookSlot resource={resource} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
          width: '100%',
          alignItems: 'start',
        }}
      >
        {/* Left block: tabbed form fields */}
        <Card sx={{ p: 2 }} variant="outlined">
          {hasTabs && (
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {groupOrder.map((group) => {
                const translationKey = `psyched.groups.${group}`;
                const translated = translate(translationKey);
                const tabLabel = translated !== translationKey ? translated : humanizeGroupName(group);
                return <Tab key={group} label={tabLabel} />;
              })}
            </Tabs>
          )}

          {groupOrder.map((group, index) => {
            const fields = groupedFields.get(group) ?? [];
            if (hasTabs) {
              return (
                <Box key={group} sx={{ display: activeTab === index ? 'block' : 'none' }}>
                  <FieldGroup fields={fields} resource={resource} />
                </Box>
              );
            }
            return <FieldGroup key={group} fields={fields} resource={resource} />;
          })}
        </Card>

        {/* Right block: sidebar */}
        <Box sx={{ minWidth: 280 }}>
          <EditSidebar resource={resource} />
        </Box>
      </Box>
    </>
  );
}

/**
 * Two-column content form layout.
 * Left (2/3): Card with tabbed form fields
 * Right (1/3): Sidebar with save button, workflow, and publication options
 */
export function ContentForm({ resource: resourceProp }: ContentFormProps) {
  const resourceFromContext = useResourceContext();
  const resource = resourceProp ?? resourceFromContext ?? '';
  const resourceSchema = usePsychedSchema(resource);

  const groupedFields = groupFieldsByGroup(resourceSchema?.fields);
  const groupOrder = getGroupOrder(resourceSchema?.fields);

  return (
    <SimpleForm toolbar={false} sx={{ p: 0, '& .RaSimpleForm-form': { width: '100%' } }}>
      <ContentFormLayout
        resource={resource}
        groupOrder={groupOrder}
        groupedFields={groupedFields}
      />
    </SimpleForm>
  );
}

function isFormVisible(metadata: FieldMetadata): boolean {
  return metadata.type !== 'hidden' && !metadata.readonly;
}

function isSidebarField(fieldName: string, metadata: { group?: string }): boolean {
  return HARDCODED_SIDEBAR_FIELDS.has(fieldName) || metadata.group === 'sidebar';
}

function groupFieldsByGroup(
  fields: Map<string, FieldMetadata> | undefined
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  if (!fields) return groups;

  for (const [fieldName, metadata] of fields) {
    if (isSidebarField(fieldName, metadata)) continue;
    if (!isFormVisible(metadata)) continue;

    const group = metadata.group ?? 'general';
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(fieldName);
  }

  return groups;
}

function getGroupOrder(fields: Map<string, FieldMetadata> | undefined): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  if (!fields) return order;

  for (const [fieldName, metadata] of fields) {
    if (isSidebarField(fieldName, metadata)) continue;
    if (!isFormVisible(metadata)) continue;

    const group = metadata.group ?? 'general';
    if (!seen.has(group)) {
      seen.add(group);
      order.push(group);
    }
  }

  return order;
}
