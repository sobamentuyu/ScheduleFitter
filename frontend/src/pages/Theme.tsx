import { Link } from "react-router-dom";

export function Theme() {
  return (
    <div className="flex flex-col justify-center items-center mt-6 mx-20 gap-4">
      <button
        onClick={() => setTheme("blue")}
        className="flex justify-center items-center bg-secondary text-primary-content rounded-lg w-full sm:w-[1200px] py-1"
      >
        <span className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-white"></span>
        <span className="ml-2 text-primary-content text-xl">Blue</span>
      </button>
      <button
        onClick={() => setTheme("green")}
        className="flex justify-center items-center bg-secondary text-primary-content rounded-lg w-full sm:w-[1200px] py-1"
      >
        <span className="w-4 h-4 rounded-full bg-green-500 ring-2 ring-white"></span>
        <span className="ml-2 text-primary-content text-xl">Green</span>
      </button>
      <button
        onClick={() => setTheme("red")}
        className="flex justify-center items-center bg-secondary text-primary-content rounded-lg w-full sm:w-[1200px] py-1"
      >
        <span className="w-4 h-4 rounded-full bg-red-500 ring-2 ring-white"></span>
        <span className="ml-2 text-primary-content text-xl">Red</span>
      </button>
      <button
        onClick={() => setTheme("pink")}
        className="flex justify-center items-center bg-secondary text-primary-content rounded-lg w-full sm:w-[1200px] py-1"
      >
        <span className="w-4 h-4 rounded-full bg-pink-500 ring-2 ring-white"></span>
        <span className="ml-2 text-primary-content text-xl">Pink</span>
      </button>
      <button
        onClick={() => setTheme("purple")}
        className="flex justify-center items-center bg-secondary text-primary-content rounded-lg w-full sm:w-[1200px] py-1"
      >
        <span className="w-4 h-4 rounded-full bg-secondary ring-2 ring-white"></span>
        <span className="ml-2 text-primary-content text-xl">Purple</span>
      </button>
      <button
        onClick={() => setTheme("orange")}
        className="flex justify-center items-center bg-secondary text-primary-content rounded-lg w-full sm:w-[1200px] py-1"
      >
        <span className="w-4 h-4 rounded-full bg-orange-500 ring-2 ring-white"></span>
        <span className="ml-2 text-primary-content text-xl">Orange</span>
      </button>
      <button
        onClick={() => setTheme("yellow")}
        className="flex justify-center items-center bg-secondary text-primary-content rounded-lg w-full sm:w-[1200px] py-1"
      >
        <span className="w-4 h-4 rounded-full bg-yellow-500 ring-2 ring-white"></span>
        <span className="ml-2 text-primary-content text-xl">Yellow</span>
      </button>
    </div>
  );
}
