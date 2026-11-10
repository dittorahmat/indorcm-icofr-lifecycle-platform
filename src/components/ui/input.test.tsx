import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { Input } from './input'

describe('Input Component - Numeric Auto-select on Focus', () => {
  it('automatically selects text on focus for type="number"', async () => {
    render(<Input type="number" defaultValue="0" data-testid="num-input" />)
    const input = screen.getByTestId('num-input') as HTMLInputElement
    const selectSpy = vi.spyOn(input, 'select')

    fireEvent.focus(input)

    await waitFor(() => {
      expect(selectSpy).toHaveBeenCalled()
    })
  })

  it('automatically selects text on focus for inputMode="numeric"', async () => {
    render(<Input inputMode="numeric" defaultValue="150000" data-testid="numeric-mode-input" />)
    const input = screen.getByTestId('numeric-mode-input') as HTMLInputElement
    const selectSpy = vi.spyOn(input, 'select')

    fireEvent.focus(input)

    await waitFor(() => {
      expect(selectSpy).toHaveBeenCalled()
    })
  })

  it('automatically selects text on focus when selectOnFocus is explicitly true', async () => {
    render(<Input selectOnFocus defaultValue="custom" data-testid="select-focus-input" />)
    const input = screen.getByTestId('select-focus-input') as HTMLInputElement
    const selectSpy = vi.spyOn(input, 'select')

    fireEvent.focus(input)

    await waitFor(() => {
      expect(selectSpy).toHaveBeenCalled()
    })
  })

  it('does NOT auto-select normal text input by default', async () => {
    render(<Input type="text" defaultValue="Regular description text" data-testid="text-input" />)
    const input = screen.getByTestId('text-input') as HTMLInputElement
    const selectSpy = vi.spyOn(input, 'select')

    fireEvent.focus(input)

    expect(selectSpy).not.toHaveBeenCalled()
  })

  it('does NOT auto-select when selectOnFocus is explicitly false even if type is number', async () => {
    render(<Input type="number" selectOnFocus={false} defaultValue="123" data-testid="num-no-select" />)
    const input = screen.getByTestId('num-no-select') as HTMLInputElement
    const selectSpy = vi.spyOn(input, 'select')

    fireEvent.focus(input)

    expect(selectSpy).not.toHaveBeenCalled()
  })

  it('contains anti-stepper styling classes for spin buttons', () => {
    render(<Input type="number" data-testid="styled-num-input" />)
    const input = screen.getByTestId('styled-num-input')
    expect(input.className).toContain('[appearance:textfield]')
    expect(input.className).toContain('[&::-webkit-outer-spin-button]:appearance-none')
    expect(input.className).toContain('[&::-webkit-inner-spin-button]:appearance-none')
  })
})
