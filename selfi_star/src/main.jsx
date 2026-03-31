import React from 'react'
import ReactDOM from 'react-dom/client'
import WerqRoot from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <WerqRoot />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
