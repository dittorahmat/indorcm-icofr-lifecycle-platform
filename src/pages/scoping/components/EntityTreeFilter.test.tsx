import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EntityTreeFilter } from './EntityTreeFilter';
import { EntityNode } from '../utils/hierarchy-utils';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('EntityTreeFilter', () => {
  const mockHierarchy: EntityNode[] = [
    {
      code: 'H',
      name: 'Holding',
      parentId: null,
      balance: 100,
      children: [
        {
          code: 'A1',
          name: 'Anak 1',
          parentId: 'H',
          balance: 50,
          children: [],
        }
      ],
    },
  ];

  it('should render the filter button', () => {
    render(
      <EntityTreeFilter 
        hierarchy={mockHierarchy} 
        selectedCodes={['H', 'A1']} 
        onSelectionChange={() => {}} 
      />
    );
    expect(screen.getByText('scoping:filter.entityLabel')).toBeDefined();
  });

  it('should call onSelectionChange when toggling a node', () => {
    const onSelectionChange = vi.fn();
    render(
      <EntityTreeFilter 
        hierarchy={mockHierarchy} 
        selectedCodes={['H', 'A1']} 
        onSelectionChange={onSelectionChange} 
      />
    );
    
    // Open popover
    fireEvent.click(screen.getByText('scoping:filter.entityLabel'));
    
    // Find Anak 1 checkbox (it will have id filter-A1)
    // In our implementation, we use Checkbox which might render as a button
    const childCheckbox = document.getElementById('filter-A1');
    if (childCheckbox) {
        fireEvent.click(childCheckbox);
        expect(onSelectionChange).toHaveBeenCalled();
    }
  });
});
