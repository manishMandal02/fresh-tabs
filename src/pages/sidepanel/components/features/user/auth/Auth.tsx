import TextInput from '@root/src/components/TextInput/TextInput';
import { useState } from 'react';

const GoogleIcon = () => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    className="size-[20px] mr-3"
    viewBox="0 0 48 48"
    xmlnsXlink="http://www.w3.org/1999/xlink">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);

const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const Auth = () => {
  const [email, setEmail] = useState('');

  return (
    <div className="h-screen w-screen text-slate-300/90 p-6 flex flex-col items-center justify-start overflow-hidden">
      <h1 className="text-[22px] font-light text-slate-500 tracking-[0.3] mt-6">FreshTabs</h1>

      <div className="mt-12 flex flex-col items-center justify-center w-full">
        <h2 className="text-[18px] font-light text-slate-500 tracking-[0.35] mb-6">SingIn</h2>
        <div className="flex flex-col items-start justify-center w-[75%]">
          <label htmlFor="user-email" className="text-[13.5px] text-slate-400/90 font-light mb-1.5">
            SingIn with magic link
          </label>
          <TextInput onChange={setEmail} placeholder="Email..." value={email} id={'user-email'} />
          <button
            disabled={email.length > 4 ? !emailRegex.test(email.trim()) : true}
            className={`mt-5 py-2 w-full text-[13.5px] text-slate-800/90 font-semibold flex items-center justify-center bg-brand-primary/95 rounded mx-auto
                        hover:opacity-95 duration-300  transition-all disabled:bg-slate-700 disabled:text-slate-300/70 disabled:cursor-default 
                         outline-none border-[2px] border-transparent focus-within:border-slate-300
                        `}>
            Send Link
          </button>
        </div>

        <div className="text-[13px] text-slate-500/90 font-light my-3 text-center">---- or ----</div>

        <button className="px-[18px] py-2 text-[13.5px] flex items-center font-semibold text-slate-800/90 bg-slate-100/90 rounded outline-none border-[2px] border-transparent focus-within:border-gray-400">
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Auth;
