import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Cache Monitor Dashboard &copy; {new Date().getFullYear()}
          </p>
          <div className="mt-2 md:mt-0 flex gap-4">
            <a 
              href="#" 
              className="hover:text-blue-500 transition-colors"
            >
              Documentation
            </a>
            <a 
              href="#" 
              className="hover:text-blue-500 transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="hover:text-blue-500 transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;