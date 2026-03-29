import React from 'react'
import { FaSquareFacebook} from "react-icons/fa6";
import { BsInstagram } from "react-icons/bs";
import { FaLinkedin } from "react-icons/fa";



function Footer() {
  return (
   <footer className="text-center bg-gray-100 ">
    <div className = 'container mx-auto p-4 text-center flex-col lg:flex-row lg:justify-between gap-2'>
       <p> © 2025 TaskFlow. All rights reserved.</p>
        
        <div className='mx-auto p-4 flex items-center gap-4 justify-center text-2xl'>
           <a href='' className='hover:text-amber-200'>
            <FaSquareFacebook /> 
            </a>
            <a href='' className='hover:text-amber-200'>
           <BsInstagram />
            </a>
            <a href='' className='hover:text-amber-200'>
            <FaLinkedin />
            </a>
        </div>
        </div>
   </footer>
  )
}

export default Footer
