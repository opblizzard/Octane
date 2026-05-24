import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { applyTokens } from '@theme/tokens'

applyTokens()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
