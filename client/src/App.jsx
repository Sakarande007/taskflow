import { Outlet } from 'react-router-dom'
import './App.css'
import Header from './components/HEader.jsx'
import Footer from './components/Footer.jsx'


function App() {

  return (
  <>
    <Header/>
    <main className='min-h-[75vh]'>
      <Outlet/>
    </main>
    <Footer/>
    
    </>
  )
}

export default App
