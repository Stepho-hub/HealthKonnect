import { SignIn } from '@clerk/clerk-react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/signup"
          redirectUrl="/"
          appearance={{
            baseTheme: undefined,
            variables: {
              colorPrimary: '#dc2626',
              colorBackground: '#ffffff',
              colorInputBackground: '#f8fafc',
              colorInputText: '#1e293b',
            },
            elements: {
              formButtonPrimary: 'bg-gradient-to-r from-red-600 via-pink-500 to-orange-500 hover:opacity-90',
              card: 'shadow-lg rounded-xl',
            }
          }}
        />
      </div>
    </div>
  );
};

export default Login;