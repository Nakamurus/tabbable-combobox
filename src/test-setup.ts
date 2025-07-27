import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

// Global test setup
beforeEach(() => {
  // Clear any portals/document.body modifications between tests
  document.body.innerHTML = '<div id="root"></div>'
})