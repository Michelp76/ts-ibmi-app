import { createRoot } from 'react-dom/client'
import 'tailwindcss/tailwind.css'
import App from 'components/App'

const container = document.getElementById('root') as HTMLDivElement
container.className = "bg-gray-200 font-ibm-plex-sans"
const root = createRoot(container)

root.render(<App />)
