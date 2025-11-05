import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CitizenLogin from '../CitizenLogin'

describe('CitizenLogin', () => {
  it('renders citizen login form', () => {
    render(
      <BrowserRouter>
        <CitizenLogin />
      </BrowserRouter>
    )
    
    expect(screen.getByText('🏠 Citizen Portal')).toBeDefined()
    expect(screen.getByPlaceholderText('Email')).toBeDefined()
    expect(screen.getByPlaceholderText('Password')).toBeDefined()
  })

  it('has navigation to other portals', () => {
    render(
      <BrowserRouter>
        <CitizenLogin />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Admin Portal')).toBeDefined()
    expect(screen.getByText('Driver Portal')).toBeDefined()
  })
})
