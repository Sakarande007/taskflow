import React from 'react'
import { Link, useNavigate} from 'react-router-dom'

function Header() {
  const Navigate = useNavigate();
  // Function to handle navigation to About page
  const RedirectToAbout = () => {
    Navigate('/about');
  }

   // Function to handle navigation to Home page
  const RedirectToHome = () => {
    Navigate('/');
  }

   // Function to handle navigation to Contact page
  const RedirectToContact = () => {
    Navigate('/contact');
  }

   // Function to handle navigation to Login page
  const RedirectToLogin = () => {
    Navigate('/login');
  }

  

  return (
   <>
    <div className='h-20 shadow-md sticky top-0 '>
      <div className='container mx-auto h-full flex items-center justify-between px-4'>
        <Link to={"/"} className='text-2xl font-bold hover:text-amber-300'>TaskFlow</Link>
        
          <div className='flex space-x-4'>
             <button className='bg-amber-300 text-white px-4 py-2 rounded hover:bg-amber-400'
            onClick={RedirectToHome}>Home</button>

            <button className='bg-amber-300 text-white px-4 py-2 rounded hover:bg-amber-400'
            onClick={RedirectToAbout}>About</button>

             <button className='bg-amber-300 text-white px-4 py-2 rounded hover:bg-amber-400'
            onClick={RedirectToContact}>Contact</button>

            <button className='bg-amber-300 text-white px-4 py-2 rounded hover:bg-amber-400'
            onClick={RedirectToLogin}>Login</button>
          
          </div>
        
      </div>

    </div>
   </>
  )
}

export default Header
