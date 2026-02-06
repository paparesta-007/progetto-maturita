
import { Telescope } from "lucide-react";
import React, { useState, useEffect } from "react";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const socialButtonStyle = "flex items-center justify-center border border-neutral-200 rounded-lg p-3 w-full mt-3 transition-colors hover:bg-neutral-50 active:scale-[0.98]";
    return (

        <div className="border border-neutral-200 text-neutral-900 p-6 max-w-md mx-auto mt-20 rounded-lg ">
            <div className="fixed top-2 left-2 flex items-center gap-2"><Telescope className="bg-neutral-900 text-white p-2 rounded-md" size={32}/>
            <span className="text-neutral-900 font-semibold text-lg">SmartAI</span></div>
            <h1 className="text-2xl font-semibold mb-2">Welcome back!</h1>
            <p className="mb-6 text-neutral-500 text-sm">You are a step away from logging in to your account.</p>
            <div className="flex flex-col gap-4">
                <div >
                    <input
                        type="email"
                        required
                        className="border border-neutral-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        required
                        className="border border-neutral-200 p-3 rounded-lg w-full focus:ring-2 focus:ring-neutral-900 outline-none transition-all"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>
            <button className="bg-neutral-900 text-white py-3 hover:bg-neutral-800 transition-all px-4 rounded-md mt-4 w-full">Login</button>
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-200"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-neutral-500">Oppure continua con</span></div>
            </div>
            <div className="space-y-2">
                <button className={socialButtonStyle}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/GitHub_Invertocat_Logo.svg/250px-GitHub_Invertocat_Logo.svg.png" alt="" className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">GitHub</span>
                </button>

                <button className={socialButtonStyle}>
                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJg75LWB1zIJt1VTZO7O68yKciaDSkk3KMdw&s" alt="" className="w-5 h-5 mr-3" />
                    <span className="text-sm font-medium">Google</span>
                </button>
            </div>
            <p className="mt-4 text-center text-sm text-neutral-600">Don't have an account? <a href="/signup" className="text-neutral-900 hover:underline">Sign up</a></p>
        </div>
    )
}

export default LoginPage;