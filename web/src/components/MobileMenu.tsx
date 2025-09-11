import React, { useState } from 'react';

const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button 
        className="sm:hidden text-blue-900 hover:text-blue-600" 
        onClick={toggleMenu}
        aria-label="Toggle mobile menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
      
      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="sm:hidden fixed inset-0 z-50" onClick={toggleMenu}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Dropdown menu */}
          <div className="absolute top-16 right-4 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px]">
            {/* Close button */}
            <div className="flex justify-end p-3 border-b border-gray-100">
              <button 
                onClick={toggleMenu}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Menu items */}
            <ul className="py-2">
              <li>
                <a 
                  href="https://www.linkedin.com/in/cdrewjep" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={toggleMenu}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/DrewJep" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={toggleMenu}
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="mailto:drewjepsen13@gmail.com" 
                  className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={toggleMenu}
                >
                  Email
                </a>
              </li>
              <li>
                <a 
                  href="/drew-resume-2025.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={toggleMenu}
                >
                  Resume
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileMenu;
